import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectForUser } from "@/lib/projects";
import { redirect, notFound } from "next/navigation";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const project = await getProjectForUser(id, user.id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/templates"
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)] transition-colors"
        >
          Créer un visuel →
        </Link>
        <Link
          href={`/projects/${id}/integrations`}
          className="rounded-md border border-input bg-surface px-5 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-accent transition-colors"
        >
          Connexion ligue →
        </Link>
      </div>
    </div>
  );
}
