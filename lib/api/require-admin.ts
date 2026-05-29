import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";

export class AdminAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

/** Vérifie la session admin (getClaims + ADMIN_EMAIL). */
export async function requireAdminSession() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims?.sub) {
    throw new AdminAuthError("Non authentifié.", 401);
  }

  const email =
    typeof claimsData.claims.email === "string"
      ? claimsData.claims.email
      : undefined;

  if (!isAdminEmail(email)) {
    throw new AdminAuthError("Accès admin refusé.", 403);
  }

  return { supabase, email: email! };
}
