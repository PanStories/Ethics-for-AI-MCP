/**
 * HTTP end-to-end test (Streamable HTTP, stateless, Apify-Standby shape).
 * Spawns `node dist/http.js` on a test port, then asserts:
 *   1. Readiness probe (x-apify-container-server-readiness-probe header) → 200
 *   2. GET / → 200 (liveness)
 *   3. POST /mcp initialize → valid serverInfo
 *   4. POST /mcp tools/list → 10 tools
 *   5. POST /mcp tools/call get_daily_feed → edition text
 *   6. GET /mcp (non-POST) → 405
 */
import { spawn } from 'node:child_process';

const PORT = 8099;
const BASE = `http://127.0.0.1:${PORT}`;

function assert(cond, label) {
  if (!cond) {
    console.error(`✗ FAIL: ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn('node', ['dist/http.js'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit'],
});

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
};

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error('server did not become ready');
}

async function rpc(body) {
  const r = await fetch(`${BASE}/mcp`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text, __status: r.status };
  }
}

async function main() {
  await waitReady();

  // 1. readiness probe
  const probe = await fetch(`${BASE}/`, { headers: { 'x-apify-container-server-readiness-probe': '1' } });
  assert(probe.status === 200, 'readiness probe (x-apify-container-server-readiness-probe) → 200');

  // 2. liveness
  const live = await fetch(`${BASE}/`);
  assert(live.status === 200, 'GET / → 200');

  // 3. initialize
  const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'e2e', version: '1.0' } } });
  assert(init.result?.serverInfo?.name === 'ethics-for-ai-mcp', 'HTTP initialize returns server name');

  // 4. tools/list
  const list = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const tools = list.result?.tools ?? [];
  assert(tools.length === 10, `HTTP tools/list returns 10 tools (got ${tools.length})`);

  // 5. tools/call
  const call = await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_daily_feed', arguments: { date: '2026-09-28' } } });
  assert(call.result?.content?.[0]?.text?.includes('Daily Feed'), 'HTTP get_daily_feed returns edition text');

  // 6. non-POST /mcp → 405
  const getMcp = await fetch(`${BASE}/mcp`);
  assert(getMcp.status === 405, `GET /mcp → 405 (got ${getMcp.status})`);

  console.log('\nPASS · HTTP e2e (readiness probe, initialize, 10 tools, tools/call, 405 on GET)');
  child.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error('✗ HTTP e2e error:', e.message);
  child.kill();
  process.exit(1);
});
