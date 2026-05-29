import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplateCreator } from "@/components/admin/TemplateCreator";

export default function NewTemplatePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-6">
          <Link
            href="/admin/templates"
            className="text-sm text-muted hover:text-foreground"
          >
            ← Templates
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Créer un template
          </h1>
        </div>
        <TemplateCreator />
      </main>
    </>
  );
}
