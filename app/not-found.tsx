import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-5xl font-semibold text-primary">404</p>
          <h1 className="text-xl font-medium text-foreground">Page introuvable</h1>
          <p className="text-sm text-muted">
            Cette page n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors"
          >
            Aller au tableau de bord
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
