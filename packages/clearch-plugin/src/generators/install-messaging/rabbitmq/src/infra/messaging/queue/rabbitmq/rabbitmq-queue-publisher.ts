import { randomUUID } from 'node:crypto';
import type { QueuePublisher } from '@data/contracts/queue-publisher';
import type { QueueMessage } from '@data/contracts/queue-message';
import { getRabbitConnection } from './rabbitmq-queue-broker';

export class RabbitMqQueuePublisher implements QueuePublisher {
  async publish<T>(
    queueName: string,
    payload: T,
    options?: { attributes?: Record<string, string> }
  ): Promise<void> {
    const connection = await getRabbitConnection();
    const ch = await connection.createChannel();
    try {
      await ch.assertQueue(queueName, { durable: true });
      const envelope: QueueMessage<T> = {
        id: randomUUID(),
        queueName,
        body: payload,
        enqueuedAt: new Date(),
        attributes: options?.attributes,
      };
      ch.sendToQueue(queueName, Buffer.from(JSON.stringify(envelope)), { persistent: true });
    } finally {
      await ch.close();
    }
  }
}
