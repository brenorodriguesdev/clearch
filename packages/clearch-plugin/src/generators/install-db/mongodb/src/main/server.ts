import 'dotenv/config';
import { createApp } from '@main/app';
import { loadEnv } from '@main/config/env';
import { connectMongo } from '@infra/db/mongoose/connection';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  await connectMongo(env.MONGO_URL);
  const app = await createApp();
  app.listen(env.PORT, () => {
    console.log(`__PROJECT_NAME_PASCAL__ listening on :${env.PORT}`);
  });
}

void bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
