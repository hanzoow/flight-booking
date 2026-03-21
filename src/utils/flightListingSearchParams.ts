/**
 * Preserve flight search query when opening passenger checkout and when going back.
 */
export const LISTING_FLIGHT_SEARCH_KEYS = [
  "origin",
  "destination",
  "from",
  "to",
  "tripType",
  "cabin_class",
  "departDate",
  "returnDate",
  "adults",
  "children",
  "infants",
] as const;

type ParamSource = { get: (name: string) => string | null };

export function copyListingParamsToQuery(source: ParamSource): URLSearchParams {
  const q = new URLSearchParams();
  for (const key of LISTING_FLIGHT_SEARCH_KEYS) {
    const v = source.get(key);
    if (v != null && v !== "") q.set(key, v);
  }
  return q;
}

/** `/listing-flights?...` for “back to results” from passengers / payment. */
export function buildListingFlightsSearchHref(source: ParamSource): string {
  const q = copyListingParamsToQuery(source);
  const s = q.toString();
  return s ? `/listing-flights?${s}` : "/listing-flights";
}

/** Passengers URL with offerId + copied search params. */
export function buildPassengersOfferHref(
  offerId: string,
  source: ParamSource
): string {
  const q = new URLSearchParams();
  q.set("offerId", offerId);
  copyListingParamsToQuery(source).forEach((v, k) => q.set(k, v));
  return `/listing-flights/passengers?${q.toString()}`;
}

/**
 * Same as `buildPassengersOfferHref` but accepts a pre-serialized listing query
 * (from parent `useMemo` on listing page).
 */
export function buildPassengersOfferHrefFromListingQuery(
  offerId: string,
  listingSearchQuery: string | undefined
): string {
  const q = new URLSearchParams();
  q.set("offerId", offerId);
  if (listingSearchQuery) {
    new URLSearchParams(listingSearchQuery).forEach((v, k) => {
      if (k !== "offerId") q.set(k, v);
    });
  }
  return `/listing-flights/passengers?${q.toString()}`;
}
