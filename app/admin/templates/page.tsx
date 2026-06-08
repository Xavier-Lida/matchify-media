import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplatesManager } from "@/components/admin/TemplatesManager";
import { listAllTemplates } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const templates = await listAllTemplates();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-muted hover:text-foreground"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Templates</h1>
          </div>
          <Link
            href="/admin/templates/new"
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors"
          >
            + Nouveau
          </Link>
        </div>
        <TemplatesManager templates={templates} />
      </main>
    </>
  );
}
