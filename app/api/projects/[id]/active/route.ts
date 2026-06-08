import { NextResponse } from "next/server";
import { requireUserSession, UserAuthError } from "@/lib/api/require-user";
import { getProjectForUser } from "@/lib/projects";
import { setActiveProjectCookie } from "@/lib/auth/active-project";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await requireUserSession();
    const project = await getProjectForUser(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    await setActiveProjectCookie(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
