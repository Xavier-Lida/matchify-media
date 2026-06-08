import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplateEditor } from "@/components/editor/TemplateEditor";
import { getActiveProjectId } from "@/lib/auth/active-project";
import { getSessionUser } from "@/lib/auth/session";
import {
  getLeagueData,
  getProjectForUser,
  listProjectAssets,
} from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/templates";
import { TEMPLATE_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id } = await params;
  const { back } = await searchParams;
  const backHref = back && back.startsWith("/") ? back : "/templates";
  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  const user = await getSessionUser();
  const activeProjectId = await getActiveProjectId();

  let leagueData: Record<string, unknown> | undefined;
  let assets: { id: string; label: string | null; url: string }[] = [];

  if (user && activeProjectId) {
    const project = await getProjectForUser(activeProjectId, user.id);
    if (project) {
      const [row, rawAssets] = await Promise.all([
        getLeagueData(activeProjectId),
        listProjectAssets(activeProjectId),
      ]);

      leagueData = row?.data;

      if (rawAssets.length > 0) {
        const supabase = await createClient();
        assets = rawAssets.map((a) => ({
          id: a.id,
          label: a.label,
          url: supabase.storage
            .from("project-photos")
            .getPublicUrl(a.file_path).data.publicUrl,
        }));
      }
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12">
        <div className="mb-8">
          <Link
            href={backHref}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Retour
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-inter-tight)] text-[32px] font-medium leading-[1.2] text-foreground">
              {template.nom}
            </h1>
            <span className="rounded-full border border-border bg-surface px-3 py-0.5 text-xs text-muted">
              {TEMPLATE_TYPE_LABELS[template.type]}
            </span>
          </div>
        </div>
        <TemplateEditor
          template={template}
          leagueData={leagueData}
          assets={assets}
          projectId={activeProjectId ?? undefined}
        />
      </main>
    </>
  );
}
