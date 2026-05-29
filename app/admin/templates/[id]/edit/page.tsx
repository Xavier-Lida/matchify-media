import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplateForm } from "@/components/admin/TemplateForm";
import { getTemplateById } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-6">
          <Link
            href="/admin/templates"
            className="text-sm text-muted hover:text-foreground"
          >
            ← Templates
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Modifier — {template.nom}
          </h1>
        </div>
        <TemplateForm mode="edit" initial={template} />
      </main>
    </>
  );
}
