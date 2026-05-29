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
      className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm hover:border-accent"
    >
      Se déconnecter
    </button>
  );
}
