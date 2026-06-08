"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENTS = [
  { suffix: "", label: "Aperçu" },
  { suffix: "/integrations", label: "Connexion ligue" },
  { suffix: "/data", label: "Données ligue" },
  { suffix: "/history", label: "Historique" },
  { suffix: "/photos", label: "Banque photos" },
] as const;

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {SEGMENTS.map((link) => {
        const href = `${base}${link.suffix}`;
        const active =
          link.suffix === ""
            ? pathname === base
            : pathname.startsWith(`${base}${link.suffix}`);

        return (
          <Link
            key={link.suffix}
            href={href}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors border",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface text-muted border-input hover:border-primary/40 hover:text-foreground hover:bg-accent",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
