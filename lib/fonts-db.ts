import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSecretKeyConfigured } from "@/lib/env";
import type { FontDefinition } from "@/lib/fonts";

export async function fetchFontsFromDb(): Promise<FontDefinition[]> {
  if (!isSecretKeyConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("fonts")
    .select("id, name, regular_url, bold_url")
    .order("name");

  if (error || !data) return [];
  return data as FontDefinition[];
}
