import { getDashboardStats } from "@/actions/dashboard.actions";
import { StatsCards } from "@/components/dashboard/StatsCards";

export default async function DashboardPage() {
  const result = await getDashboardStats();

  if (!result.success) {
    return <div className="p-6 text-red-400">Erro ao carregar estatísticas: {result.error}</div>;
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Visão geral da sua prospecção</p>
      </div>

      <StatsCards stats={result.data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted mb-3">Leads por Status</h2>
          {/* Recharts component — Fase 2 */}
          <div className="text-xs text-muted">
            {Object.entries(result.data.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                <span>{status}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted mb-3">Leads por Cidade</h2>
          <div className="text-xs text-muted">
            {result.data.byCity.map((c) => (
              <div key={c.city} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                <span>{c.city}</span>
                <span className="font-mono">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
