import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { PhosphorIcon } from "@/components/ui/PhosphorIcon";
import { getSessionUser } from "@/lib/auth/session";
import { listProjectsForUser } from "@/lib/projects";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const projects = await listProjectsForUser(user.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12">

        {/* Page header */}
        <div className="border-b border-border pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
            Matchify Media
          </p>
          <h1 className="mt-3 text-[32px] font-normal leading-tight tracking-[-0.96px] text-foreground">
            Mes projets
          </h1>
        </div>

        {/* Create project */}
        <div className="mt-8">
          <h2 className="text-[15px] font-medium text-foreground mb-3">
            Nouveau projet
          </h2>
          <div className="rounded-lg border border-border bg-surface p-6">
            <CreateProjectForm />
          </div>
        </div>

        {/* Project list */}
        {projects.length === 0 ? (
          <div className="mt-8 rounded-lg border border-border bg-surface p-10 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PhosphorIcon name="folder-simple" className="size-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">Aucun projet pour le moment</p>
            <p className="mt-1 text-xs text-muted">Créez votre premier projet ci-dessus.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <PhosphorIcon name="folder-simple" className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-medium text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted">
                      Créé le {new Date(p.created_at).toLocaleDateString("fr-CA")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

      </main>
    </>
  );
}
