/**
 * Shared pay-per-event billing for both transports.
 *
 * Free events (initialize, tools/list, resources/read, prompts/get) are never
 * charged. Only a `tools/call` is metered as the single primary event
 * `mcp-tool-call`. A billing failure must never break the MCP response.
 *
 * On the developer machine (`Actor.isAtHome()` false) nothing happens — local
 * debugging produces zero charges.
 */

export const PRIMARY_EVENT = 'mcp-tool-call';
export const EVENT_PRICE_USD = 0.02;

const FREE_METHODS = new Set(['initialize', 'tools/list', 'resources/list', 'resources/read', 'prompts/list', 'prompts/get', 'ping']);

let initialized = false;

interface ActorLike {
  isAtHome: () => boolean;
  init?: () => Promise<unknown>;
  charge: (opts: { eventName: string }) => Promise<unknown>;
}

/**
 * Map an MCP JSON-RPC request to a billable Apify event and charge it.
 * Returns true if a charge was attempted (for logging/verification).
 */
export async function chargeForRequest(body: unknown, actor: ActorLike): Promise<boolean> {
  if (!body || typeof body !== 'object') return false;
  if (!actor.isAtHome()) return false;

  const b = body as { method?: string; params?: { name?: string } };
  const method = b.method ?? '';
  if (FREE_METHODS.has(method)) return false;
  if (method !== 'tools/call') return false;

  const toolName = b.params?.name ?? '';
  if (!toolName) return false;

  try {
    if (!initialized && actor.init) {
      await actor.init();
      initialized = true;
    }
    await actor.charge({ eventName: PRIMARY_EVENT });
    return true;
  } catch (err) {
    console.warn(`[PPE charge failed] ${PRIMARY_EVENT}: ${(err as Error).message}`);
    return false;
  }
}
