import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
            ⚽
          </span>
          <span>Futsal Content</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            Templates
          </Link>
          <Link
            href="/admin"
            className="rounded-md px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
