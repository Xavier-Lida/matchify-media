import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplateToBuffer } from "@/lib/canvas-server";
import { getMissingRequiredFields } from "@/lib/canvas";
import { isSecretKeyConfigured } from "@/lib/env";
import type { FieldValues, JsonConfig } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GenerateBody {
  template_id?: string;
  fields?: FieldValues;
}

function isAuthorized(request: NextRequest): boolean {
  const apiKey = process.env.MATCHIFY_API_KEY;
  if (!apiKey) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${apiKey}`;
}

export async function POST(request: NextRequest) {
  // 1. Authentification par clé API (Bearer)
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Clé API manquante ou invalide." },
      { status: 401 },
    );
  }

  if (!isSecretKeyConfigured()) {
    return NextResponse.json(
      { error: "Supabase (clé secrète) non configuré." },
      { status: 500 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const { template_id, fields = {} } = body;
  if (!template_id) {
    return NextResponse.json(
      { error: "Identifiant du template requis." },
      { status: 400 },
    );
  }

  // 2. Récupération du template
  const supabase = createAdminClient();
  const { data: template, error } = await supabase
    .from("templates")
    .select("nom, png_url, json_config, actif")
    .eq("id", template_id)
    .maybeSingle();

  // 3. 404 si introuvable ou inactif
  if (error || !template || !template.actif) {
    return NextResponse.json(
      { error: "Template non trouvé ou inactif." },
      { status: 404 },
    );
  }

  const config = template.json_config as JsonConfig;

  // 4. Validation des champs requis → 422
  const missing = getMissingRequiredFields(config, fields);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Champs requis manquants.", missing },
      { status: 422 },
    );
  }

  // 5. Rendu serveur
  try {
    const buffer = await renderTemplateToBuffer({
      config,
      pngUrl: template.png_url,
      values: fields,
      format: "png",
    });

    const slug =
      String(template.nom)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "image";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${slug}-${Date.now()}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur de rendu." },
      { status: 500 },
    );
  }
}
