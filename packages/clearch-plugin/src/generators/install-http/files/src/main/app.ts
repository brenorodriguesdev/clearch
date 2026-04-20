import express, { type Express } from 'express';
import { registerHttpRoutes } from '@main/routes';

export async function createApp(): Promise<Express> {
  const app = express();
  app.use(express.json());
  registerHttpRoutes(app);
  return app;
}
