import { INVENTORY_ADJUSTMENT_REQUESTED_QUEUE } from '@data/constants/queue-names';
import { ProcessInventoryAdjustmentRequestService } from '@data/services/process-inventory-adjustment-request';
import { makeQueueConsumer } from '@main/factories/messaging/make-queue-consumer';
import type { InventoryAdjustmentPayload } from '@data/services/process-inventory-adjustment-request';

let inventoryService: ProcessInventoryAdjustmentRequestService | null = null;

export function getInventoryAdjustmentServiceForTests(): ProcessInventoryAdjustmentRequestService | null {
  return inventoryService;
}

/**
 * Register queue subscriptions before HTTP routes start accepting traffic.
 * Uses QUEUE_PROVIDER (memory | rabbitmq | sqs) from the environment.
 */
export async function bootstrapQueueSubscriptions(): Promise<void> {
  const consumer = makeQueueConsumer();
  inventoryService = new ProcessInventoryAdjustmentRequestService();

  consumer.subscribe(INVENTORY_ADJUSTMENT_REQUESTED_QUEUE, async (msg) => {
    const body = msg.body as InventoryAdjustmentPayload;
    await inventoryService!.execute(body);
  });
}
