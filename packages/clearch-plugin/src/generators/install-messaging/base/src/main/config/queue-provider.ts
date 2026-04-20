export type QueueProviderKind = 'memory' | 'rabbitmq' | 'sqs';

export function getQueueProvider(): QueueProviderKind {
  const raw = (process.env.QUEUE_PROVIDER ?? 'memory').trim().toLowerCase();
  if (raw === 'rabbitmq' || raw === 'sqs') {
    return raw;
  }
  return 'memory';
}
