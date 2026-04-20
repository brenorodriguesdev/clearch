import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ExampleEntity } from './entities/example-entity';

let dataSource: DataSource | null = null;

export function buildDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'app_db',
    entities: [ExampleEntity],
    synchronize: true,
    logging: false,
  });
}

export async function initTypeOrm(): Promise<void> {
  if (dataSource?.isInitialized) {
    return;
  }
  const ds = buildDataSource();
  await ds.initialize();
  dataSource = ds;
}

export function getDataSource(): DataSource {
  if (!dataSource?.isInitialized) {
    throw new Error('TypeORM DataSource not initialized. Call initTypeOrm() before handling requests.');
  }
  return dataSource;
}
