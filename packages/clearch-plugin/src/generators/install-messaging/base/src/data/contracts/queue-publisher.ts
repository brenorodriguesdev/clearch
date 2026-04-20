export interface QueuePublisher {
  publish<T = unknown>(
    queueName: string,
    payload: T,
    options?: { attributes?: Record<string, string> }
  ): Promise<void>;
}
