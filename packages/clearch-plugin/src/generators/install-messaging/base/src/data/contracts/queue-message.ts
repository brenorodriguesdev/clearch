export type QueueMessage<T = unknown> = {
  id: string;
  queueName: string;
  body: T;
  enqueuedAt: Date;
  attributes?: Record<string, string>;
};

export type QueueHandler<T = unknown> = (message: QueueMessage<T>) => void | Promise<void>;
