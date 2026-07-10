import { z } from "zod";

export const leadStatusEnum = z.enum([
  "nao_iniciado",
  "contato_iniciado",
  "em_negociacao",
  "em_andamento",
  "aguardando",
  "sem_resposta",
  "negou",
  "cliente",
  "pago",
  "finalizado",
]);

export const leadPriorityEnum = z.enum(["baixa", "media", "alta", "urgente"]);

export const updateLeadFieldSchema = z.object({
  leadId: z.string().uuid(),
  field: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

export const createLeadManualSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa é obrigatório"),
  owner_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")).nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  website: z.string().url("URL inválida").optional().or(z.literal("")).nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  priority: leadPriorityEnum.default("baixa"),
  status: leadStatusEnum.default("nao_iniciado"),
  notes: z.string().optional().nullable(),
});

export const searchLeadsSchema = z.object({
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  niche: z.string().min(2, "Nicho é obrigatório"),
  radiusKm: z.number().min(1).max(100).default(10),
  quantity: z.number().min(1).max(60).default(20),
  pageToken: z.string().optional(),
});

export type CreateLeadManualInput = z.infer<typeof createLeadManualSchema>;
export type SearchLeadsInput = z.infer<typeof searchLeadsSchema>;
