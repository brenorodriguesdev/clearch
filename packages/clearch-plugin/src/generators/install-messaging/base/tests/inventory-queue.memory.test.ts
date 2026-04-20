import { INVENTORY_ADJUSTMENT_REQUESTED_QUEUE } from '@data/constants/queue-names';
import {
  MemoryQueueBackend,
  MemoryQueueConsumer,
  MemoryQueuePublisher,
} from '@infra/messaging/queue/memory';

describe('memory queue (inventory example)', () => {
  it('buffers publishes and delivers asynchronously to subscribers', async () => {
    const backend = new MemoryQueueBackend();
    const publisher = new MemoryQueuePublisher(backend);
    const consumer = new MemoryQueueConsumer(backend);
    const received: unknown[] = [];

    consumer.subscribe(INVENTORY_ADJUSTMENT_REQUESTED_QUEUE, async (msg) => {
      received.push(msg.body);
    });

    await publisher.publish(INVENTORY_ADJUSTMENT_REQUESTED_QUEUE, { sku: 'sku-1', delta: 3 });
    await backend.waitUntilIdle();
    await new Promise<void>((r) => setImmediate(r));

    expect(received).toEqual([{ sku: 'sku-1', delta: 3 }]);
  });

  it('isolates different queue names', async () => {
    const backend = new MemoryQueueBackend();
    const publisher = new MemoryQueuePublisher(backend);
    const consumer = new MemoryQueueConsumer(backend);
    const other: string[] = [];

    consumer.subscribe('other-queue', async (msg) => {
      other.push(String(msg.body));
    });

    await publisher.publish('other-queue', 'hello');
    await backend.waitUntilIdle();
    await new Promise<void>((r) => setImmediate(r));

    expect(other).toEqual(['hello']);
  });
});
