"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { PhosphorIcon } from "@/components/ui/PhosphorIcon";
import { useUnsavedChanges } from "./UnsavedChangesContext";
import type { PhosphorIconName } from "@/lib/phosphor-icon";

const NAV_ITEMS: { suffix: string; label: string; icon: PhosphorIconName }[] = [
  { suffix: "", label: "Visuels", icon: "squares-four" },
  { suffix: "/integrations", label: "Connexion ligue", icon: "plugs" },
  { suffix: "/data", label: "Données ligue", icon: "database" },
  { suffix: "/photos", label: "Banque photos", icon: "images" },
];

export function ProjectSidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDirty, setDirty } = useUnsavedChanges();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const base = `/projects/${projectId}`;

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (isDirty && pathname !== href) {
      e.preventDefault();
      setPendingHref(href);
    }
  };

  const confirmLeave = () => {
    if (!pendingHref) return;
    setDirty(false);
    router.push(pendingHref);
    setPendingHref(null);
  };

  const cancelLeave = () => {
    setPendingHref(null);
  };

  return (
    <>
      <aside className="group fixed left-0 top-16 z-30 flex h-[calc(100svh-4rem)] w-12 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-linear hover:w-52 overflow-hidden">
        <nav className="flex flex-col gap-1 p-2 pt-3">
          {NAV_ITEMS.map((item) => {
            const href = `${base}${item.suffix}`;
            const isActive =
              item.suffix === "" ? pathname === base : pathname.startsWith(`${base}${item.suffix}`);

            return (
              <Link
                key={item.suffix}
                href={href}
                title={item.label}
                onClick={(e) => handleNavClick(e, href)}
                className={[
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  "min-w-0 whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-accent hover:text-foreground",
                ].join(" ")}
              >
                <PhosphorIcon name={item.icon} className="size-[18px] shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {pendingHref && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Modifications non enregistrées
              </h2>
              <p className="text-sm text-muted">
                Vous avez des modifications non enregistrées. Voulez-vous quitter sans enregistrer ?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelLeave}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Quitter sans enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
