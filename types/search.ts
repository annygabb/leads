export interface SearchLeadsInput {
  city: string;
  state: string;
  niche: string;
  radiusKm: number;
  quantity: number;
  pageToken?: string;
}

export interface SearchLeadsResult {
  jobId: string;
  imported: number;
  skippedDuplicates: number;
  totalFound: number;
  nextPageToken: string | null;
  leads: string[]; // ids of newly created leads
}

// Shape returned by Google Places API (New) — Text Search
export interface GooglePlaceRaw {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  primaryTypeDisplayName?: { text: string };
  photos?: Array<{ name: string }>;
}
