import type { ConsumeMessage } from 'amqplib';
import type { QueueConsumer } from '@data/contracts/queue-consumer';
import type { QueueHandler, QueueMessage } from '@data/contracts/queue-message';
import { getRabbitConnection } from './rabbitmq-queue-broker';

export class RabbitMqQueueConsumer implements QueueConsumer {
  subscribe<T>(queueName: string, handler: QueueHandler<T>): void {
    void (async () => {
      const connection = await getRabbitConnection();
      const ch = await connection.createChannel();
      await ch.assertQueue(queueName, { durable: true });
      await ch.prefetch(1);
      await ch.consume(queueName, async (msg: ConsumeMessage | null) => {
        if (!msg) {
          return;
        }
        try {
          const envelope = JSON.parse(msg.content.toString()) as QueueMessage<T>;
          await Promise.resolve(handler(envelope));
          ch.ack(msg);
        } catch {
          ch.nack(msg, false, true);
        }
      });
    })();
  }
}
