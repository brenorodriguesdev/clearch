import amqp, { type ChannelModel } from 'amqplib';

let shared: ChannelModel | null = null;

export function getRabbitUrl(): string {
  return process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
}

export async function getRabbitConnection(): Promise<ChannelModel> {
  shared ??= await amqp.connect(getRabbitUrl());
  return shared;
}
