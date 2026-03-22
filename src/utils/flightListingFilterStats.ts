import type { Airline, Offer, Place, PlaceAirportSummary } from "@/api/models";

function parseAmount(amount: string): number {
  const n = parseFloat(amount);
  return Number.isFinite(n) ? n : Infinity;
}

export function getCarrierLogoUrl(iataCode: string): string {
  return `https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/${iataCode}.svg`;
}

/** Unique operating-carrier IATA codes on outbound slice (slice 0). */
export function getOutboundOperatingCarrierCodes(offer: Offer): Set<string> {
  const codes = new Set<string>();
  const slice = offer.slices?.[0];
  if (!slice?.segments?.length) return codes;
  for (const seg of slice.segments) {
    const c = seg.operating_carrier?.iata_code;
    if (c) codes.add(c);
  }
  return codes;
}

function formatLayoverLabel(airport: Place | PlaceAirportSummary): string {
  const code = airport.iata_code;
  const name = airport.name;
  const city =
    "city_name" in airport && airport.city_name
      ? airport.city_name
      : "city" in airport && airport.city?.name
        ? airport.city.name
        : null;
  if (city) return `${city} (${code}-${name})`;
  return `${name} (${code})`;
}

/**
 * Layover points on outbound only: in-segment stops + connection airports
 * between segments. Excludes final destination of the slice.
 */
export function getOutboundLayovers(
  offer: Offer
): Array<{ iata: string; label: string }> {
  const slice = offer.slices?.[0];
  if (!slice?.segments?.length) return [];
  const segs = slice.segments;
  const seen = new Set<string>();
  const out: Array<{ iata: string; label: string }> = [];

  const push = (ap: Place | PlaceAirportSummary | undefined) => {
    if (!ap?.iata_code || seen.has(ap.iata_code)) return;
    seen.add(ap.iata_code);
    out.push({ iata: ap.iata_code, label: formatLayoverLabel(ap) });
  };

  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    for (const st of seg.stops ?? []) {
      if (st.airport) push(st.airport);
    }
    if (i < segs.length - 1) push(seg.destination);
  }

  return out;
}

export function getOutboundLayoverIataSet(offer: Offer): Set<string> {
  return new Set(getOutboundLayovers(offer).map((x) => x.iata));
}

export interface AirlineFilterRow {
  iataCode: string;
  name: string;
  logoSymbolUrl?: string;
  count: number;
  minTotalAmount: number | null;
  currency: string;
}

export interface LayoverFilterRow {
  iataCode: string;
  label: string;
  count: number;
  minTotalAmount: number | null;
  currency: string;
}

export function buildAirlineFilterStats(offers: Offer[]): AirlineFilterRow[] {
  const buckets = new Map<
    string,
    { offers: Offer[]; sample: Airline }
  >();

  for (const offer of offers) {
    const codes = getOutboundOperatingCarrierCodes(offer);
    const slice = offer.slices?.[0];
    const firstByCode = new Map<string, Airline>();
    for (const seg of slice?.segments ?? []) {
      const c = seg.operating_carrier;
      if (c?.iata_code && !firstByCode.has(c.iata_code)) {
        firstByCode.set(c.iata_code, c);
      }
    }
    Array.from(codes).forEach((code) => {
      let b = buckets.get(code);
      if (!b) {
        const sample = firstByCode.get(code);
        if (!sample) return;
        b = { offers: [], sample };
        buckets.set(code, b);
      }
      b.offers.push(offer);
    });
  }

  const defaultCurrency = offers[0]?.total_currency ?? "USD";
  const rows: AirlineFilterRow[] = [];

  Array.from(buckets.entries()).forEach(([iataCode, { offers: list, sample }]) => {
    const amounts = list.map((o: Offer) => parseAmount(o.total_amount));
    const minTotalAmount =
      list.length > 0 ? Math.min(...amounts) : null;
    const currency =
      list.find((o: Offer) => o.total_currency)?.total_currency ?? defaultCurrency;
    rows.push({
      iataCode,
      name: sample.name,
      logoSymbolUrl: sample.logo_symbol_url,
      count: list.length,
      minTotalAmount:
        minTotalAmount !== null && Number.isFinite(minTotalAmount)
          ? minTotalAmount
          : null,
      currency,
    });
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

export function buildLayoverFilterStats(offers: Offer[]): LayoverFilterRow[] {
  const buckets = new Map<
    string,
    { offers: Offer[]; label: string }
  >();

  for (const offer of offers) {
    const layovers = getOutboundLayovers(offer);
    for (const { iata, label } of layovers) {
      let b = buckets.get(iata);
      if (!b) {
        b = { offers: [], label };
        buckets.set(iata, b);
      }
      b.offers.push(offer);
    }
  }

  const defaultCurrency = offers[0]?.total_currency ?? "USD";
  const rows: LayoverFilterRow[] = [];

  Array.from(buckets.entries()).forEach(([iataCode, { offers: list, label }]) => {
    const amounts = list.map((o: Offer) => parseAmount(o.total_amount));
    const minTotalAmount =
      list.length > 0 ? Math.min(...amounts) : null;
    const currency =
      list.find((o: Offer) => o.total_currency)?.total_currency ?? defaultCurrency;
    rows.push({
      iataCode,
      label,
      count: list.length,
      minTotalAmount:
        minTotalAmount !== null && Number.isFinite(minTotalAmount)
          ? minTotalAmount
          : null,
      currency,
    });
  });

  rows.sort((a, b) => a.label.localeCompare(b.label));
  return rows;
}

export function offerMatchesAirlineFilter(
  offer: Offer,
  selected: Set<string>
): boolean {
  if (selected.size === 0) return true;
  const codes = getOutboundOperatingCarrierCodes(offer);
  return Array.from(selected).some((s) => codes.has(s));
}

export function offerMatchesLayoverFilter(
  offer: Offer,
  selected: Set<string>
): boolean {
  if (selected.size === 0) return true;
  const layovers = getOutboundLayoverIataSet(offer);
  return Array.from(selected).some((s) => layovers.has(s));
}
