import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplateCard } from "@/components/TemplateCard";
import { listActiveTemplates } from "@/lib/templates";
import { isSupabaseConfigured } from "@/lib/env";
import {
  TEMPLATE_TYPES,
  TEMPLATE_TYPE_LABELS,
  type TemplateType,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function isTemplateType(value: string | undefined): value is TemplateType {
  return TEMPLATE_TYPES.includes(value as TemplateType);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const activeType = isTemplateType(type) ? type : undefined;
  const configured = isSupabaseConfigured();
  const templates = configured ? await listActiveTemplates(activeType) : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Templates de contenu futsal
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Choisissez un template, remplissez les champs et téléchargez votre
            image prête pour Instagram.
          </p>
        </div>

        {!configured ? (
          <SetupNotice />
        ) : (
          <>
            <TypeFilter active={activeType} />
            {templates.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
                Aucun template disponible pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {templates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

function TypeFilter({ active }: { active?: TemplateType }) {
  const base =
    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border";
  const inactive = "border-border bg-surface text-muted hover:text-foreground";
  const selected = "border-accent bg-accent text-accent-foreground";

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Link href="/" className={`${base} ${!active ? selected : inactive}`}>
        Tous
      </Link>
      {TEMPLATE_TYPES.map((t) => (
        <Link
          key={t}
          href={`/?type=${t}`}
          className={`${base} ${active === t ? selected : inactive}`}
        >
          {TEMPLATE_TYPE_LABELS[t]}
        </Link>
      ))}
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8">
      <h2 className="text-lg font-semibold">Configuration requise</h2>
      <p className="mt-2 text-muted">
        Supabase n&apos;est pas encore configuré. Renseignez les variables
        d&apos;environnement (voir <code>.env.example</code>) puis exécutez le
        schéma <code>supabase/schema.sql</code> dans votre projet Supabase.
      </p>
    </div>
  );
}
