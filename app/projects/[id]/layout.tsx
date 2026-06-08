import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ActiveProjectSync } from "@/components/projects/ActiveProjectSync";
import { ProjectNav } from "@/components/projects/ProjectNav";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectForUser } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const project = await getProjectForUser(id, user.id);
  if (!project) notFound();

  return (
    <>
      <ActiveProjectSync projectId={id} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12">
        <div className="mb-6 border-b border-border pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
            Projet
          </p>
          <h1 className="mt-2 text-[32px] font-normal leading-tight tracking-[-0.96px] text-foreground">
            {project.name}
          </h1>
        </div>
        <ProjectNav projectId={id} />
        <div className="mt-8">{children}</div>
      </main>
    </>
  );
}
