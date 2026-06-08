import "server-only";

import { createClient } from "@/lib/supabase/server";

export class UserAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "UserAuthError";
  }
}

/** Vérifie qu'un utilisateur (non admin requis) est connecté. */
export async function requireUserSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new UserAuthError("Connexion requise.", 401);
  }

  return { supabase, user: data.user };
}
