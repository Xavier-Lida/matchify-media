import { NextResponse } from "next/server";
import { requireUserSession, UserAuthError } from "@/lib/api/require-user";
import { getProjectForUser, recordPublication } from "@/lib/projects";
import { getActiveProjectId } from "@/lib/auth/active-project";

export async function POST(request: Request) {
  try {
    const { user } = await requireUserSession();
    const body = (await request.json()) as {
      projectId?: string;
      templateId?: string;
      format?: "png" | "jpeg" | "html";
      title?: string;
    };

    const projectId = body.projectId ?? (await getActiveProjectId());
    if (!projectId) {
      return NextResponse.json(
        { error: "Aucun projet actif." },
        { status: 400 },
      );
    }

    const project = await getProjectForUser(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const format = body.format ?? "png";
    await recordPublication({
      projectId,
      userId: user.id,
      templateId: body.templateId,
      format,
      title: body.title,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
