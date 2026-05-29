/**
 * Variables d'environnement Supabase (clés récentes + rétrocompatibilité legacy).
 *
 * Clés actuelles (recommandées) :
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…)
 * - SUPABASE_SECRET_KEY (sb_secret_…)
 *
 * Clés legacy (supportées jusqu'en 2026) :
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";

/** Clé publique pour createBrowserClient / createServerClient. */
export const SUPABASE_PUBLISHABLE_KEY = firstNonEmpty(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** @deprecated Utiliser SUPABASE_PUBLISHABLE_KEY — alias legacy. */
export const SUPABASE_ANON_KEY = SUPABASE_PUBLISHABLE_KEY;

/** Clé secrète serveur (bypass RLS) — jamais exposée au client. */
export const SUPABASE_SECRET_KEY = firstNonEmpty(
  process.env.SUPABASE_SECRET_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/** @deprecated Utiliser SUPABASE_SECRET_KEY — alias legacy. */
export const SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SECRET_KEY;

/** Email unique autorisé pour l'admin (spec). Vide = tout compte authentifié (dev). */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function isSecretKeyConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}

/** @deprecated Utiliser isSecretKeyConfigured */
export function isServiceRoleConfigured(): boolean {
  return isSecretKeyConfigured();
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!ADMIN_EMAIL) return true;
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
