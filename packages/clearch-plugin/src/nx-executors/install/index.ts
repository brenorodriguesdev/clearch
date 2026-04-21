import { ExecutorContext } from '@nx/devkit';
import { runInstallHttp } from '../../lib/install-http';
import { runInstallGrpc } from '../../lib/install-grpc';
import { runInstallMcp } from '../../lib/install-mcp';
import { runInstallAuth } from '../../lib/install-auth';
import { runInstallHash } from '../../lib/install-hash';

export interface InstallExecutorOptions {
  module: 'http' | 'grpc' | 'mcp' | 'auth' | 'hash' | 'db' | 'messaging';
  provider?: string;
}

export default async function (
  options: InstallExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const cwd = context.root;
  const { module } = options;

  try {
    console.log(`[clearch] installing ${module} in ${cwd}`);

    switch (module) {
      case 'http': {
        const { skipped } = await runInstallHttp({ cwd });
        if (skipped) {
          console.log('[clearch] HTTP stack already present; merged missing package.json entries.');
        } else {
          console.log('[clearch] HTTP stack installed.');
        }
        console.log('[clearch] next steps:');
        console.log('  npm install   # if dependencies changed');
        console.log('  npm run dev');
        break;
      }
      case 'grpc': {
        const { skipped } = await runInstallGrpc({ cwd });
        if (skipped) {
          console.log('[clearch] gRPC stubs already present; server.ts transport hooks refreshed if needed.');
        } else {
          console.log('[clearch] gRPC stubs installed.');
        }
        break;
      }
      case 'mcp': {
        const { skipped } = await runInstallMcp({ cwd });
        if (skipped) {
          console.log('[clearch] MCP stubs already present; server.ts transport hooks refreshed if needed.');
        } else {
          console.log('[clearch] MCP stubs installed.');
        }
        break;
      }
      case 'auth': {
        const { skipped } = await runInstallAuth({ cwd });
        if (skipped) {
          console.log('[clearch] auth already present; merged missing package.json / .env.example entries only.');
        } else {
          console.log('[clearch] auth installed.');
        }
        console.log('[clearch] next steps:');
        console.log('  - Set JWT_SECRET (and optional JWT_EXPIRES_IN) in .env');
        console.log('  - Use JwtAdapter from src/infra/cryptography/jwt-adapter.ts');
        break;
      }
      case 'hash': {
        const { skipped } = await runInstallHash({ cwd });
        if (skipped) {
          console.log('[clearch] hash already present; merged missing package.json entries only.');
        } else {
          console.log('[clearch] hash installed.');
        }
        console.log('[clearch] next steps:');
        console.log('  - Use BcryptHasher from src/infra/cryptography/bcrypt-adapter.ts');
        break;
      }
      case 'db': {
        console.log('[clearch] db installation requires interactive prompt. Please run: ca install db');
        return { success: false };
      }
      case 'messaging': {
        console.log('[clearch] messaging installation requires interactive prompt. Please run: ca install messaging');
        return { success: false };
      }
      default:
        console.error(`[clearch] unknown module: ${module}`);
        return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error(`[clearch] ${error instanceof Error ? error.message : String(error)}`);
    return { success: false };
  }
}
