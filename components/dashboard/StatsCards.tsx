import { Users, Flame, Sun, Snowflake, Globe, Instagram, Handshake, DollarSign } from "lucide-react";
import type { DashboardStats } from "@/actions/dashboard.actions";
import { cn } from "@/lib/utils";

interface StatCardDef {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards: StatCardDef[] = [
    { label: "Total de Leads", value: stats.total, icon: Users, accent: "#7DD3FC" },
    { label: "Leads Quentes", value: stats.hot, icon: Flame, accent: "#EF4444" },
    { label: "Leads Mornos", value: stats.warm, icon: Sun, accent: "#F97316" },
    { label: "Leads Frios", value: stats.cold, icon: Snowflake, accent: "#3B82F6" },
    { label: "Sem Site", value: stats.semSite, icon: Globe, accent: "#EAB308" },
    { label: "Sem Instagram", value: stats.semInstagram, icon: Instagram, accent: "#EAB308" },
    { label: "Clientes", value: stats.clientes, icon: Handshake, accent: "#22C55E" },
    { label: "Ganhos", value: stats.ganhos, icon: DollarSign, accent: "#22C55E" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "rounded-lg border border-border bg-card p-4 flex flex-col gap-3",
            "transition-transform hover:-translate-y-0.5 hover:border-[#2c4160]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{card.label}</span>
            <card.icon size={16} style={{ color: card.accent }} />
          </div>
          <span className="text-2xl font-semibold tracking-tight">{card.value}</span>
        </div>
      ))}
    </div>
  );
}
