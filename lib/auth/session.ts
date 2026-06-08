import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/env";

export async function getSessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    isAdmin: isAdminEmail(user.email),
  };
}
