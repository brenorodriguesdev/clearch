import { registerMcpRuntimePlaceholder } from '@main/adapters/mcp/mcp-runtime-placeholder';

/** MCP transport entry — extend when you add an MCP SDK and tool registry. */
export async function bootstrapMcpTransport(): Promise<void> {
  await registerMcpRuntimePlaceholder();
}
