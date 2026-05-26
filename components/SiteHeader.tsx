import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Matchify
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
            Templates
          </Link>
          <Link
            href="/branding"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Ma ligue
          </Link>
        </nav>
      </div>
    </header>
  );
}
