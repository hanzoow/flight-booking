import type { DuffelOrderRecord } from "@/api/models";
import { duffelGet, duffelPost } from "./duffel-client";

/** Minimal fields returned from create order (Duffel may return more). */
export type DuffelOrderSummary = Pick<
  DuffelOrderRecord,
  | "id"
  | "type"
  | "booking_reference"
  | "total_amount"
  | "total_currency"
  | "payment_required_by"
  | "offer_id"
>;

export async function createDuffelOrder(body: {
  data: unknown;
}): Promise<{ data: DuffelOrderSummary }> {
  return duffelPost<DuffelOrderSummary>("/air/orders", body);
}

/**
 * Latest order state (amount may change; use before creating a payment).
 * @see https://duffel.com/docs/api/v2/orders/get-order-by-id
 */
export async function getDuffelOrder(
  orderId: string
): Promise<{ data: DuffelOrderRecord }> {
  return duffelGet<DuffelOrderRecord>(
    `/air/orders/${encodeURIComponent(orderId)}`
  );
}
