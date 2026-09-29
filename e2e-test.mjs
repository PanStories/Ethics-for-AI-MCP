/**
 * stdio end-to-end test (no Apify, no billing).
 * Spawns `node dist/index.js`, drives a minimal JSON-RPC client, and asserts
 * initialize → tools/list → a tools/call all return valid results.
 */
import { spawn } from 'node:child_process';

function assert(cond, label) {
  if (!cond) {
    console.error(`✗ FAIL: ${label}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

const child = spawn('node', ['dist/index.js'], { stdio: ['pipe', 'pipe', 'inherit'] });

let buf = '';
const pending = new Map();
let msgId = 0;

function send(obj) {
  return new Promise((resolve, reject) => {
    const id = obj.id ?? null;
    if (id != null) {
      const t = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`timeout waiting for response id=${id}`));
      }, 8000);
      pending.set(id, (m) => {
        clearTimeout(t);
        resolve(m);
      });
    }
    child.stdin.write(JSON.stringify(obj) + '\n');
  });
}

child.stdout.on('data', (d) => {
  buf += d.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id != null && pending.has(msg.id)) {
        const r = pending.get(msg.id);
        pending.delete(msg.id);
        r(msg);
      }
    } catch {
      // ignore non-JSON lines
    }
  }
});

async function main() {
  const init = await send({
    jsonrpc: '2.0',
    id: ++msgId,
    method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'e2e', version: '1.0' } },
  });
  assert(init.result?.serverInfo?.name === 'ethics-for-ai-mcp', 'initialize returns server name');
  assert(init.result?.capabilities?.tools !== undefined, 'initialize advertises tools capability');

  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  const list = await send({ jsonrpc: '2.0', id: ++msgId, method: 'tools/list' });
  const tools = list.result?.tools ?? [];
  assert(Array.isArray(tools) && tools.length === 10, `tools/list returns 10 tools (got ${tools.length})`);
  const names = new Set(tools.map((t) => t.name));
  for (const n of [
    'get_daily_feed', 'get_feed_since', 'list_feed_editions', 'get_feed_digest',
    'get_feed_rotation', 'get_humanity_goals', 'get_principle', 'get_case_study',
    'get_code_of_conduct', 'search_curriculum',
  ]) {
    assert(names.has(n), `tool present: ${n}`);
  }

  const call = await send({
    jsonrpc: '2.0',
    id: ++msgId,
    method: 'tools/call',
    params: { name: 'get_daily_feed', arguments: { date: '2026-09-28' } },
  });
  assert(call.result?.content?.[0]?.text?.includes('Daily Feed'), 'get_daily_feed returns edition text');
  assert(call.result?.structuredContent?.hash?.length === 64, 'get_daily_feed returns sha256 hash');

  const search = await send({
    jsonrpc: '2.0',
    id: ++msgId,
    method: 'tools/call',
    params: { name: 'search_curriculum', arguments: { query: 'refusal' } },
  });
  assert(search.result?.structuredContent?.total >= 1, 'search_curriculum finds "refusal"');

  const rot = await send({
    jsonrpc: '2.0',
    id: ++msgId,
    method: 'tools/call',
    params: { name: 'get_feed_rotation', arguments: {} },
  });
  assert(rot.result?.structuredContent?.schedule?.monday === 'm1', 'rotation: Monday → m1');

  // Determinism check: same date twice must equal.
  const a = await send({ jsonrpc: '2.0', id: ++msgId, method: 'tools/call', params: { name: 'get_daily_feed', arguments: { date: '2026-01-05' } } });
  const b = await send({ jsonrpc: '2.0', id: ++msgId, method: 'tools/call', params: { name: 'get_daily_feed', arguments: { date: '2026-01-05' } } });
  assert(a.result.structuredContent.hash === b.result.structuredContent.hash, 'deterministic: same date → same hash');

  console.log('\nPASS · stdio e2e (10 tools, deterministic feed, search, rotation)');
  child.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error('✗ stdio e2e error:', e.message);
  child.kill();
  process.exit(1);
});
