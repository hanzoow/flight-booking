export type PlaceType = "airport" | "city";

export interface PlaceAirportSummary {
  time_zone: string | null;
  name: string;
  longitude: number | null;
  latitude: number | null;
  id: string;
  icao_code: string | null;
  iata_country_code: string;
  iata_code: string;
}

export interface PlaceCity {
  name: string;
  id: string;
  iata_country_code: string;
  iata_code: string;
  airports?: PlaceAirportSummary[];
}

export interface Place {
  type: PlaceType;
  time_zone: string | null;
  name: string;
  longitude: number | null;
  latitude: number | null;
  id: string;
  icao_code: string | null;
  iata_country_code: string;
  iata_code: string;
  iata_city_code: string | null;
  city_name: string | null;
  city: PlaceCity | null;
  airports: Place[] | null;
}

export interface PlaceSuggestionsParams {
  query?: string;
  lat?: string;
  lng?: string;
  rad?: string;
}
