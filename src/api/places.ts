import { duffelGet } from "./duffel-client";
import { Place, PlaceSuggestionsParams } from "./models";

export async function getPlaceSuggestions(
  params: PlaceSuggestionsParams
): Promise<Place[]> {
  const response = await duffelGet<Place[]>("/places/suggestions", {
    query: params.query,
    lat: params.lat,
    lng: params.lng,
    rad: params.rad,
  });
  return response.data;
}
