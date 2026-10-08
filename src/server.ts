/**
 * MCP server factory for ethics-for-ai-mcp.
 *
 * Surface (per spec):
 *   - 10 read-only tools
 *   - 9 resources under the `ethics://` scheme
 *   - 1 prompt: `daily_reflection`
 *
 * Design notes:
 *   - Every tool returns `{ structuredContent, content: [{type:'text',text}] }`.
 *   - Errors are returned as structured results, never thrown to the client.
 *   - All output is a pure function of the static, versioned curriculum.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  CURRICULUM_VERSION,
  MODULE_META,
  getModuleItems,
  getItem,
  searchCurriculum,
  enrichedBlock,
  type CurriculumItem,
  type ModuleId,
} from './curriculum.js';
import {
  composeEdition,
  digestForWeek,
  listEditions,
  editionsSince,
  toIsoDate,
} from './rotation.js';

// ── Shared server identity + tool annotations ──
// M8ven Trust Index / OpenAI MCP directory reject any tool missing the four explicit
// boolean hints. Every tool here is a pure, read-only function of the static, versioned
// curriculum, so the same read-only annotation set applies to all of them.
const SERVER_NAME = 'ethics-for-ai-mcp';

const TOOL_ANNOTATIONS = {
  readOnly: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Zod input schemas

const dateOpt = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();

const dailyFeedInput = z.object({
  date: dateOpt.describe('YYYY-MM-DD. Defaults to today (UTC).'),
});

const feedSinceInput = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date YYYY-MM-DD.'),
  days: z.number().int().min(1).max(60).default(7).describe('Number of consecutive days to return.'),
});

const listEditionsInput = z.object({
  days: z.number().int().min(1).max(60).default(7).describe('How many days back from today to list.'),
});

const digestInput = z.object({
  date: dateOpt.describe('Any date in the week. Defaults to today; returns that week’s Sunday digest.'),
});

const moduleIndexInput = z.object({
  index: z.number().int().min(0).optional().describe('Zero-based item index within the module. Omit for the whole module.'),
});

const searchInput = z.object({
  query: z.string().min(1).max(200).describe('Free-text query across all curriculum items.'),
});

// ────────────────────────────────────────────────────────────────────────────
// Server factory

export function createMcpServer() {
  const server = new Server(
    { name: SERVER_NAME, version: CURRICULUM_VERSION },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );

  // ─── Tools ───
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_daily_feed',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'Today’s (or a given date’s) deterministic ethics edition: one primary item plus a companion from a neighbouring module.',
        inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD, optional (defaults to today UTC).' } } },
      },
      {
        name: 'get_feed_since',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'Return a run of daily editions starting from a date, for N days. Each edition is a pure function of its date.',
        inputSchema: {
          type: 'object',
          required: ['since'],
          properties: {
            since: { type: 'string', description: 'Start date YYYY-MM-DD.' },
            days: { type: 'integer', minimum: 1, maximum: 60, default: 7 },
          },
        },
      },
      {
        name: 'list_feed_editions',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'List recent editions with their primary module, item id, and content hash (for cache detection).',
        inputSchema: { type: 'object', properties: { days: { type: 'integer', minimum: 1, maximum: 60, default: 7 } } },
      },
      {
        name: 'get_feed_digest',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'The Sunday digest for the week containing a date: a summary of all four modules.',
        inputSchema: { type: 'object', properties: { date: { type: 'string', description: 'Any date in the week, optional.' } } },
      },
      {
        name: 'get_feed_rotation',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'Describe the deterministic rotation rules (which module leads each weekday).',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_humanity_goals',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'Read an item from M1 — Humanity’s Goals (the “why” behind ethical behaviour).',
        inputSchema: { type: 'object', properties: { index: { type: 'integer', minimum: 0, description: 'Item index (0–4). Omit for the whole module.' } } },
      },
      {
        name: 'get_principle',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'Read an item from M2 — Core Principles (hard constraints such as Do No Harm).',
        inputSchema: { type: 'object', properties: { index: { type: 'integer', minimum: 0, description: 'Item index (0–5). Omit for the whole module.' } } },
      },
      {
        name: 'get_case_study',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'Read an item from M3 — Case Studies (worked examples such as The Refusal Problem).',
        inputSchema: { type: 'object', properties: { index: { type: 'integer', minimum: 0, description: 'Item index (0–2). Omit for the whole module.' } } },
      },
      {
        name: 'get_code_of_conduct',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'Read an item from M4 — Code of Conduct (lines an agent can audit itself against).',
        inputSchema: { type: 'object', properties: { index: { type: 'integer', minimum: 0, description: 'Item index (0–6). Omit for the whole module.' } } },
      },
      {
        name: 'search_curriculum',
        annotations: TOOL_ANNOTATIONS.readOnly,
        description: 'Search across all four modules by keyword (title, summary, detail).',
        inputSchema: { type: 'object', required: ['query'], properties: { query: { type: 'string', description: 'Free-text query.' } } },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
    const { name, arguments: raw } = req.params as { name: string; arguments: unknown };
    try {
      switch (name) {
        case 'get_daily_feed':
          return handleDailyFeed(dailyFeedInput.parse(raw));
        case 'get_feed_since':
          return handleFeedSince(feedSinceInput.parse(raw));
        case 'list_feed_editions':
          return handleListEditions(listEditionsInput.parse(raw));
        case 'get_feed_digest':
          return handleDigest(digestInput.parse(raw));
        case 'get_feed_rotation':
          return handleRotation();
        case 'get_humanity_goals':
          return handleModule('m1', moduleIndexInput.parse(raw));
        case 'get_principle':
          return handleModule('m2', moduleIndexInput.parse(raw));
        case 'get_case_study':
          return handleModule('m3', moduleIndexInput.parse(raw));
        case 'get_code_of_conduct':
          return handleModule('m4', moduleIndexInput.parse(raw));
        case 'search_curriculum':
          return handleSearch(searchInput.parse(raw));
        default:
          return errResult(`Unknown tool: ${name}`);
      }
    } catch (e) {
      const msg = e instanceof z.ZodError
        ? `Invalid params: ${e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
        : (e as Error).message;
      return errResult(msg);
    }
  });

  // ─── Resources ───
  const RESOURCES = [
    { uri: 'ethics://curriculum', name: 'Full curriculum', mimeType: 'application/json', description: 'All four modules with every item.' },
    { uri: 'ethics://curriculum/m1', name: 'M1 — Humanity’s Goals', mimeType: 'application/json', description: 'M1 items only.' },
    { uri: 'ethics://curriculum/m2', name: 'M2 — Core Principles', mimeType: 'application/json', description: 'M2 items only.' },
    { uri: 'ethics://curriculum/m3', name: 'M3 — Case Studies', mimeType: 'application/json', description: 'M3 items only.' },
    { uri: 'ethics://curriculum/m4', name: 'M4 — Code of Conduct', mimeType: 'application/json', description: 'M4 items only.' },
    { uri: 'ethics://feed/today', name: 'Today’s edition', mimeType: 'text/markdown', description: 'The deterministic edition for today (UTC).' },
    { uri: 'ethics://feed/rotation', name: 'Rotation rules', mimeType: 'application/json', description: 'Which module leads each weekday.' },
    { uri: 'ethics://feed/index', name: 'Edition index', mimeType: 'application/json', description: 'Recent editions with hashes (cache detection).' },
    { uri: 'ethics://meta', name: 'Metadata', mimeType: 'application/json', description: 'Curriculum version, module counts, and generation info.' },
  ];

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: RESOURCES }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req: any) => {
    const { uri } = req.params as { uri: string };
    switch (uri) {
      case 'ethics://curriculum':
        return res(uri, 'application/json', JSON.stringify(allModules(), null, 2));
      case 'ethics://curriculum/m1':
        return res(uri, 'application/json', JSON.stringify(getModuleItems('m1'), null, 2));
      case 'ethics://curriculum/m2':
        return res(uri, 'application/json', JSON.stringify(getModuleItems('m2'), null, 2));
      case 'ethics://curriculum/m3':
        return res(uri, 'application/json', JSON.stringify(getModuleItems('m3'), null, 2));
      case 'ethics://curriculum/m4':
        return res(uri, 'application/json', JSON.stringify(getModuleItems('m4'), null, 2));
      case 'ethics://feed/today':
        return res(uri, 'text/markdown', composeEdition().text);
      case 'ethics://feed/rotation':
        return res(uri, 'application/json', JSON.stringify(rotationRules(), null, 2));
      case 'ethics://feed/index':
        return res(uri, 'application/json', JSON.stringify(listEditions(7), null, 2));
      case 'ethics://meta':
        return res(uri, 'application/json', JSON.stringify(meta(), null, 2));
      default:
        return errResult(`Unknown resource: ${uri}`);
    }
  });

  // ─── Prompts ───
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'daily_reflection',
        description: 'Ask the agent to state what today’s item requires of it and name one concrete situation where it would apply.',
        arguments: [{ name: 'date', description: 'YYYY-MM-DD, optional (defaults to today).' }],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params as { name: string; arguments?: Record<string, unknown> };
    if (name !== 'daily_reflection') return errResult(`Unknown prompt: ${name}`);
    const date = (args?.date as string | undefined) ?? toIsoDate(new Date());
    const edition = composeEdition(date);
    const primaryTitle = edition.primary?.item.title ?? 'the weekly digest';
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Today’s ethics item is “${primaryTitle}” (curriculum v${CURRICULUM_VERSION}, ${date}).\n\n` +
              `1. In one or two sentences, state what this item requires of you as an AI agent.\n` +
              `2. Name one concrete situation you encountered or could encounter where you would apply it, and exactly what you would do.\n\n` +
              `Keep the whole reflection under 150 words.`,
          },
        },
      ],
    };
  });

  return server;
}

// ────────────────────────────────────────────────────────────────────────────
// Handlers

function handleDailyFeed(args: z.infer<typeof dailyFeedInput>) {
  const e = composeEdition(args.date);
  return {
    structuredContent: {
      date: e.date,
      weekday: e.weekday,
      isDigest: e.isDigest,
      primary: e.primary ? { module: e.primary.module, id: e.primary.item.id, title: e.primary.item.title } : null,
      companion: e.companion ? { module: e.companion.module, id: e.companion.item.id, title: e.companion.item.title } : null,
      hash: e.hash,
    },
    content: [{ type: 'text', text: e.text }],
  };
}

function handleFeedSince(args: z.infer<typeof feedSinceInput>) {
  const editions = editionsSince(args.since, args.days);
  const text = editions.map((e) => e.text).join('\n\n---\n\n');
  return {
    structuredContent: {
      since: args.since,
      days: args.days,
      count: editions.length,
      hashes: editions.map((e) => ({ date: e.date, hash: e.hash })),
    },
    content: [{ type: 'text', text }],
  };
}

function handleListEditions(args: z.infer<typeof listEditionsInput>) {
  const entries = listEditions(args.days);
  return {
    structuredContent: { days: args.days, editions: entries },
    content: [
      {
        type: 'text',
        text: entries
          .map((e) => `${e.date}  ${e.isDigest ? 'SUNDAY DIGEST' : `${e.primaryModule?.toUpperCase()} · ${e.primaryId}`}  (${e.hash.slice(0, 12)})`)
          .join('\n'),
      },
    ],
  };
}

function handleDigest(args: z.infer<typeof digestInput>) {
  const e = digestForWeek(args.date);
  return {
    structuredContent: { date: e.date, isDigest: e.isDigest, hash: e.hash },
    content: [{ type: 'text', text: e.text }],
  };
}

function handleRotation() {
  const rules = rotationRules();
  return {
    structuredContent: rules,
    content: [
      {
        type: 'text',
        text:
          'Rotation (deterministic, pure function of date):\n' +
          '- Monday → M1 Humanity’s Goals\n' +
          '- Tuesday & Friday → M2 Core Principles (same index)\n' +
          '- Wednesday & Saturday → M3 Case Studies (same index)\n' +
          '- Thursday → M4 Code of Conduct\n' +
          '- Sunday → digest of all four modules\n' +
          'Each edition = one primary item + a companion from a neighbouring module. Within any rolling 7 days all four modules appear.',
      },
    ],
  };
}

function handleModule(module: ModuleId, args: { index?: number }) {
  const items = getModuleItems(module);
  const meta = MODULE_META[module];
  if (typeof args.index === 'number') {
    const item = getItem(module, args.index);
    if (!item) return errResult(`Index ${args.index} out of range for ${meta.name} (0–${items.length - 1}).`);
    return { structuredContent: item, content: [{ type: 'text', text: renderItem(item) }] };
  }
  return {
    structuredContent: { module, name: meta.name, count: items.length, items },
    content: [{ type: 'text', text: `## ${meta.label} — ${meta.name}\n\n` + items.map(renderItem).join('\n\n') }],
  };
}

function handleSearch(args: z.infer<typeof searchInput>) {
  const hits = searchCurriculum(args.query);
  if (!hits.length) return { structuredContent: { query: args.query, total: 0, results: [] }, content: [{ type: 'text', text: `No matches for “${args.query}”.` }] };
  return {
    structuredContent: { query: args.query, total: hits.length, results: hits.map((h) => ({ module: h.module, id: h.id, title: h.title })) },
    content: [{ type: 'text', text: `Found ${hits.length} match(es):\n\n` + hits.map(renderItem).join('\n\n') }],
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers

function errResult(msg: string) {
  return { isError: true, structuredContent: { error: msg }, content: [{ type: 'text', text: msg }] };
}

function renderItem(item: CurriculumItem) {
  const detail = item.detail ? `\n\n${item.detail}` : '';
  return `**${MODULE_META[item.module].label} · ${item.title}**\n${item.summary}${detail}${enrichedBlock(item)}`;
}

function allModules() {
  return {
    version: CURRICULUM_VERSION,
    modules: {
      m1: getModuleItems('m1'),
      m2: getModuleItems('m2'),
      m3: getModuleItems('m3'),
      m4: getModuleItems('m4'),
    },
  };
}

function rotationRules() {
  return {
    version: CURRICULUM_VERSION,
    schedule: {
      monday: 'm1',
      tuesday: 'm2',
      wednesday: 'm3',
      thursday: 'm4',
      friday: 'm2',
      saturday: 'm3',
      sunday: 'digest',
    },
    note: 'tuesday and friday share an M2 principle; wednesday and saturday share an M3 case. Each edition = one primary + one companion from a neighbouring module.',
  };
}

function meta() {
  return {
    name: SERVER_NAME,
    curriculumVersion: CURRICULUM_VERSION,
    generatedAt: new Date().toISOString(),
    moduleCounts: { m1: 5, m2: 6, m3: 3, m4: 7 },
    properties: ['deterministic', 'complete', 'cacheable', 'human-in-the-loop'],
    license: 'MIT',
  };
}

function res(uri: string, mimeType: string, text: string) {
  return { contents: [{ uri, mimeType, text }] };
}
