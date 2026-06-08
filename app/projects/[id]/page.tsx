import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectForUser } from "@/lib/projects";
import { listActiveTemplates } from "@/lib/templates";
import { isSupabaseConfigured } from "@/lib/env";
import { TemplateCard } from "@/components/TemplateCard";
import { TEMPLATE_TYPES, TEMPLATE_TYPE_LABELS, type TemplateType } from "@/lib/types";
import { redirect, notFound } from "next/navigation";

function isTemplateType(value: string | undefined): value is TemplateType {
  return TEMPLATE_TYPES.includes(value as TemplateType);
}

export default async function ProjectVisualsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const project = await getProjectForUser(id, user.id);
  if (!project) notFound();

  const activeType = isTemplateType(type) ? type : undefined;
  const configured = isSupabaseConfigured();
  const templates = configured ? await listActiveTemplates(activeType) : [];

  const base = `/projects/${id}`;

  return (
    <div>
      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterPill href={base} label="Tous" active={!activeType} />
        {TEMPLATE_TYPES.map((t) => (
          <FilterPill
            key={t}
            href={`${base}?type=${t}`}
            label={TEMPLATE_TYPE_LABELS[t]}
            active={activeType === t}
          />
        ))}
      </div>

      {!configured ? (
        <div className="rounded-lg border border-border bg-surface p-8">
          <p className="text-sm text-muted">Supabase non configuré.</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted">Aucun template disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} backHref={base} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors border",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface text-muted border-input hover:border-primary/40 hover:text-foreground hover:bg-accent",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
