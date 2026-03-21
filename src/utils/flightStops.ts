import type { Offer, Segment } from "@/api/models";

/**
 * Total passenger-visible stops on a slice (outbound or return):
 * - Each `Segment.stops[]` = intermediate airport on that leg
 * - Each extra segment = one connection (plane change)
 */
export function getTotalStopCount(segments: Segment[]): number {
  if (!segments.length) return 0;
  const inSegmentStops = segments.reduce(
    (sum, seg) => sum + (seg.stops?.length ?? 0),
    0
  );
  const connections = Math.max(0, segments.length - 1);
  return inSegmentStops + connections;
}

/** First slice = outbound leg for search results UI */
export function getOutboundStopCount(offer: Offer): number {
  const slice = offer.slices?.[0];
  if (!slice?.segments?.length) return 0;
  return getTotalStopCount(slice.segments);
}

export type StopBucketId = "nonstop" | "one_stop" | "two_plus";

export function getStopBucketId(stopCount: number): StopBucketId {
  if (stopCount <= 0) return "nonstop";
  if (stopCount === 1) return "one_stop";
  return "two_plus";
}

export const STOP_BUCKET_LABELS: Record<StopBucketId, string> = {
  nonstop: "Non-stop",
  one_stop: "1 Stop",
  two_plus: "2+ Stops",
};

export interface StopBucketStats {
  id: StopBucketId;
  label: string;
  count: number;
  /** Minimum total_amount in this bucket (null if count === 0) */
  minTotalAmount: number | null;
  currency: string;
}

function parseAmount(amount: string): number {
  const n = parseFloat(amount);
  return Number.isFinite(n) ? n : Infinity;
}

/**
 * Aggregate offers into stop buckets with counts and minimum price per bucket.
 */
export function buildStopsFilterStats(offers: Offer[]): StopBucketStats[] {
  const buckets: Record<StopBucketId, Offer[]> = {
    nonstop: [],
    one_stop: [],
    two_plus: [],
  };

  for (const offer of offers) {
    const n = getOutboundStopCount(offer);
    const id = getStopBucketId(n);
    buckets[id].push(offer);
  }

  const defaultCurrency = offers[0]?.total_currency ?? "USD";

  return (["nonstop", "one_stop", "two_plus"] as const).map((id) => {
    const list = buckets[id];
    const amounts = list.map((o) => parseAmount(o.total_amount));
    const minTotalAmount =
      list.length > 0 ? Math.min(...amounts) : null;
    const currency =
      list.find((o) => o.total_currency)?.total_currency ?? defaultCurrency;

    return {
      id,
      label: STOP_BUCKET_LABELS[id],
      count: list.length,
      minTotalAmount:
        minTotalAmount !== null && Number.isFinite(minTotalAmount)
          ? minTotalAmount
          : null,
      currency,
    };
  });
}

export function getStopLabelForSegments(segments: Segment[]): string {
  const n = getTotalStopCount(segments);
  if (n === 0) return "Nonstop";
  if (n === 1) return "1 stop";
  return `${n} stops`;
}

export function parseIsoDurationToMinutes(iso: string | undefined): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  return h * 60 + min;
}
