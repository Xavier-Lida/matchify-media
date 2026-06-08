import { NextResponse } from "next/server";
import { requireUserSession, UserAuthError } from "@/lib/api/require-user";
import { createProject } from "@/lib/projects";
import { setActiveProjectCookie } from "@/lib/auth/active-project";

export async function POST(request: Request) {
  try {
    const { user } = await requireUserSession();
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Nom requis." }, { status: 400 });
    }

    const project = await createProject(user.id, name);
    await setActiveProjectCookie(project.id);

    return NextResponse.json({ id: project.id });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
