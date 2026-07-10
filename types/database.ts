// NOTE: This is a hand-written baseline. Once the project is linked to a real
// Supabase project, replace this file with the generated types:
//
//   npx supabase gen types typescript --linked > types/database.ts
//
import type { Lead, LeadStatus, LeadPriority } from "./lead";

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: Lead;
        Insert: Partial<Lead> & { company_name: string; user_id: string };
        Update: Partial<Lead>;
      };
      tags: {
        Row: { id: string; user_id: string; name: string; color: string; created_at: string };
        Insert: { user_id: string; name: string; color?: string };
        Update: { name?: string; color?: string };
      };
      lead_tags: {
        Row: { lead_id: string; tag_id: string; created_at: string };
        Insert: { lead_id: string; tag_id: string };
        Update: never;
      };
      lead_history: {
        Row: {
          id: string;
          lead_id: string;
          user_id: string;
          field_changed: string;
          old_value: string | null;
          new_value: string | null;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          user_id: string;
          field_changed: string;
          old_value?: string | null;
          new_value?: string | null;
        };
        Update: never;
      };
      niches: {
        Row: { id: string; user_id: string; name: string; created_at: string };
        Insert: { user_id: string; name: string };
        Update: { name?: string };
      };
      states: {
        Row: { id: string; user_id: string; name: string; uf: string; created_at: string };
        Insert: { user_id: string; name: string; uf: string };
        Update: { name?: string; uf?: string };
      };
      cities: {
        Row: { id: string; user_id: string; state_id: string | null; name: string; created_at: string };
        Insert: { user_id: string; state_id?: string | null; name: string };
        Update: { name?: string; state_id?: string | null };
      };
      score_rules: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          label: string;
          points: number;
          active: boolean;
          created_at: string;
        };
        Insert: { user_id: string; key: string; label: string; points: number; active?: boolean };
        Update: { label?: string; points?: number; active?: boolean };
      };
      search_jobs: {
        Row: {
          id: string;
          user_id: string;
          city: string;
          state: string;
          niche: string;
          radius_km: number;
          requested_count: number;
          next_page_token: string | null;
          total_found: number;
          total_new: number;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["search_jobs"]["Row"]> & {
          user_id: string;
          city: string;
          state: string;
          niche: string;
        };
        Update: Partial<Database["public"]["Tables"]["search_jobs"]["Row"]>;
      };
    };
    Enums: {
      lead_status: LeadStatus;
      lead_priority: LeadPriority;
    };
  };
}
