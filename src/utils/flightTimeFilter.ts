import type { Offer } from "@/api/models";

/** Wall-clock minutes from midnight using the time embedded in ISO (Duffel local departure/arrival). */
export function getWallClockMinutesFromIso(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (m) {
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (Number.isFinite(hh) && Number.isFinite(mm)) return hh * 60 + mm;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function getOutboundDepartureMinutes(offer: Offer): number | null {
  const seg = offer.slices?.[0]?.segments?.[0];
  return getWallClockMinutesFromIso(seg?.departing_at);
}

export function getOutboundArrivalMinutes(offer: Offer): number | null {
  const segs = offer.slices?.[0]?.segments;
  if (!segs?.length) return null;
  const last = segs[segs.length - 1];
  return getWallClockMinutesFromIso(last?.arriving_at);
}

export type TimeOfDayBucketId = "morning" | "afternoon" | "night";

/** Half-open intervals [start, end) in minutes from midnight */
export const TIME_OF_DAY_BUCKETS: Record<
  TimeOfDayBucketId,
  { label: string; sublabel: string; start: number; end: number }
> = {
  morning: {
    label: "00:00 – 12:00",
    sublabel: "morning",
    start: 0,
    end: 12 * 60,
  },
  afternoon: {
    label: "12:00 – 18:00",
    sublabel: "afternoon",
    start: 12 * 60,
    end: 18 * 60,
  },
  night: {
    label: "18:00 – 24:00",
    sublabel: "night",
    start: 18 * 60,
    end: 24 * 60,
  },
};

export function minutesInTimeBucket(
  minutes: number,
  id: TimeOfDayBucketId
): boolean {
  const b = TIME_OF_DAY_BUCKETS[id];
  return minutes >= b.start && minutes < b.end;
}

/** Full day = half-open [0, 1440) — no range restriction */
export function isFullDayRange(range: [number, number]): boolean {
  return range[0] <= 0 && range[1] >= 1440;
}

/**
 * `dep` in minutes 0..1439. Range is half-open [range[0], range[1]).
 * Buckets: if empty, skip; else must match at least one.
 */
export function matchesTimeFilters(
  dep: number | null,
  selectedBuckets: Set<TimeOfDayBucketId>,
  range: [number, number]
): boolean {
  if (dep == null) return false;
  if (!isFullDayRange(range)) {
    if (dep < range[0] || dep >= range[1]) return false;
  }
  if (selectedBuckets.size === 0) return true;
  return Array.from(selectedBuckets).some((id) =>
    minutesInTimeBucket(dep, id)
  );
}
