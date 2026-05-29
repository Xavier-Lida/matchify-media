import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSecretKeyConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  if (!isSecretKeyConfigured()) {
    return NextResponse.json(
      { error: "Stockage non configuré." },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Type non autorisé (PNG, JPEG, WebP)." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 5 Mo)." },
      { status: 400 },
    );
  }

  const ext = EXT_BY_TYPE[file.type] ?? "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("uploads").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}
