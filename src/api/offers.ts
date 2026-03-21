import { duffelGet } from "./duffel-client";
import type { Offer } from "./models";

/**
 * Fetches the latest version of an offer by id.
 * Offers expire quickly; call this when the user selects an offer before collecting
 * passenger + payment details. See Duffel "Getting Started with Flights".
 */
export async function getOfferById(offerId: string): Promise<Offer> {
  const response = await duffelGet<Offer>(`/air/offers/${encodeURIComponent(offerId)}`);
  return response.data;
}
