import type { ExampleRepository } from '@data/contracts';
import type { Repository } from 'typeorm';
import { getDataSource } from '@infra/db/typeorm/data-source';
import { ExampleEntity } from '@infra/db/typeorm/entities/example-entity';
import { ExampleRepositoryTypeorm } from './example-repository-typeorm';

let cached: ExampleRepository | null = null;

export function getExampleRepository(): ExampleRepository {
  if (!cached) {
    const ormRepo: Repository<ExampleEntity> = getDataSource().getRepository(ExampleEntity);
    cached = new ExampleRepositoryTypeorm(ormRepo);
  }
  return cached;
}
