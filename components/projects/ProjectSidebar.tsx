"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhosphorIcon } from "@/components/ui/PhosphorIcon";
import type { PhosphorIconName } from "@/lib/phosphor-icon";

const NAV_ITEMS: { suffix: string; label: string; icon: PhosphorIconName }[] = [
  { suffix: "", label: "Visuels", icon: "squares-four" },
  { suffix: "/integrations", label: "Connexion ligue", icon: "plugs" },
  { suffix: "/data", label: "Données ligue", icon: "database" },
  { suffix: "/photos", label: "Banque photos", icon: "images" },
];

export function ProjectSidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
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
  );
}
