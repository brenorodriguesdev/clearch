export type InventoryAdjustmentPayload = {
  sku: string;
  delta: number;
};

/** Demo service: records processed adjustments (useful in tests and local debugging). */
export class ProcessInventoryAdjustmentRequestService {
  readonly processed: InventoryAdjustmentPayload[] = [];

  async execute(payload: InventoryAdjustmentPayload): Promise<void> {
    this.processed.push(payload);
  }
}
