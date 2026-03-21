import { NextResponse } from "next/server";
import { getOfferById } from "@/api/offers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await context.params;
  if (!offerId?.trim()) {
    return NextResponse.json({ error: "Missing offer id" }, { status: 400 });
  }

  try {
    const offer = await getOfferById(offerId);
    return NextResponse.json({ data: offer });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch offer";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
