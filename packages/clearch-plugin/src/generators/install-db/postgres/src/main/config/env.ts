export type AppEnv = {
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
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
  return {
    PORT: parsePort(process.env.PORT, 3000),
    DB_HOST: process.env.DB_HOST ?? 'localhost',
    DB_PORT: parsePort(process.env.DB_PORT, 5432),
    DB_NAME: process.env.DB_NAME ?? 'app_db',
    DB_USER: process.env.DB_USER ?? 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD ?? 'postgres',
  };
}
