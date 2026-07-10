"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { getLeads } from "@/actions/leads.actions";
import { LeadsTable } from "@/components/table/LeadsTable";
import { SearchLeadsModal } from "@/components/modals/SearchLeadsModal";
import type { Lead } from "@/types/lead";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  async function loadLeads() {
    setLoading(true);
    const result = await getLeads({ pageSize: 100 });
    if (result.success && result.data) setLeads(result.data.leads);
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-sm text-muted mt-1">{leads.length} leads cadastrados</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-card">
            <Plus size={14} /> Cadastro manual
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-md bg-[#3B82F6] px-3 py-2 text-sm font-medium hover:brightness-110"
          >
            <Search size={14} /> Buscar Leads
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card h-64 skeleton" />
      ) : (
        <LeadsTable leads={leads} />
      )}

      <SearchLeadsModal
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) loadLeads();
        }}
      />
    </div>
  );
}
