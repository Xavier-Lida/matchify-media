import { NextResponse } from "next/server";

import { verifyApiKey } from "@/lib/api/auth";
import { fullTimeRenderRequestSchema } from "@/lib/api/schemas/fulltime";
import { captureFulltime } from "@/lib/render/capture-fulltime";
import {
  deleteRenderPayload,
  setRenderPayload,
} from "@/lib/render/payload-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const authError = verifyApiKey(request);
  if (authError) {
    return authError;
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body too large (max 5 MB)." },
      { status: 413 },
    );
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body too large (max 5 MB)." },
        { status: 413 },
      );
    }
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = fullTimeRenderRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const renderId = crypto.randomUUID();
  setRenderPayload(renderId, parsed.data);

  try {
    const png = await captureFulltime(renderId);
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="matchify-fulltime.png"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Fulltime image capture failed:", error);
    return NextResponse.json(
      {
        error: "Image capture failed.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    deleteRenderPayload(renderId);
  }
}
