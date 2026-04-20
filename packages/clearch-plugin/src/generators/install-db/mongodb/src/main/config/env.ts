export type AppEnv = {
  PORT: number;
  MONGO_URL: string;
};

function parsePort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) {
    return fallback;
  }
  return n;
}

export function loadEnv(): AppEnv {
  const mongoUrl = process.env.MONGO_URL;
  if (mongoUrl === undefined || mongoUrl === '') {
    throw new Error('MONGO_URL is required');
  }
  return {
    PORT: parsePort(process.env.PORT, 3000),
    MONGO_URL: mongoUrl,
  };
}
