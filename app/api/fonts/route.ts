import { NextResponse } from "next/server";
import { fetchFontsFromDb } from "@/lib/fonts-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const fonts = await fetchFontsFromDb();
    return NextResponse.json({ fonts });
  } catch {
    return NextResponse.json({ fonts: [] });
  }
}
