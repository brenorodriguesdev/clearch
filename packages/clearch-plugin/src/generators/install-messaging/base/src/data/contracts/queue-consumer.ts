import type { QueueHandler } from './queue-message';

export interface QueueConsumer {
  subscribe<T = unknown>(queueName: string, handler: QueueHandler<T>): void;
}
