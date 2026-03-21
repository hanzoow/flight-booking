import type { Offer } from "@/api/models";

export function isRoundTripOffer(offer: Offer): boolean {
  return offer.slices.length >= 2;
}

/**
 * Groups round-trip offers that share the same outbound leg (Duffel slice comparison_key).
 */
export function getOutboundGroupKey(offer: Offer): string | null {
  if (!isRoundTripOffer(offer)) return null;
  const out = offer.slices[0];
  if (out.comparison_key) return out.comparison_key;
  const segIds = out.segments.map((s) => s.id).join("|");
  return segIds || `slice:${out.id}`;
}

export function groupOffersByOutbound(offers: Offer[]): Map<string, Offer[]> {
  const map = new Map<string, Offer[]>();
  for (const o of offers) {
    const k = getOutboundGroupKey(o);
    if (!k) continue;
    const list = map.get(k) ?? [];
    list.push(o);
    map.set(k, list);
  }
  return map;
}

export function minTotalInOffers(offers: Offer[]): number {
  if (offers.length === 0) return 0;
  return Math.min(...offers.map((o) => parseFloat(o.total_amount)));
}

export function cheapestOffer(offers: Offer[]): Offer | null {
  if (offers.length === 0) return null;
  return [...offers].sort(
    (a, b) =>
      parseFloat(a.total_amount) - parseFloat(b.total_amount) ||
      a.id.localeCompare(b.id)
  )[0]!;
}
