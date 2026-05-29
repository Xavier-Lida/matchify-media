import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Client Supabase pour Server Components, Server Actions et Route Handlers.
 * Le rafraîchissement de session et les en-têtes anti-cache sont gérés par
 * `lib/supabase/proxy.ts` (proxy racine).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        void headers; // appliqués dans lib/supabase/proxy.ts
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Server Component en lecture seule — le proxy écrit les cookies */
        }
      },
    },
  });
}
