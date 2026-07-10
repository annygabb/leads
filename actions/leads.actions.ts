"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateLeadFieldSchema,
  createLeadManualSchema,
  type CreateLeadManualInput,
} from "@/lib/validations/lead.schema";
import type { Lead, LeadFilters } from "@/types/lead";

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Atualiza um único campo de um lead (auto-save — sem botão salvar).
 * Registra a alteração em lead_history para auditoria completa.
 */
export async function updateLeadField(input: {
  leadId: string;
  field: string;
  value: string | number | boolean | null;
}): Promise<ActionResult<null>> {
  const parsed = updateLeadFieldSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { leadId, field, value } = parsed.data;

  const { data: existingLead, error: fetchError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existingLead) {
    return { success: false, error: "Lead não encontrado" };
  }

  const oldValue = (existingLead as unknown as Record<string, unknown>)[field];

  const { error: updateError } = await supabase
    .from("leads")
    .update({ [field]: value } as Record<string, unknown>)
    .eq("id", leadId)
    .eq("user_id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("lead_history").insert({
    lead_id: leadId,
    user_id: user.id,
    field_changed: field,
    old_value: oldValue === null || oldValue === undefined ? null : String(oldValue),
    new_value: value === null ? null : String(value),
  });

  revalidatePath("/leads");
  return { success: true, data: null };
}

export async function getLeads(
  filters: LeadFilters = {}
): Promise<ActionResult<{ leads: Lead[]; total: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  if (filters.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,owner_name.ilike.%${filters.search}%`
    );
  }
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.state) query = query.eq("state", filters.state);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status?.length) query = query.in("status", filters.status);
  if (filters.priority?.length) query = query.in("priority", filters.priority);
  if (filters.hasWebsite !== undefined) query = query.eq("has_website", filters.hasWebsite);
  if (filters.hasInstagram !== undefined) query = query.eq("has_instagram", filters.hasInstagram);
  if (filters.hasEmail) query = query.not("email", "is", null);
  if (filters.hasWhatsapp) query = query.not("whatsapp", "is", null);
  if (filters.favoritesOnly) query = query.eq("is_favorite", true);
  if (filters.minScore !== undefined) query = query.gte("score", filters.minScore);
  if (filters.maxScore !== undefined) query = query.lte("score", filters.maxScore);

  const sortBy = filters.sortBy ?? "created_at";
  const ascending = filters.sortDirection === "asc";
  query = query.order(sortBy, { ascending }).range(from, to);

  const { data, error, count } = await query;
  if (error) return { success: false, error: error.message };

  return { success: true, data: { leads: (data ?? []) as Lead[], total: count ?? 0 } };
}

export async function createLeadManual(
  input: CreateLeadManualInput
): Promise<ActionResult<Lead>> {
  const parsed = createLeadManualSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: data as Lead };
}

export async function duplicateLead(leadId: string): Promise<ActionResult<Lead>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data: original, error: fetchError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !original) return { success: false, error: "Lead não encontrado" };

  const { id, created_at, updated_at, google_place_id, ...rest } = original as Lead;

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...rest, company_name: `${rest.company_name} (cópia)`, user_id: user.id })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: data as Lead };
}

export async function deleteLead(leadId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/leads");
  return { success: true, data: null };
}

export async function toggleFavorite(
  leadId: string,
  isFavorite: boolean
): Promise<ActionResult<null>> {
  return updateLeadField({ leadId, field: "is_favorite", value: isFavorite });
}

export async function getLeadHistory(leadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_history")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, data };
}
