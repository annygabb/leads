# LeadHunter — CRM de Prospecção Comercial

SaaS para prospecção de leads via Google Places API, com scoring automático,
CRM completo e dashboard, voltado para agências de sites, tráfego pago e
marketing digital.

## Status deste pacote: **Fase 1 — Fundação** ✅

Este pacote entrega a arquitetura completa e as funcionalidades essenciais.
Não é o sistema inteiro (ver Roadmap abaixo), mas é uma base real,
executável e escalável — não um protótipo.

### O que já está implementado

- ✅ Estrutura Next.js 15 (App Router) + TypeScript + Tailwind + tema dark exato
- ✅ Schema completo do banco (`database/migrations/0001_init.sql`): leads,
  tags, histórico, nichos, estados, cidades, regras de score, search jobs,
  RLS por usuário, índices, triggers de `updated_at`
- ✅ `services/google-places.service.ts` — toda a integração isolada da UI
- ✅ `services/score.service.ts` — score automático com regras editáveis
- ✅ `actions/leads.actions.ts` — CRUD de leads com **auto-save por campo**
  (sem botão salvar) e log automático em `lead_history`
- ✅ `actions/search.actions.ts` — busca no Google Places, dedup por
  `google_place_id`, cálculo de score, salvamento automático, suporte a
  `next_page_token` para "Carregar mais"
- ✅ `actions/dashboard.actions.ts` — estatísticas agregadas
- ✅ Dashboard com cards (Total, Quentes, Mornos, Frios, Sem Site, Sem
  Instagram, Clientes, Ganhos) + listagens por status/cidade
- ✅ Modal "Buscar Leads" com loading, progresso, cancelar e carregar mais
- ✅ Tabela CRM (TanStack Table) com edição inline, favoritos, status,
  prioridade, ações rápidas (WhatsApp, Instagram, Maps, e-mail, duplicar, excluir)
- ✅ Validação com Zod em todas as entradas
- ✅ `.env.example` com todas as variáveis necessárias

## Setup

```bash
npm install
cp .env.example .env.local   # preencha as chaves do Supabase e Google Places
npx supabase db push          # roda a migration em database/migrations/0001_init.sql
npm run dev
```

Você precisa criar um projeto no [Supabase](https://supabase.com) e ativar
**Google Places API (New)** no [Google Cloud Console](https://console.cloud.google.com).

## Arquitetura

```
app/                    → rotas (App Router), sempre finas — chamam actions/
components/ui/          → primitivos (shadcn)
components/dashboard/   → cards, gráficos
components/table/       → tabela CRM
components/modals/      → busca, cadastro manual, confirmações
actions/                → Server Actions (única camada que fala com o Supabase)
services/                → integrações externas isoladas (Google Places, score)
lib/supabase/            → clients (browser/server/admin)
lib/validations/         → schemas Zod
types/                   → tipos centrais, espelham o schema do banco
database/migrations/     → SQL versionado
```

Regra seguida em todo o projeto: **páginas nunca chamam APIs externas
diretamente** — sempre passam por `services/` via uma Server Action.

## Roadmap — próximas fases

Ainda não incluídos neste pacote (ordem sugerida):

1. **Auth & Settings** — telas de login/signup com Supabase Auth,
   proteção de rotas via middleware, tela de configuração das regras de score
2. **Filtros avançados em tempo real** — barra de filtros completa
   (cidade, estado, categoria, status, prioridade, score, tem/não tem
   site/Instagram/e-mail/WhatsApp) já com a query pronta em `getLeads`
3. **CRUD de Nichos, Estados, Cidades e Etiquetas** — telas de gestão
4. **Sistema de tags** — UI para `lead_tags` (já modelado no banco)
5. **Histórico visual** — timeline usando `getLeadHistory` (já implementado)
6. **Exportação** — CSV, Excel (`xlsx`), PDF (`jspdf`), copiar tabela
7. **Importação** — CSV/Excel com upsert de leads existentes
8. **Gráficos com Recharts** — substituir as listas simples do dashboard
9. **Virtualização da tabela** (`@tanstack/react-virtual`) para grandes volumes
10. **Cadastro manual completo** (modal já referenciado, falta o formulário)
11. **Deploy na Vercel** — configuração final de variáveis de ambiente

Cada fase pode ser pedida separadamente e será construída sobre esta mesma
fundação, sem retrabalho.
