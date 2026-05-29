import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SECRET_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Client à privilèges élevés (secret / service_role) — serveur uniquement.
 * Utilisé par POST /api/generate. Ne jamais importer dans un composant client.
 */
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
