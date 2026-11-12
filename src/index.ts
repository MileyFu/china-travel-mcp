#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createChinaTravelServer } from './server.js';

async function main() {
  const server = createChinaTravelServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('ChinaStay Travel MCP server running on stdio');

  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error running ChinaStay MCP server:', error);
  process.exit(1);
});
