import { NextRequest, NextResponse } from "next/server";
import { DuffelRequestError } from "@/api/duffel-client";
import { getDuffelOrder } from "@/api/orders";
import { listDuffelPayments } from "@/api/payments";
import { friendlyOrderErrorMessage } from "@/utils/offerPassengerDob";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const id = orderId?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }
  try {
    const { data: order } = await getDuffelOrder(id);
    const payments = await listDuffelPayments(id);
    const paid = payments.some((p) => p.status === "succeeded");
    return NextResponse.json({
      data: {
        order,
        paid,
        payments: payments.map((p) => ({
          id: p.id,
          status: p.status,
          amount: p.amount,
          currency: p.currency,
        })),
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
      e instanceof Error ? e.message : "Could not load order";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
