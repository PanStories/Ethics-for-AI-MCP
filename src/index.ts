/**
 * stdio entry point (local CLI / desktop MCP clients).
 *
 * No HTTP server, no billing (local debugging is always free). Connect an MCP
 * client via stdio — see README for the client config snippet.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[ethics-for-ai-mcp] stdio transport ready');
}

main().catch((err) => {
  console.error('[ethics-for-ai-mcp] fatal:', err);
  process.exit(1);
});
