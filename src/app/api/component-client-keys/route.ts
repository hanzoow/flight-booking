import { NextRequest, NextResponse } from "next/server";
import { createDuffelComponentClientKey } from "@/api/component-client-keys";
import { DuffelRequestError } from "@/api/duffel-client";
import { friendlyOrderErrorMessage } from "@/utils/offerPassengerDob";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** POST /api/component-client-keys — body optional `{ orderId?: string }` */
export async function POST(req: NextRequest) {
  try {
    let orderId: string | undefined;
    try {
      const json = await req.json();
      if (isRecord(json) && typeof json.orderId === "string") {
        const t = json.orderId.trim();
        if (t) orderId = t;
      }
    } catch {
      /* empty body */
    }

    const { data } = await createDuffelComponentClientKey(
      orderId ? { order_id: orderId } : {}
    );
    return NextResponse.json({ clientKey: data.component_client_key });
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
      e instanceof Error ? e.message : "Could not create client key";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
