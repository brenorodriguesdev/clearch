import mongoose, { Schema, type Model } from 'mongoose';

export type ExampleDocument = mongoose.Document & {
  title: string;
  createdAt: Date;
};

const ExampleSchema = new Schema<ExampleDocument>(
  {
    title: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'examples',
  }
);

export const ExampleMongooseModel: Model<ExampleDocument> = mongoose.model<ExampleDocument>(
  'Example',
  ExampleSchema
);
