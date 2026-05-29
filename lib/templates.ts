import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Template, TemplateType } from "@/lib/types";

/**
 * Accès aux templates côté serveur (Server Components + Route Handlers).
 * S'appuie sur la session/anon (RLS) — les lectures publiques ne renvoient
 * que les templates actifs.
 */

export async function listActiveTemplates(
  type?: TemplateType,
): Promise<Template[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  let query = supabase
    .from("templates")
    .select("*")
    .eq("actif", true)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Template[];
}

export async function getTemplateById(id: string): Promise<Template | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Template) ?? null;
}

/** Liste complète (actifs + inactifs) — réservé à l'admin authentifié. */
export async function listAllTemplates(): Promise<Template[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Template[];
}
