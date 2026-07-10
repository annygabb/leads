import "server-only";

export interface ScoreRule {
  key: string;
  points: number;
  active: boolean;
}

export interface ScoreableLeadFields {
  has_website: boolean;
  has_instagram: boolean;
  google_reviews_count: number;
  google_rating: number | null;
  photos_count: number;
  email: string | null;
  whatsapp: string | null;
  website: string | null;
  websiteLastUpdatedYear?: number | null; // heuristic input, optional
}

/**
 * Calcula o score de um lead a partir das regras configuráveis do usuário.
 * As regras (score_rules) podem ser alteradas na tela de Configurações;
 * este serviço nunca hardcoda os pontos, apenas as condições de disparo.
 */
export function calculateLeadScore(
  lead: ScoreableLeadFields,
  rules: ScoreRule[]
): number {
  const ruleMap = new Map(rules.filter((r) => r.active).map((r) => [r.key, r.points]));
  let score = 0;

  if (!lead.has_website) score += ruleMap.get("sem_site") ?? 0;
  if (!lead.has_instagram) score += ruleMap.get("sem_instagram") ?? 0;
  if (lead.google_reviews_count < 10) score += ruleMap.get("poucas_avaliacoes") ?? 0;
  if (lead.google_rating !== null && lead.google_rating < 4) {
    score += ruleMap.get("nota_baixa") ?? 0;
  }
  if (lead.photos_count === 0) score += ruleMap.get("sem_fotos") ?? 0;
  if (!lead.email) score += ruleMap.get("sem_email") ?? 0;
  if (!lead.whatsapp) score += ruleMap.get("sem_whatsapp") ?? 0;

  // Heurística simples de "site antigo": ausência de HTTPS ou ano detectado no rodapé antigo.
  // Pode ser refinada futuramente com um crawler dedicado.
  if (lead.website && lead.website.startsWith("http://")) {
    score += ruleMap.get("site_antigo") ?? 0;
  }

  return score;
}

export function scoreToPriority(score: number): "baixa" | "media" | "alta" | "urgente" {
  if (score >= 120) return "urgente";
  if (score >= 80) return "alta";
  if (score >= 40) return "media";
  return "baixa";
}
