import { Place, PlaceAirportSummary } from "./places";

// ─── Cabin Class ──────────────────────────────────────────────
export type CabinClass = "first" | "business" | "premium_economy" | "economy";

// ─── Passenger (Request) ──────────────────────────────────────
export type PassengerType = "adult" | "child" | "infant_without_seat" | string;

export interface OfferRequestPassenger {
  type?: PassengerType;
  age?: number;
  fare_type?: string;
}

// ─── Slice (Request) ──────────────────────────────────────────
export interface TimeFilter {
  from: string;
  to: string;
}

export interface OfferRequestSlice {
  origin: string;
  destination: string;
  departure_date: string;
  departure_time?: TimeFilter;
  arrival_time?: TimeFilter;
}

// ─── Create Offer Request Body ────────────────────────────────
export interface CreateOfferRequestBody {
  data: {
    slices: OfferRequestSlice[];
    passengers: OfferRequestPassenger[];
    cabin_class?: CabinClass;
    max_connections?: number;
  };
}

// ─── Airline / Carrier ────────────────────────────────────────
export interface Airline {
  name: string;
  id: string;
  iata_code: string;
  logo_symbol_url?: string;
  logo_lockup_url?: string;
  conditions_of_carriage_url?: string;
}

// ─── Aircraft ─────────────────────────────────────────────────
export interface Aircraft {
  name: string;
  id: string;
  iata_code: string;
}

// ─── Stop ─────────────────────────────────────────────────────
export interface Stop {
  id: string;
  duration: string;
  departing_at: string;
  arriving_at: string;
  airport: Place;
}

// ─── Baggage ──────────────────────────────────────────────────
export interface Baggage {
  type: "checked" | "carry_on";
  quantity: number;
}

// ─── Segment Passenger ────────────────────────────────────────
export interface SegmentPassenger {
  passenger_id: string;
  fare_basis_code: string;
  cabin_class_marketing_name: string;
  cabin_class: CabinClass;
  cabin?: {
    name: string;
    marketing_name: string;
    amenities?: Record<string, unknown>;
  };
  baggages: Baggage[];
}

// ─── Segment ──────────────────────────────────────────────────
export interface Segment {
  id: string;
  origin: PlaceAirportSummary & { city_name?: string; city?: { name: string; id: string; iata_country_code: string; iata_code: string } };
  destination: PlaceAirportSummary & { city_name?: string; city?: { name: string; id: string; iata_country_code: string; iata_code: string } };
  origin_terminal: string | null;
  destination_terminal: string | null;
  departing_at: string;
  arriving_at: string;
  duration: string;
  distance: string | null;
  operating_carrier: Airline;
  operating_carrier_flight_number: string;
  marketing_carrier: Airline;
  marketing_carrier_flight_number: string;
  aircraft: Aircraft | null;
  /** Intermediate airports on this segment (same marketed flight). */
  stops?: Stop[];
  passengers: SegmentPassenger[];
}

// ─── Offer Slice ──────────────────────────────────────────────
export interface OfferSlice {
  id: string;
  origin: Place;
  destination: Place;
  origin_type: string;
  destination_type: string;
  duration: string;
  fare_brand_name: string | null;
  segments: Segment[];
  conditions?: Record<string, unknown>;
  comparison_key?: string;
}

// ─── Offer Conditions ─────────────────────────────────────────
export interface OfferConditionDetail {
  allowed: boolean;
  penalty_amount: string | null;
  penalty_currency: string | null;
}

export interface OfferConditions {
  refund_before_departure?: OfferConditionDetail;
  change_before_departure?: OfferConditionDetail;
}

// ─── Payment Requirements ─────────────────────────────────────
export interface PaymentRequirements {
  requires_instant_payment: boolean;
  price_guarantee_expires_at: string | null;
  payment_required_by: string | null;
}

// ─── Offer Passenger ──────────────────────────────────────────
export interface OfferPassenger {
  id: string;
  /** e.g. adult, child, infant_without_seat */
  type: PassengerType;
  age?: number;
  given_name?: string;
  family_name?: string;
  fare_type?: string;
  loyalty_programme_accounts?: Array<{
    airline_iata_code: string;
    account_number: string;
  }>;
}

// ─── Offer ────────────────────────────────────────────────────
export interface Offer {
  id: string;
  live_mode: boolean;
  total_amount: string;
  total_currency: string;
  total_emissions_kg: string | null;
  base_amount: string;
  base_currency: string;
  tax_amount: string;
  tax_currency: string;
  owner: Airline;
  slices: OfferSlice[];
  passengers: OfferPassenger[];
  conditions: OfferConditions;
  payment_requirements: PaymentRequirements;
  partial: boolean;
  expires_at: string;
  created_at: string;
  passenger_identity_documents_required: boolean;
  supported_passenger_identity_document_types?: string[];
}

// ─── Offer Request Response ───────────────────────────────────
export interface OfferRequestResponse {
  id: string;
  live_mode: boolean;
  created_at: string;
  cabin_class: CabinClass | null;
  client_key: string;
  slices: Array<{
    origin: Place;
    destination: Place;
    origin_type: string;
    destination_type: string;
    departure_date: string;
  }>;
  passengers: OfferPassenger[];
  offers: Offer[];
}
