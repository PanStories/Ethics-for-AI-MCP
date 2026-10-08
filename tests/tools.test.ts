/**
 * Contract tests for every Ethics-for-AI MCP tool.
 *
 * Covers the two things M8ven Trust Index / OpenAI MCP directory care about:
 * 1. All 10 tools are listed by ListTools and each carries the four explicit boolean
 *    hints (OpenAI's directory rejects any tool missing readOnlyHint /
 *    destructiveHint / idempotentHint / openWorldHint).
 * 2. Every tool's handler is actually reachable via CallTool and returns content
 *    (M8ven's test-discovery rewards tools that are referenced by a test).
 *
 * Pure in-memory transport — no network, no Apify token required.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/server.js';

const EXPECTED_TOOLS = [
  'get_daily_feed',
  'get_feed_since',
  'list_feed_editions',
  'get_feed_digest',
  'get_feed_rotation',
  'get_humanity_goals',
  'get_principle',
  'get_case_study',
  'get_code_of_conduct',
  'search_curriculum',
] as const;

const HINTS = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'] as const;

// Minimal valid arguments per tool (others accept optional args / defaults).
const CALL_ARGS: Record<string, Record<string, unknown>> = {
  get_daily_feed: {},
  get_feed_since: { since: '2026-01-05', days: 3 },
  list_feed_editions: { days: 3 },
  get_feed_digest: {},
  get_feed_rotation: {},
  get_humanity_goals: {},
  get_principle: {},
  get_case_study: {},
  get_code_of_conduct: {},
  search_curriculum: { query: 'harm' },
};

let client: Client;

beforeAll(async () => {
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  await server.connect(serverT);
  client = new Client({ name: 'contract-test', version: '0.0.0' });
  await client.connect(clientT);
});

describe('tool registry contract', () => {
  it('exposes all 10 expected tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const expected of EXPECTED_TOOLS) {
      expect(names, `missing tool: ${expected}`).toContain(expected);
    }
    expect(names.length, 'unexpected extra tools').toBe(EXPECTED_TOOLS.length);
  });

  it('declares all four MCP tool hints on every tool (explicit booleans)', async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      const annotations = (tool as { annotations?: Record<string, unknown> }).annotations;
      expect(annotations, `${tool.name} has no annotations`).toBeDefined();
      for (const hint of HINTS) {
        expect(
          typeof annotations?.[hint],
          `${tool.name}.${hint} must be an explicit boolean`,
        ).toBe('boolean');
      }
      // This server is a pure, read-only function of the static curriculum.
      expect(annotations?.readOnlyHint, `${tool.name} must be read-only`).toBe(true);
      expect(annotations?.destructiveHint, `${tool.name} must be non-destructive`).toBe(false);
      expect(annotations?.openWorldHint, `${tool.name} must not touch the outside world`).toBe(false);
    }
  });
});

describe('every tool is callable', () => {
  for (const name of EXPECTED_TOOLS) {
    it(`calls ${name} and returns content`, async () => {
      const result = await client.callTool({ name, arguments: CALL_ARGS[name] });
      expect(result.isError, `${name} returned an error`).not.toBe(true);
      const content = (result.content ?? []) as Array<{ type: string; text?: string }>;
      expect(content.length, `${name} returned no content`).toBeGreaterThan(0);
      expect(content.some((c) => c.type === 'text' && (c.text ?? '').length > 0),
        `${name} returned empty text`).toBe(true);
    });
  }
});
