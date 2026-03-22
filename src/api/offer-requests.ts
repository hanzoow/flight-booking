import { duffelPost } from "./duffel-client";
import {
  CabinClass,
  CreateOfferRequestBody,
  OfferRequestResponse,
  OfferRequestPassenger,
  OfferRequestSlice,
} from "./models";

export interface SearchFlightsParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabin_class?: CabinClass;
  max_connections?: number;
}

export async function createOfferRequest(
  params: SearchFlightsParams
): Promise<OfferRequestResponse> {
  const slices: OfferRequestSlice[] = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departDate,
    },
  ];

  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    });
  }

  const passengers: OfferRequestPassenger[] = [];
  for (let i = 0; i < params.adults; i++) {
    passengers.push({ type: "adult" });
  }
  for (let i = 0; i < params.children; i++) {
    passengers.push({ age: 10 });
  }
  for (let i = 0; i < params.infants; i++) {
    passengers.push({ age: 1 });
  }

  if (passengers.length === 0) {
    passengers.push({ type: "adult" });
  }

  const body: CreateOfferRequestBody = {
    data: {
      slices,
      passengers,
      cabin_class: params.cabin_class,
      max_connections: params.max_connections ?? 1,
    },
  };

  const response = await duffelPost<OfferRequestResponse>(
    "/air/offer_requests?return_offers=true&supplier_timeout=15000",
    body
  );

  // Full JSON in terminal: add DEBUG_DUFFEL_OFFERS=1 to .env.local and watch `npm run dev` (API route) output.
  // Use DEBUG_DUFFEL_OFFERS=all to log the whole offer_request object (not only offers[]).
  if (process.env.DEBUG_DUFFEL_OFFERS === "1") {
    console.log(
      "[createOfferRequest] offers[] JSON:\n%s",
      JSON.stringify(response.data.offers ?? [], null, 2)
    );
  } else if (process.env.DEBUG_DUFFEL_OFFERS === "all") {
    console.log(
      "[createOfferRequest] full response.data JSON:\n%s",
      JSON.stringify(response.data, null, 2)
    );
  }

  return response.data;
}
