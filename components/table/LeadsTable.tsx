"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Star, MessageCircle, Instagram, MapPin, Mail, Copy, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Lead, LeadStatus, LeadPriority } from "@/types/lead";
import { LEAD_STATUS_LABELS, LEAD_PRIORITY_LABELS } from "@/types/lead";
import { updateLeadField, toggleFavorite, duplicateLead, deleteLead } from "@/actions/leads.actions";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<LeadStatus, string> = {
  nao_iniciado: "#94A3B8",
  contato_iniciado: "#3B82F6",
  em_negociacao: "#F97316",
  em_andamento: "#3B82F6",
  aguardando: "#EAB308",
  sem_resposta: "#EF4444",
  negou: "#EF4444",
  cliente: "#22C55E",
  pago: "#22C55E",
  finalizado: "#22C55E",
};

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  baixa: "#94A3B8",
  media: "#F97316",
  alta: "#EF4444",
  urgente: "#EF4444",
};

const columnHelper = createColumnHelper<Lead>();

function EditableCell({
  leadId,
  field,
  value,
}: {
  leadId: string;
  field: string;
  value: string | null;
}) {
  const [local, setLocal] = useState(value ?? "");

  async function handleBlur() {
    if (local === (value ?? "")) return;
    const result = await updateLeadField({ leadId, field, value: local || null });
    if (!result.success) toast.error(result.error ?? "Erro ao salvar");
  }

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      className="w-full bg-transparent text-sm outline-none focus:bg-table rounded px-1 py-0.5"
    />
  );
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("is_favorite", {
        header: "",
        size: 32,
        cell: ({ row }) => (
          <button
            onClick={async () => {
              const res = await toggleFavorite(row.original.id, !row.original.is_favorite);
              if (!res.success) toast.error(res.error);
            }}
          >
            <Star
              size={14}
              className={row.original.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted"}
            />
          </button>
        ),
      }),
      columnHelper.accessor("company_name", {
        header: "Empresa",
        cell: ({ row }) => <EditableCell leadId={row.original.id} field="company_name" value={row.original.company_name} />,
      }),
      columnHelper.accessor("owner_name", {
        header: "Proprietário",
        cell: ({ row }) => <EditableCell leadId={row.original.id} field="owner_name" value={row.original.owner_name} />,
      }),
      columnHelper.accessor("phone", {
        header: "Telefone",
        cell: ({ row }) => <EditableCell leadId={row.original.id} field="phone" value={row.original.phone} />,
      }),
      columnHelper.accessor("city", {
        header: "Cidade",
        cell: ({ row }) => <EditableCell leadId={row.original.id} field="city" value={row.original.city} />,
      }),
      columnHelper.accessor("category", { header: "Categoria" }),
      columnHelper.accessor("google_rating", { header: "Nota" }),
      columnHelper.accessor("score", {
        header: "Score",
        cell: ({ getValue }) => <span className="font-mono font-semibold">{getValue()}</span>,
      }),
      columnHelper.accessor("priority", {
        header: "Prioridade",
        cell: ({ row }) => (
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ backgroundColor: `${PRIORITY_COLORS[row.original.priority]}22`, color: PRIORITY_COLORS[row.original.priority] }}
          >
            {LEAD_PRIORITY_LABELS[row.original.priority]}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => (
          <select
            defaultValue={row.original.status}
            onChange={async (e) => {
              const res = await updateLeadField({ leadId: row.original.id, field: "status", value: e.target.value });
              if (!res.success) toast.error(res.error);
            }}
            className="text-xs bg-table border border-border rounded px-2 py-1"
            style={{ color: STATUS_COLORS[row.original.status] }}
          >
            {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        ),
      }),
      columnHelper.accessor("notes", {
        header: "Observações",
        cell: ({ row }) => <EditableCell leadId={row.original.id} field="notes" value={row.original.notes} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.whatsapp && (
              <a href={`https://wa.me/${row.original.whatsapp}`} target="_blank" rel="noreferrer">
                <MessageCircle size={14} className="text-status-client" />
              </a>
            )}
            {row.original.instagram && (
              <a href={row.original.instagram} target="_blank" rel="noreferrer">
                <Instagram size={14} className="text-pink-400" />
              </a>
            )}
            {row.original.google_maps_url && (
              <a href={row.original.google_maps_url} target="_blank" rel="noreferrer">
                <MapPin size={14} className="text-text-blue" />
              </a>
            )}
            {row.original.email && (
              <a href={`mailto:${row.original.email}`}>
                <Mail size={14} className="text-muted" />
              </a>
            )}
            <button onClick={() => duplicateLead(row.original.id)}>
              <Copy size={14} className="text-muted hover:text-foreground" />
            </button>
            <button
              onClick={async () => {
                if (confirm("Excluir este lead?")) await deleteLead(row.original.id);
              }}
            >
              <Trash2 size={14} className="text-red-500 hover:text-red-400" />
            </button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-table sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="text-left px-3 py-2.5 font-medium text-muted cursor-pointer select-none whitespace-nowrap"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-border/60 hover:bg-table/60 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-10 text-muted">
                Nenhum lead encontrado. Use "Buscar Leads" para começar a prospecção.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
