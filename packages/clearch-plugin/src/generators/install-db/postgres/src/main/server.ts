import 'reflect-metadata';
import 'dotenv/config';
import { createApp } from '@main/app';
import { loadEnv } from '@main/config/env';
import { initTypeOrm } from '@infra/db/typeorm/data-source';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  await initTypeOrm();
  const app = await createApp();
  app.listen(env.PORT, () => {
    console.log(`__PROJECT_NAME_PASCAL__ listening on :${env.PORT}`);
  });
}

void bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
