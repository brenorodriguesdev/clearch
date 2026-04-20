import * as path from 'node:path';
import { pathExists, readFile, writeFile } from './fs-utils';

/**
 * Insert gRPC/MCP no-op bootstraps into `src/main/server.ts` after HTTP install.
 * Awaits run in order: gRPC, then MCP, then `createApp`.
 */
export async function ensureGrpcBootstrapInServer(cwd: string): Promise<void> {
  const p = path.join(cwd, 'src/main/server.ts');
  if (!(await pathExists(p))) {
    return;
  }
  let s = await readFile(p, 'utf8');
  if (s.includes('bootstrapGrpcTransport')) {
    return;
  }
  if (!s.includes("@main/grpc'")) {
    if (s.includes("import { bootstrapMcpTransport } from '@main/mcp';")) {
      s = s.replace(
        /import \{ bootstrapMcpTransport \} from '@main\/mcp';\n/,
        "import { bootstrapGrpcTransport } from '@main/grpc';\nimport { bootstrapMcpTransport } from '@main/mcp';\n"
      );
    } else {
      s = s.replace(
        /import \{ loadEnv \} from '@main\/config\/env';/,
        "import { loadEnv } from '@main/config/env';\nimport { bootstrapGrpcTransport } from '@main/grpc';"
      );
    }
  }
  if (s.includes('await bootstrapMcpTransport();')) {
    s = s.replace(
      /(const env = loadEnv\(\);\n)(  await bootstrapMcpTransport\(\);\n)/,
      '$1  await bootstrapGrpcTransport();\n$2'
    );
  } else {
    s = s.replace(/const env = loadEnv\(\);\n/, 'const env = loadEnv();\n  await bootstrapGrpcTransport();\n');
  }
  await writeFile(p, s, 'utf8');
}

export async function ensureMcpBootstrapInServer(cwd: string): Promise<void> {
  const p = path.join(cwd, 'src/main/server.ts');
  if (!(await pathExists(p))) {
    return;
  }
  let s = await readFile(p, 'utf8');
  if (s.includes('bootstrapMcpTransport')) {
    return;
  }
  if (!s.includes("@main/mcp'")) {
    if (s.includes("import { bootstrapGrpcTransport } from '@main/grpc';")) {
      s = s.replace(
        /import \{ bootstrapGrpcTransport \} from '@main\/grpc';\n/,
        "import { bootstrapGrpcTransport } from '@main/grpc';\nimport { bootstrapMcpTransport } from '@main/mcp';\n"
      );
    } else {
      s = s.replace(
        /import \{ loadEnv \} from '@main\/config\/env';/,
        "import { loadEnv } from '@main/config/env';\nimport { bootstrapMcpTransport } from '@main/mcp';"
      );
    }
  }
  if (s.includes('await bootstrapGrpcTransport();')) {
    s = s.replace(
      /await bootstrapGrpcTransport\(\);\n/,
      'await bootstrapGrpcTransport();\n  await bootstrapMcpTransport();\n'
    );
  } else {
    s = s.replace(/const env = loadEnv\(\);\n/, 'const env = loadEnv();\n  await bootstrapMcpTransport();\n');
  }
  await writeFile(p, s, 'utf8');
}
