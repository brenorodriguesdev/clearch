import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import type { QueueConsumer } from '@data/contracts/queue-consumer';
import type { QueueHandler, QueueMessage } from '@data/contracts/queue-message';
import { getQueueUrl } from './sqs-queue-urls';

let client: SQSClient | null = null;

function getClient(): SQSClient {
  client ??= new SQSClient({});
  return client;
}

/**
 * Long-polling consumer loop (one background poller per subscribed queue).
 * Suitable for workers; ensure only one process consumes a given queue in production.
 */
export class SqsQueueConsumer implements QueueConsumer {
  subscribe<T>(queueName: string, handler: QueueHandler<T>): void {
    const url = getQueueUrl(queueName);
    void this.pollLoop(url, handler);
  }

  private async pollLoop<T>(queueUrl: string, handler: QueueHandler<T>): Promise<void> {
    const sqs = getClient();
    while (true) {
      try {
        const out = await sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10,
            VisibilityTimeout: 30,
          })
        );
        for (const m of out.Messages ?? []) {
          if (!m.Body) {
            continue;
          }
          const envelope = JSON.parse(m.Body) as QueueMessage<T>;
          await Promise.resolve(handler(envelope));
          if (m.ReceiptHandle) {
            await sqs.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: m.ReceiptHandle,
              })
            );
          }
        }
      } catch (err) {
        console.error('[sqs consumer]', err);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
}
