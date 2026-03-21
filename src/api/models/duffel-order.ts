/**
 * Subset of Duffel order JSON used by confirmation / “My Booking” UI.
 * @see https://duffel.com/docs/api/v2/orders/schema
 */

export interface DuffelAirportInfo {
  iata_code?: string;
  name?: string;
  city_name?: string;
  timezone?: string;
}

export interface DuffelCarrier {
  iata_code?: string;
  name?: string;
  logo_symbol_url?: string | null;
}

export interface DuffelOrderSegment {
  id?: string;
  departing_at?: string;
  arriving_at?: string;
  origin_terminal?: string | null;
  destination_terminal?: string | null;
  duration?: string | null;
  distance?: string | null;
  origin?: DuffelAirportInfo;
  destination?: DuffelAirportInfo;
  marketing_carrier?: DuffelCarrier;
  marketing_carrier_flight_number?: string | null;
  operating_carrier?: DuffelCarrier;
  operating_carrier_flight_number?: string | null;
  aircraft?: { name?: string; iata_code?: string } | null;
}

export interface DuffelOrderSlice {
  id?: string;
  origin?: DuffelAirportInfo;
  destination?: DuffelAirportInfo;
  duration?: string | null;
  fare_brand_name?: string | null;
  segments?: DuffelOrderSegment[];
}

export interface DuffelOrderPassenger {
  id?: string;
  type?: string;
  given_name?: string | null;
  family_name?: string | null;
  title?: string | null;
}

/** Rich order from GET /air/orders/:id (typed loosely for forward compatibility). */
export interface DuffelOrderRecord {
  id: string;
  type?: "instant" | "hold";
  booking_reference?: string | null;
  total_amount: string;
  total_currency: string;
  payment_required_by?: string | null;
  offer_id?: string;
  created_at?: string;
  cancelled_at?: string | null;
  base_amount?: string;
  tax_amount?: string;
  slices?: DuffelOrderSlice[];
  passengers?: DuffelOrderPassenger[];
}
