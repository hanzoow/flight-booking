import { NextRequest, NextResponse } from "next/server";
import { DuffelRequestError } from "@/api/duffel-client";
import { getDuffelPayment } from "@/api/payments";
import { friendlyOrderErrorMessage } from "@/utils/offerPassengerDob";

/**
 * GET /api/payments/[paymentId]
 * Proxies Duffel get single payment.
 * @see https://duffel.com/docs/api/v2/payments/get-a-single-payment
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await context.params;
  const id = paymentId?.trim();
  if (!id) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }
  try {
    const result = await getDuffelPayment(id);
    return NextResponse.json({ data: result.data });
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
      e instanceof Error ? e.message : "Could not load payment";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
