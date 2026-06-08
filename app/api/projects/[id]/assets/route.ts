import { NextResponse } from "next/server";
import { requireUserSession, UserAuthError } from "@/lib/api/require-user";
import { getProjectForUser, insertProjectAsset } from "@/lib/projects";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await requireUserSession();
    const project = await getProjectForUser(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const body = (await request.json()) as {
      filePath?: string;
      label?: string;
    };

    if (!body.filePath?.trim()) {
      return NextResponse.json({ error: "Chemin du fichier requis." }, { status: 400 });
    }

    const asset = await insertProjectAsset(
      id,
      body.filePath.trim(),
      body.label?.trim(),
    );

    return NextResponse.json({ asset });
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
