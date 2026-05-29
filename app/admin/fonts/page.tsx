import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FontsManager } from "@/components/admin/FontsManager";

export const dynamic = "force-dynamic";

export default function AdminFontsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Polices</h1>
          <p className="mt-1 text-sm text-muted">
            Uploadez des fichiers .woff2 ou .ttf. Elles apparaîtront dans les
            sélecteurs de l&apos;éditeur et du builder.
          </p>
        </div>
        <FontsManager />
      </main>
    </>
  );
}
