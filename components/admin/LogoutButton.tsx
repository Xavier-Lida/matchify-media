"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-md border border-input bg-surface px-3 py-1.5 text-sm text-foreground hover:border-primary/40 hover:bg-accent transition-colors"
    >
      Se déconnecter
    </button>
  );
}
