import 'dotenv/config';
import { createApp } from '@main/app';
import { loadEnv } from '@main/config/env';

async function main(): Promise<void> {
  const env = loadEnv();
  const app = await createApp();
  app.listen(env.PORT, () => {
    console.log(`__PROJECT_NAME_PASCAL__ HTTP on :${env.PORT}`);
  });
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
