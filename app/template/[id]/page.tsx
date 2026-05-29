import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplateEditor } from "@/components/editor/TemplateEditor";
import { getTemplateById } from "@/lib/templates";
import { TEMPLATE_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-muted hover:text-foreground">
            ← Retour aux templates
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{template.nom}</h1>
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted">
              {TEMPLATE_TYPE_LABELS[template.type]}
            </span>
          </div>
        </div>
        <TemplateEditor template={template} />
      </main>
    </>
  );
}
