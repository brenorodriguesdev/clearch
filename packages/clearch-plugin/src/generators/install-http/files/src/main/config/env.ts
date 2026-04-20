function readPort(): number {
  const raw = process.env.PORT;
  if (raw === undefined || raw.trim() === '') {
    return 3000;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid PORT: ${raw}`);
  }
  return n;
}

export type AppEnv = {
  PORT: number;
};

export function loadEnv(): AppEnv {
  return { PORT: readPort() };
}
