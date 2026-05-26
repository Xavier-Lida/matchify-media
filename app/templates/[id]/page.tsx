import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import { getTemplate } from "@/lib/templates/registry";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TemplatePage({ params }: PageProps) {
  const { id } = await params;
  const entry = getTemplate(id);

  if (!entry) {
    notFound();
  }

  const { Editor } = entry;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "mb-6 -ml-2 inline-flex",
          )}
        >
          ← Retour aux templates
        </Link>
        <Editor />
      </main>
    </>
  );
}
