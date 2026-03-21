import { NextRequest, NextResponse } from "next/server";
import { DuffelRequestError } from "@/api/duffel-client";
import { getDuffelOrder } from "@/api/orders";
import {
  createDuffelBalancePayment,
  createDuffelCardPayment,
  listDuffelPayments,
} from "@/api/payments";
import { friendlyOrderErrorMessage } from "@/utils/offerPassengerDob";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * GET /api/payments?order_id=ord_xxx
 * Lists payments for an order (Duffel list payments API).
 * @see https://duffel.com/docs/api/v2/payments/list-payments
 */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("order_id")?.trim() ?? "";
  if (!orderId) {
    return NextResponse.json(
      { error: "order_id query parameter is required" },
      { status: 400 }
    );
  }
  try {
    const payments = await listDuffelPayments(orderId);
    return NextResponse.json({ data: payments });
  } catch (e) {
    if (e instanceof DuffelRequestError) {
      const first = e.errors[0];
      const raw = first?.message ?? e.message;
      const code = first?.code;
      const userMessage = friendlyOrderErrorMessage(raw, code);
      const status = e.status >= 400 && e.status < 600 ? e.status : 502;
      return NextResponse.json(
        { error: raw, code, userMessage },
        { status }
      );
    }
    const message =
      e instanceof Error ? e.message : "Could not list payments";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * POST /api/payments
 * Body: { orderId: string, threeDSecureSessionId?: string }
 * With session id → card payment; without → Duffel balance (test).
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    if (!isRecord(json)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const orderId =
      typeof json.orderId === "string" ? json.orderId.trim() : "";
    const threeDSecureSessionId =
      typeof json.threeDSecureSessionId === "string"
        ? json.threeDSecureSessionId.trim()
        : "";
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const { data: order } = await getDuffelOrder(orderId);

    if (order.type === "instant") {
      return NextResponse.json(
        {
          error: "order_type_not_eligible_for_payment",
          userMessage:
            "This booking was already paid when the order was created. No separate payment is needed.",
        },
        { status: 400 }
      );
    }

    const amount = order.total_amount;
    const currency = order.total_currency;
    if (!amount || !currency) {
      return NextResponse.json(
        { error: "Order is missing total amount or currency" },
        { status: 502 }
      );
    }

    const { data: payment } = threeDSecureSessionId
      ? await createDuffelCardPayment({
          orderId,
          amount,
          currency,
          threeDSecureSessionId,
        })
      : await createDuffelBalancePayment({
          orderId,
          amount,
          currency,
        });

    if (payment.status === "failed") {
      const raw = payment.failure_reason ?? "Payment failed";
      return NextResponse.json(
        {
          error: raw,
          code: payment.failure_reason ?? undefined,
          userMessage: friendlyOrderErrorMessage(raw, payment.failure_reason ?? undefined),
        },
        { status: 422 }
      );
    }

    const { data: orderAfter } = await getDuffelOrder(orderId);

    return NextResponse.json({
      data: {
        payment,
        order: orderAfter,
      },
    });
  } catch (e) {
    if (e instanceof DuffelRequestError) {
      const first = e.errors[0];
      const raw = first?.message ?? e.message;
      const code = first?.code;
      const userMessage = friendlyOrderErrorMessage(raw, code);
      const status = e.status >= 400 && e.status < 600 ? e.status : 502;
      return NextResponse.json(
        { error: raw, code, userMessage },
        { status }
      );
    }
    const message =
      e instanceof Error ? e.message : "Could not create payment";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
