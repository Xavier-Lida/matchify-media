import Link from "next/link";
import { TemplateCard } from "@/components/TemplateCard";
import { listActiveTemplates } from "@/lib/templates";
import { isSupabaseConfigured } from "@/lib/env";
import {
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type TemplateType,
} from "@/lib/types";

function isTemplateType(value: string | undefined): value is TemplateType {
  return TEMPLATE_TYPES.includes(value as TemplateType);
}

export async function TemplatesCatalog({
  activeType,
}: {
  activeType?: TemplateType;
}) {
  const configured = isSupabaseConfigured();
  const templates = configured ? await listActiveTemplates(activeType) : [];

  if (!configured) {
    return <SetupNotice />;
  }

  return (
    <>
      <TypeFilter active={activeType} />
      {templates.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted">Aucun template disponible pour le moment.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 pb-24">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </>
  );
}

function TypeFilter({ active }: { active?: TemplateType }) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterPill href="/templates" label="Tous" active={!active} />
      {TEMPLATE_TYPES.map((t) => (
        <FilterPill
          key={t}
          href={`/templates?type=${t}`}
          label={TEMPLATE_TYPE_LABELS[t]}
          active={active === t}
        />
      ))}
    </div>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
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

function SetupNotice() {
  return (
    <div className="mt-6 rounded-lg border border-border bg-surface p-8">
      <h2 className="text-[20px] font-medium text-foreground">
        Configuration requise
      </h2>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        Supabase n&apos;est pas encore configuré. Renseignez les variables
        d&apos;environnement (voir{" "}
        <code className="font-mono text-xs bg-surface-2 px-1 py-0.5 rounded">
          .env.example
        </code>
        ) puis exécutez le schéma{" "}
        <code className="font-mono text-xs bg-surface-2 px-1 py-0.5 rounded">
          supabase/schema.sql
        </code>
        .
      </p>
    </div>
  );
}
