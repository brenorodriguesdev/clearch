import type { ExampleRepository } from '@data/contracts';
import { ExampleMongooseModel } from '@infra/db/mongoose/models/example-model';
import { ExampleRepositoryMongoose } from './example-repository-mongoose';

let cached: ExampleRepository | null = null;

export function getExampleRepository(): ExampleRepository {
  if (!cached) {
    cached = new ExampleRepositoryMongoose(ExampleMongooseModel);
  }
  return cached;
}
