/**
 * Map logical queue names (e.g. inventory-adjustment-requested) to SQS queue URLs.
 * Example .env:
 * SQS_QUEUE_URLS={"inventory-adjustment-requested":"https://sqs.us-east-1.amazonaws.com/123/inv"}
 */
export function getQueueUrl(queueName: string): string {
  const raw = process.env.SQS_QUEUE_URLS;
  if (!raw || raw.trim() === '') {
    throw new Error(
      'SQS_QUEUE_URLS must be set to a JSON object mapping queue names to HTTPS queue URLs.'
    );
  }
  const map = JSON.parse(raw) as Record<string, string>;
  const url = map[queueName];
  if (!url || url.trim() === '') {
    throw new Error(`No SQS_QUEUE_URLS entry for queue "${queueName}".`);
  }
  return url;
}
