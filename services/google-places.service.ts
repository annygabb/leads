import "server-only";
import type { GooglePlaceRaw } from "@/types/search";

const PLACES_BASE_URL = "https://places.googleapis.com/v1/places";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.googleMapsUri",
  "places.primaryTypeDisplayName",
  "places.photos",
  "nextPageToken",
].join(",");

interface TextSearchResponse {
  places?: GooglePlaceRaw[];
  nextPageToken?: string;
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY não configurada. Verifique o arquivo .env."
    );
  }
  return key;
}

/**
 * Busca empresas via Google Places API (New) — Text Search.
 * Sempre isolado neste serviço; nunca chamado diretamente de páginas ou componentes.
 */
export async function searchPlaces(params: {
  query: string; // e.g. "clínicas odontológicas em Silvânia, GO"
  radiusMeters: number;
  latitude?: number;
  longitude?: number;
  pageToken?: string;
}): Promise<TextSearchResponse> {
  const body: Record<string, unknown> = {
    textQuery: params.query,
    languageCode: "pt-BR",
    regionCode: "BR",
  };

  if (params.pageToken) {
    body.pageToken = params.pageToken;
  } else if (params.latitude && params.longitude) {
    body.locationBias = {
      circle: {
        center: { latitude: params.latitude, longitude: params.longitude },
        radius: params.radiusMeters,
      },
    };
  }

  const res = await fetch(`${PLACES_BASE_URL}:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Erro na Google Places API (${res.status}): ${errorBody}`
    );
  }

  return res.json();
}

/**
 * Geocodifica uma cidade/estado em lat/lng para usar como centro de busca por raio.
 */
export async function geocodeCity(
  city: string,
  state: string
): Promise<{ latitude: number; longitude: number } | null> {
  const query = encodeURIComponent(`${city}, ${state}, Brasil`);
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${getApiKey()}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const location = data?.results?.[0]?.geometry?.location;
  if (!location) return null;

  return { latitude: location.lat, longitude: location.lng };
}

function extractAddressComponent(
  place: GooglePlaceRaw,
  type: string
): string | null {
  const component = place.addressComponents?.find((c) =>
    c.types.includes(type)
  );
  return component?.longText ?? null;
}

/**
 * Normaliza o payload cru da Google Places API para o formato interno de Lead.
 */
export function mapPlaceToLeadInput(place: GooglePlaceRaw) {
  const city =
    extractAddressComponent(place, "administrative_area_level_2") ??
    extractAddressComponent(place, "locality");
  const state = extractAddressComponent(place, "administrative_area_level_1");
  const postalCode = extractAddressComponent(place, "postal_code");

  return {
    google_place_id: place.id,
    company_name: place.displayName?.text ?? "Empresa sem nome",
    phone:
      place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    google_maps_url: place.googleMapsUri ?? null,
    address: place.formattedAddress ?? null,
    city,
    state,
    postal_code: postalCode,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    category: place.primaryTypeDisplayName?.text ?? null,
    google_rating: place.rating ?? null,
    google_reviews_count: place.userRatingCount ?? 0,
    photos_count: place.photos?.length ?? 0,
    has_website: Boolean(place.websiteUri),
    has_instagram: false, // Places API não retorna redes sociais diretamente
    has_facebook: false,
  };
}
