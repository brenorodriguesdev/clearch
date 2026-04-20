import type { ExampleRepository } from '@data/contracts';
import type { ExampleModel } from '@domain/models';
import type { Model } from 'mongoose';
import type { ExampleDocument } from '@infra/db/mongoose/models/example-model';

export class ExampleRepositoryMongoose implements ExampleRepository {
  constructor(private readonly model: Model<ExampleDocument>) {}

  async create(params: { title: string }): Promise<ExampleModel> {
    const doc = await this.model.create({ title: params.title });
    return toModel(doc);
  }

  async getAll(): Promise<ExampleModel[]> {
    const docs = await this.model.find().sort({ createdAt: 1 }).exec();
    return docs.map((d) => toModel(d));
  }
}

function toModel(doc: ExampleDocument): ExampleModel {
  return {
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt,
  };
}
