import type { QueueConsumer } from '@data/contracts/queue-consumer';
import type { QueueHandler } from '@data/contracts/queue-message';
import type { MemoryQueueBackend } from './memory-queue-backend';

export class MemoryQueueConsumer implements QueueConsumer {
  constructor(private readonly backend: MemoryQueueBackend) {}

  subscribe<T>(queueName: string, handler: QueueHandler<T>): void {
    this.backend.subscribe(queueName, handler);
  }
}
