import type { Repository } from 'typeorm';
import type { ExampleRepository } from '@data/contracts';
import type { ExampleModel } from '@domain/models';
import { ExampleEntity } from '@infra/db/typeorm/entities/example-entity';

export class ExampleRepositoryTypeorm implements ExampleRepository {
  constructor(private readonly repo: Repository<ExampleEntity>) {}

  async create(params: { title: string }): Promise<ExampleModel> {
    const entity = this.repo.create({ title: params.title });
    const saved = await this.repo.save(entity);
    return toModel(saved);
  }

  async getAll(): Promise<ExampleModel[]> {
    const rows = await this.repo.find({ order: { createdAt: 'ASC' } });
    return rows.map(toModel);
  }
}

function toModel(entity: ExampleEntity): ExampleModel {
  return {
    id: entity.id,
    title: entity.title,
    createdAt: entity.createdAt,
  };
}
