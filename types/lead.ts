export type LeadStatus =
  | "nao_iniciado"
  | "contato_iniciado"
  | "em_negociacao"
  | "em_andamento"
  | "aguardando"
  | "sem_resposta"
  | "negou"
  | "cliente"
  | "pago"
  | "finalizado";

export type LeadPriority = "baixa" | "media" | "alta" | "urgente";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nao_iniciado: "Não iniciado",
  contato_iniciado: "Contato iniciado",
  em_negociacao: "Em negociação",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  sem_resposta: "Sem resposta",
  negou: "Negou",
  cliente: "Cliente",
  pago: "Pago",
  finalizado: "Finalizado",
};

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

// Maps directly to the `leads` table
export interface Lead {
  id: string;
  user_id: string;

  google_place_id: string | null;
  company_name: string;
  owner_name: string | null;

  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  website: string | null;
  google_maps_url: string | null;

  city: string | null;
  state: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;

  category: string | null;
  google_rating: number | null;
  google_reviews_count: number;
  photos_count: number;
  has_website: boolean;
  has_instagram: boolean;
  has_facebook: boolean;

  score: number;
  priority: LeadPriority;
  status: LeadStatus;
  last_contact_at: string | null;
  next_contact_at: string | null;
  notes: string | null;
  is_favorite: boolean;

  created_at: string;
  updated_at: string;

  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface LeadHistoryEntry {
  id: string;
  lead_id: string;
  user_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface LeadFilters {
  search?: string;
  city?: string;
  state?: string;
  category?: string;
  status?: LeadStatus[];
  priority?: LeadPriority[];
  hasWebsite?: boolean;
  hasInstagram?: boolean;
  hasEmail?: boolean;
  hasWhatsapp?: boolean;
  minScore?: number;
  maxScore?: number;
  favoritesOnly?: boolean;
  tagIds?: string[];
  sortBy?: keyof Lead;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// Editable subset used by the CRM table's inline auto-save
export type LeadEditableField = keyof Pick<
  Lead,
  | "company_name"
  | "owner_name"
  | "phone"
  | "whatsapp"
  | "email"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "website"
  | "city"
  | "state"
  | "address"
  | "postal_code"
  | "category"
  | "priority"
  | "status"
  | "last_contact_at"
  | "next_contact_at"
  | "notes"
  | "is_favorite"
>;
