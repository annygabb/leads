"use server";

import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/lead";

type StatsRow = Pick<Lead, "score" | "status" | "city" | "category">;

export interface DashboardStats {
  total: number;
  hot: number; // score >= 80
  warm: number; // score 40-79
  cold: number; // score < 40
  semSite: number;
  semInstagram: number;
  clientes: number;
  ganhos: number; // status = 'pago' | 'finalizado'
  byStatus: Record<string, number>;
  byCity: Array<{ city: string; count: number }>;
  byNiche: Array<{ niche: string; count: number }>;
}

export async function getDashboardStats(): Promise<
  { success: true; data: DashboardStats } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const { data: leads, error } = await supabase
    .from("leads")
    .select("score, status, city, category")
    .eq("user_id", user.id)
    .returns<StatsRow[]>();

  if (error) return { success: false, error: error.message };
  const rows = leads ?? [];

  const stats: DashboardStats = {
    total: rows.length,
    hot: rows.filter((l) => l.score >= 80).length,
    warm: rows.filter((l) => l.score >= 40 && l.score < 80).length,
    cold: rows.filter((l) => l.score < 40).length,
    semSite: 0,
    semInstagram: 0,
    clientes: rows.filter((l) => l.status === "cliente").length,
    ganhos: rows.filter((l) => ["pago", "finalizado"].includes(l.status)).length,
    byStatus: {},
    byCity: [],
    byNiche: [],
  };

  const cityMap = new Map<string, number>();
  const nicheMap = new Map<string, number>();

  for (const lead of rows) {
    stats.byStatus[lead.status] = (stats.byStatus[lead.status] ?? 0) + 1;
    if (lead.city) cityMap.set(lead.city, (cityMap.get(lead.city) ?? 0) + 1);
    if (lead.category) nicheMap.set(lead.category, (nicheMap.get(lead.category) ?? 0) + 1);
  }

  stats.byCity = Array.from(cityMap, ([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  stats.byNiche = Array.from(nicheMap, ([niche, count]) => ({ niche, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { success: true, data: stats };
}
