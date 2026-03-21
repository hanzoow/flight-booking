import { duffelGet, duffelPost } from "./duffel-client";

/** Duffel payment resource (subset used by our app). @see https://duffel.com/docs/api/v2/payments */
export interface DuffelPayment {
  id: string;
  order_id: string;
  type: "arc_bsp_cash" | "balance" | "card" | "airline_credit" | string;
  status: "succeeded" | "failed" | "pending" | "cancelled";
  amount: string;
  currency: string | null;
  live_mode: boolean;
  created_at: string;
  failure_reason?: string | null;
  airline_credit_id?: string | null;
}

export interface CreateBalancePaymentInput {
  orderId: string;
  /** Must match latest order totals (fetched server-side before pay). */
  amount: string;
  currency: string;
}

/**
 * Create a payment for a hold order (e.g. balance in test mode).
 * @see https://duffel.com/docs/api/v2/payments/create-a-payment
 */
export async function createDuffelBalancePayment(
  input: CreateBalancePaymentInput
): Promise<{ data: DuffelPayment }> {
  return duffelPost<DuffelPayment>("/air/payments", {
    data: {
      order_id: input.orderId,
      payment: {
        type: "balance",
        currency: input.currency,
        amount: input.amount,
      },
    },
  });
}

export interface CreateCardPaymentInput {
  orderId: string;
  amount: string;
  currency: string;
  threeDSecureSessionId: string;
}

export async function createDuffelCardPayment(
  input: CreateCardPaymentInput
): Promise<{ data: DuffelPayment }> {
  return duffelPost<DuffelPayment>("/air/payments", {
    data: {
      order_id: input.orderId,
      payment: {
        type: "card",
        currency: input.currency,
        amount: input.amount,
        three_d_secure_session_id: input.threeDSecureSessionId,
      },
    },
  });
}

/**
 * List payments for an order.
 * @see https://duffel.com/docs/api/v2/payments/list-payments
 */
export async function listDuffelPayments(
  orderId: string
): Promise<DuffelPayment[]> {
  const res = await duffelGet<DuffelPayment[]>("/air/payments", {
    order_id: orderId,
  });
  return res.data;
}

/**
 * Get a single payment by id.
 * @see https://duffel.com/docs/api/v2/payments/get-a-single-payment
 */
export async function getDuffelPayment(
  paymentId: string
): Promise<{ data: DuffelPayment }> {
  return duffelGet<DuffelPayment>(
    `/air/payments/${encodeURIComponent(paymentId)}`
  );
}
