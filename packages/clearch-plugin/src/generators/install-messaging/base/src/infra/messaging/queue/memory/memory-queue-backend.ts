import { randomUUID } from 'node:crypto';
import type { QueueHandler, QueueMessage } from '@data/contracts/queue-message';

/**
 * In-process queue broker: messages are buffered and delivered asynchronously via the Node
 * event loop (setImmediate). This is not a distributed queue — it is for dev/tests and
 * local integration flows without RabbitMQ or SQS.
 */
export class MemoryQueueBackend {
  private readonly buffers = new Map<string, QueueMessage[]>();
  private readonly handlers = new Map<string, QueueHandler[]>();
  private drainTimer: ReturnType<typeof setImmediate> | null = null;

  publish<T>(queueName: string, body: T, attributes?: Record<string, string>): void {
    const message: QueueMessage<T> = {
      id: randomUUID(),
      queueName,
      body,
      enqueuedAt: new Date(),
      attributes,
    };
    const q = this.buffers.get(queueName) ?? [];
    q.push(message as QueueMessage);
    this.buffers.set(queueName, q);
    this.scheduleDrain();
  }

  subscribe<T>(queueName: string, handler: QueueHandler<T>): void {
    const list = this.handlers.get(queueName) ?? [];
    list.push(handler as QueueHandler);
    this.handlers.set(queueName, list);
    this.scheduleDrain();
  }

  private scheduleDrain(): void {
    if (this.drainTimer !== null) {
      return;
    }
    this.drainTimer = setImmediate(() => {
      this.drainTimer = null;
      void this.drainOnce();
    });
  }

  /** One pass: deliver as many buffered messages as possible for all queues. */
  private async drainOnce(): Promise<void> {
    let progressed = false;
    for (const queueName of [...this.buffers.keys()]) {
      const buf = this.buffers.get(queueName);
      const handlers = this.handlers.get(queueName);
      if (!buf?.length || !handlers?.length) {
        continue;
      }
      const message = buf.shift()!;
      if (buf.length === 0) {
        this.buffers.delete(queueName);
      } else {
        this.buffers.set(queueName, buf);
      }
      for (const h of handlers) {
        await Promise.resolve(h(message));
      }
      progressed = true;
    }
    if (progressed) {
      this.scheduleDrain();
    }
  }

  /**
   * Wait until there are no queued messages (handlers may still be running).
   * Useful in tests after publish + subscribe.
   */
  async waitUntilIdle(): Promise<void> {
    for (let i = 0; i < 500; i++) {
      if (this.buffers.size === 0) {
        return;
      }
      await new Promise<void>((r) => setImmediate(r));
    }
  }
}

let sharedBackend: MemoryQueueBackend | null = null;

export function getSharedMemoryQueueBackend(): MemoryQueueBackend {
  sharedBackend ??= new MemoryQueueBackend();
  return sharedBackend;
}

export function resetSharedMemoryQueueBackendForTests(): void {
  sharedBackend = null;
}
