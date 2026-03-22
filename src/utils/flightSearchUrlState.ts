import type { CabinClass } from "@/api/models";

export const FLIGHT_SEARCH_CABIN_LABEL: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First",
};

export interface ParsedFlightSearchFromUrl {
  origin: string;
  destination: string;
  fromLabel: string;
  toLabel: string;
  tripType: string;
  cabinClass: CabinClass;
  departDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  totalGuests: number;
  cabinLabel: string;
  hasSearchParams: boolean;
  isDateValid: boolean;
  dateErrorMessage: string;
}

/**
 * Parse flight listing URL search params (`origin`, `departDate`, guests, etc.).
 */
export function parseFlightSearchFromUrl(sp: {
  get: (name: string) => string | null;
}): ParsedFlightSearchFromUrl {
  const origin = sp.get("origin")?.trim() ?? "";
  const destination = sp.get("destination")?.trim() ?? "";
  const fromLabel = sp.get("from")?.trim() || origin;
  const toLabel = sp.get("to")?.trim() || destination;
  const tripType = sp.get("tripType") || "roundTrip";
  const cabinClass = (sp.get("cabin_class") as CabinClass) || "economy";
  const departDate = sp.get("departDate")?.trim() ?? "";
  const returnDate = sp.get("returnDate")?.trim() ?? "";
  const adults = sp.get("adults") ? parseInt(sp.get("adults")!, 10) : 1;
  const children = sp.get("children") ? parseInt(sp.get("children")!, 10) : 0;
  const infants = sp.get("infants") ? parseInt(sp.get("infants")!, 10) : 0;
  const totalGuests = adults + children + infants;
  const cabinLabel = FLIGHT_SEARCH_CABIN_LABEL[cabinClass] ?? cabinClass;

  const today = new Date().toISOString().split("T")[0];
  const isDateValid = !departDate || departDate >= today;

  const hasSearchParams = Boolean(origin && destination && departDate);

  return {
    origin,
    destination,
    fromLabel,
    toLabel,
    tripType,
    cabinClass,
    departDate,
    returnDate,
    adults,
    children,
    infants,
    totalGuests,
    cabinLabel,
    hasSearchParams,
    isDateValid,
    dateErrorMessage:
      "Departure date must be today or in the future. Please search again.",
  };
}
