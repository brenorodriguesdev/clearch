import type { QueuePublisher } from '@data/contracts/queue-publisher';
import type { MemoryQueueBackend } from './memory-queue-backend';

export class MemoryQueuePublisher implements QueuePublisher {
  constructor(private readonly backend: MemoryQueueBackend) {}

  async publish<T>(
    queueName: string,
    payload: T,
    options?: { attributes?: Record<string, string> }
  ): Promise<void> {
    this.backend.publish(queueName, payload, options?.attributes);
    return Promise.resolve();
  }
}
