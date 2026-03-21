import { NextRequest, NextResponse } from "next/server";
import { getPlaceSuggestions } from "@/api/places";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("query") ?? undefined;

  if (!query || query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    const places = await getPlaceSuggestions({
      query,
      lat: searchParams.get("lat") ?? undefined,
      lng: searchParams.get("lng") ?? undefined,
      rad: searchParams.get("rad") ?? undefined,
    });

    return NextResponse.json({ data: places });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch suggestions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
