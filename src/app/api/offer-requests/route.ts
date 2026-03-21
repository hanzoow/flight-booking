import { NextRequest, NextResponse } from "next/server";
import { createOfferRequest, SearchFlightsParams } from "@/api/offer-requests";
import { CabinClass } from "@/api/models";

const VALID_CABIN_CLASSES: CabinClass[] = [
  "economy",
  "premium_economy",
  "business",
  "first",
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departDate = searchParams.get("departDate");

  if (!origin || !destination || !departDate) {
    return NextResponse.json(
      { error: "origin, destination, and departDate are required" },
      { status: 400 }
    );
  }

  const cabinClass = searchParams.get("cabin_class") as CabinClass | null;
  if (cabinClass && !VALID_CABIN_CLASSES.includes(cabinClass)) {
    return NextResponse.json(
      { error: `Invalid cabin_class. Must be one of: ${VALID_CABIN_CLASSES.join(", ")}` },
      { status: 400 }
    );
  }

  const params: SearchFlightsParams = {
    origin,
    destination,
    departDate,
    returnDate: searchParams.get("returnDate") ?? undefined,
    adults: parseInt(searchParams.get("adults") ?? "1", 10),
    children: parseInt(searchParams.get("children") ?? "0", 10),
    infants: parseInt(searchParams.get("infants") ?? "0", 10),
    cabin_class: cabinClass ?? undefined,
    max_connections: searchParams.has("max_connections")
      ? parseInt(searchParams.get("max_connections")!, 10)
      : undefined,
  };

  try {
    const offerRequest = await createOfferRequest(params);
    return NextResponse.json({ data: offerRequest });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search flights";
    console.error("Offer request error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
