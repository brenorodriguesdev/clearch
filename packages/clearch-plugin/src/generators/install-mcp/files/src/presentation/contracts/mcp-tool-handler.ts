/**
 * Application-side MCP tool contract. Transport stays in `main/adapters/mcp`.
 */
export type McpToolInvocation = {
  name: string;
  arguments: Readonly<Record<string, unknown>>;
};

export type McpToolResult = {
  structured?: unknown;
  text?: string;
  isError?: boolean;
};

export interface McpToolHandler {
  handle(invocation: McpToolInvocation): Promise<McpToolResult> | McpToolResult;
}
