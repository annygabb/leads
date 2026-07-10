"use client";

import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { searchLeadsSchema, type SearchLeadsInput } from "@/lib/validations/lead.schema";
import { searchLeads } from "@/actions/search.actions";

interface SearchLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchLeadsModal({ open, onOpenChange }: SearchLeadsModalProps) {
  const [isPending, startTransition] = useTransition();
  const [progressLabel, setProgressLabel] = useState("");
  const [lastPageToken, setLastPageToken] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<SearchLeadsInput | null>(null);
  const cancelledRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchLeadsInput>({
    resolver: zodResolver(searchLeadsSchema),
    defaultValues: { radiusKm: 10, quantity: 20 },
  });

  function runSearch(input: SearchLeadsInput) {
    cancelledRef.current = false;
    setProgressLabel("Buscando empresas no Google Places...");
    startTransition(async () => {
      const result = await searchLeads(input);
      if (cancelledRef.current) return;

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Erro ao buscar leads");
        setProgressLabel("");
        return;
      }

      toast.success(
        `${result.data.imported} novos leads importados (${result.data.skippedDuplicates} duplicados ignorados)`
      );
      setLastPageToken(result.data.nextPageToken);
      setLastParams(input);
      setProgressLabel("");
    });
  }

  function handleLoadMore() {
    if (!lastParams || !lastPageToken) return;
    runSearch({ ...lastParams, pageToken: lastPageToken });
  }

  function handleCancel() {
    cancelledRef.current = true;
    setProgressLabel("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search size={18} className="text-text-blue" /> Buscar Leads
          </h2>
          <button onClick={() => onOpenChange(false)} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(runSearch)} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-muted">Cidade</label>
            <input
              {...register("city")}
              className="w-full mt-1 rounded-md bg-table border border-border px-3 py-2 text-sm outline-none focus:border-text-blue"
              placeholder="Ex: Silvânia"
            />
            {errors.city && <p className="text-xs text-priority.high mt-1">{errors.city.message}</p>}
          </div>

          <div>
            <label className="text-sm text-muted">Estado</label>
            <input
              {...register("state")}
              className="w-full mt-1 rounded-md bg-table border border-border px-3 py-2 text-sm outline-none focus:border-text-blue"
              placeholder="Ex: GO"
            />
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
          </div>

          <div>
            <label className="text-sm text-muted">Nicho</label>
            <input
              {...register("niche")}
              className="w-full mt-1 rounded-md bg-table border border-border px-3 py-2 text-sm outline-none focus:border-text-blue"
              placeholder="Ex: clínicas odontológicas"
            />
            {errors.niche && <p className="text-xs text-red-500 mt-1">{errors.niche.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted">Raio (km)</label>
              <input
                type="number"
                {...register("radiusKm", { valueAsNumber: true })}
                className="w-full mt-1 rounded-md bg-table border border-border px-3 py-2 text-sm outline-none focus:border-text-blue"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Quantidade</label>
              <input
                type="number"
                {...register("quantity", { valueAsNumber: true })}
                className="w-full mt-1 rounded-md bg-table border border-border px-3 py-2 text-sm outline-none focus:border-text-blue"
              />
            </div>
          </div>

          {progressLabel && (
            <div className="flex items-center gap-2 text-sm text-text-blue">
              <Loader2 size={14} className="animate-spin" /> {progressLabel}
              <button type="button" onClick={handleCancel} className="ml-auto text-xs text-muted hover:text-foreground">
                Cancelar
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full rounded-md bg-status-progress bg-[#3B82F6] py-2 text-sm font-medium hover:brightness-110 disabled:opacity-50"
          >
            {isPending ? "Buscando..." : "Buscar"}
          </button>

          {lastPageToken && !isPending && (
            <button
              type="button"
              onClick={handleLoadMore}
              className="w-full rounded-md border border-border py-2 text-sm text-text-blue hover:bg-table"
            >
              Carregar mais leads
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
