/**
 * Streamable HTTP entry point (Apify Standby / remote hosting).
 *
 * Hard requirements (create-mcp-service SOP):
 *   1. POST /mcp — stateless: a fresh server + transport per request
 *      (sessionIdGenerator: undefined). No session cross-talk.
 *   2. GET / must answer 200 when the `x-apify-container-server-readiness-probe`
 *      header is present — otherwise the Standby run never becomes ready.
 *   3. Non-POST /mcp → 405 with Allow: POST.
 *   4. SIGTERM / SIGINT → graceful shutdown.
 *
 * Billing: only `tools/call` is metered (see src/billing.ts). Local runs
 * (`Actor.isAtHome()` false) produce zero charges.
 */

import express from 'express';
import { Actor } from 'apify';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server.js';
import { chargeForRequest } from './billing.js';

const PORT = Number(process.env.APIFY_CONTAINER_PORT ?? process.env.PORT ?? 3000);

async function main() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health / readiness probe (Apify Standby). Responds 200 immediately when the
  // probe header is present so the container flips to ready. Also serves as a
  // generic liveness endpoint.
  app.get('/', (req, res) => {
    if (req.headers['x-apify-container-server-readiness-probe'] !== undefined) {
      res.status(200).json({ status: 'ready' });
      return;
    }
    res.status(200).json({
      service: 'ethics-for-ai-mcp',
      version: '1.0.0',
      transports: ['streamable-http'],
      endpoints: ['/mcp'],
    });
  });

  // DNS-rebinding Host whitelist. On Apify the gateway already enforces Bearer
  // auth and assigns a platform hostname, so the check is skipped at home.
  app.use((req, res, next) => {
    if (process.env.APIFY_IS_AT_HOME) {
      next();
      return;
    }
    const allowedHosts = new Set([
      'localhost',
      '127.0.0.1',
      process.env.APIFY_CONTAINER_HOSTNAME ?? '',
    ]);
    const host = req.headers.host?.split(':')[0];
    if (host && !allowedHosts.has(host) && !host.endsWith('.apify.actor') && !host.endsWith('.apify.com')) {
      res.status(403).json({ error: 'Forbidden host' });
      return;
    }
    next();
  });

  app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

  // Main MCP endpoint — stateless Streamable HTTP.
  app.post('/mcp', async (req, res) => {
    // Charge the single primary PPE event before serving (free methods skipped
    // inside chargeForRequest; no-op when not at home).
    await chargeForRequest(req.body, Actor as any);

    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true,
    });
    await server.connect(transport);
    try {
      await transport.handleRequest(req, res, req.body);
    } finally {
      // Stateless: close the transport to release resources after the response.
      transport.onclose = () => {
        server.close().catch(() => undefined);
      };
      if (!res.writableEnded) {
        res.on('close', () => server.close().catch(() => undefined));
      }
    }
  });

  app.get('/mcp', (_req, res) => {
    res.status(405).json({ error: 'Use POST /mcp for Streamable HTTP requests' });
  });
  app.delete('/mcp', (_req, res) => {
    res.status(405).json({ error: 'DELETE not supported in stateless mode' });
  });

  const server = app.listen(PORT, () => {
    console.log(`[ethics-for-ai-mcp] Streamable HTTP listening on :${PORT} (stateless)`);
  });

  const shutdown = (sig: string) => {
    console.log(`[ethics-for-ai-mcp] received ${sig}, shutting down`);
    server.close(() => process.exit(0));
    // Force-exit safeguard.
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[ethics-for-ai-mcp] fatal:', err);
  process.exit(1);
});
