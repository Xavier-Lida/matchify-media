import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminSession } from "@/lib/api/require-admin";
import { renderTemplateToBuffer } from "@/lib/canvas-server";
import { hasSampleValues } from "@/lib/canvas";
import type { JsonConfig } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PreviewBody {
  png_url: string;
  json_config: JsonConfig;
  storage_key?: string;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdminSession();
    const body = (await request.json()) as PreviewBody;

    const { png_url = "", json_config, storage_key } = body;
    if (!json_config?.fields) {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }

    const sampleValues = json_config.sampleValues ?? {};
    const buffer = await renderTemplateToBuffer({
      config: json_config,
      pngUrl: png_url,
      values: hasSampleValues(sampleValues) ? sampleValues : {},
      format: "png",
    });

    const key =
      storage_key ??
      `preview-${slugify(json_config.fields[0]?.key ?? "template")}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("previews")
      .upload(key, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 },
      );
    }

    const preview_url = supabase.storage.from("previews").getPublicUrl(key)
      .data.publicUrl;

    return NextResponse.json({ preview_url, storage_key: key });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Erreur de génération de l'aperçu." },
      { status: 500 },
    );
  }
}
