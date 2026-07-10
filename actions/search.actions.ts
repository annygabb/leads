"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { searchPlaces, geocodeCity, mapPlaceToLeadInput } from "@/services/google-places.service";
import { calculateLeadScore, scoreToPriority } from "@/services/score.service";
import { searchLeadsSchema, type SearchLeadsInput } from "@/lib/validations/lead.schema";
import type { SearchLeadsResult } from "@/types/search";

/**
 * Busca empresas na Google Places API, calcula score, evita duplicados
 * (por google_place_id) e salva automaticamente no banco.
 * Suporta paginação via next_page_token para "Carregar mais".
 */
export async function searchLeads(
  input: SearchLeadsInput
): Promise<{ success: boolean; data?: SearchLeadsResult; error?: string }> {
  const parsed = searchLeadsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { city, state, niche, radiusKm, pageToken } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  try {
    let coords: { latitude: number; longitude: number } | null = null;
    if (!pageToken) {
      coords = await geocodeCity(city, state);
    }

    const placesResponse = await searchPlaces({
      query: `${niche} em ${city}, ${state}`,
      radiusMeters: radiusKm * 1000,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      pageToken,
    });

    const places = placesResponse.places ?? [];

    // Regras de score ativas do usuário
    const { data: rules } = await supabase
      .from("score_rules")
      .select("key, points, active")
      .eq("user_id", user.id)
      .returns<Array<{ key: string; points: number; active: boolean }>>();

    const activeRules = rules ?? [];

    // Descobre quais desses google_place_id já existem para este usuário (dedup)
    const placeIds = places.map((p) => p.id);
    const { data: existing } = await supabase
      .from("leads")
      .select("google_place_id")
      .eq("user_id", user.id)
      .in("google_place_id", placeIds)
      .returns<Array<{ google_place_id: string | null }>>();

    const existingIds = new Set((existing ?? []).map((e) => e.google_place_id));

    const newPlaces = places.filter((p) => !existingIds.has(p.id));

    const leadsToInsert = newPlaces.map((place) => {
      const mapped = mapPlaceToLeadInput(place);
      const score = calculateLeadScore(
        {
          has_website: mapped.has_website,
          has_instagram: mapped.has_instagram,
          google_reviews_count: mapped.google_reviews_count,
          google_rating: mapped.google_rating,
          photos_count: mapped.photos_count,
          email: null,
          whatsapp: null,
          website: mapped.website,
        },
        activeRules
      );

      return {
        ...mapped,
        user_id: user.id,
        score,
        priority: scoreToPriority(score),
        status: "nao_iniciado" as const,
      };
    });

    let insertedIds: string[] = [];
    if (leadsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("leads")
        .insert(leadsToInsert)
        .select("id")
        .returns<Array<{ id: string }>>();

      if (insertError) {
        return { success: false, error: insertError.message };
      }
      insertedIds = (inserted ?? []).map((l) => l.id);
    }

    const { data: job } = await supabase
      .from("search_jobs")
      .insert({
        user_id: user.id,
        city,
        state,
        niche,
        radius_km: radiusKm,
        requested_count: parsed.data.quantity,
        next_page_token: placesResponse.nextPageToken ?? null,
        total_found: places.length,
        total_new: leadsToInsert.length,
        status: "completed",
      })
      .select("id")
      .single<{ id: string }>();

    revalidatePath("/leads");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        jobId: job?.id ?? "",
        imported: leadsToInsert.length,
        skippedDuplicates: places.length - leadsToInsert.length,
        totalFound: places.length,
        nextPageToken: placesResponse.nextPageToken ?? null,
        leads: insertedIds,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao buscar leads";
    return { success: false, error: message };
  }
}
