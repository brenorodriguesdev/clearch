import { randomUUID } from 'node:crypto';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import type { QueuePublisher } from '@data/contracts/queue-publisher';
import type { QueueMessage } from '@data/contracts/queue-message';
import { getQueueUrl } from './sqs-queue-urls';

let client: SQSClient | null = null;

function getClient(): SQSClient {
  client ??= new SQSClient({});
  return client;
}

export class SqsQueuePublisher implements QueuePublisher {
  async publish<T>(
    queueName: string,
    payload: T,
    options?: { attributes?: Record<string, string> }
  ): Promise<void> {
    const envelope: QueueMessage<T> = {
      id: randomUUID(),
      queueName,
      body: payload,
      enqueuedAt: new Date(),
      attributes: options?.attributes,
    };
    const url = getQueueUrl(queueName);
    await getClient().send(
      new SendMessageCommand({
        QueueUrl: url,
        MessageBody: JSON.stringify(envelope),
      })
    );
  }
}
