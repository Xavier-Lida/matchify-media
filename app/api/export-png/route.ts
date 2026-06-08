import { existsSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";
import { requireUserSession, UserAuthError } from "@/lib/api/require-user";

export const runtime = "nodejs";
// Allow up to 60 s for the browser to render (Vercel Pro / self-hosted)
export const maxDuration = 60;

function resolveChromiumPath(): string {
  const expected = chromium.executablePath();
  if (existsSync(expected)) return expected;
  if (process.env.CHROMIUM_PATH && existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  throw new Error(
    `Chromium introuvable. Lance : npx playwright install chromium\nChemin attendu : ${expected}`,
  );
}

export async function POST(request: NextRequest) {
  try {
    await requireUserSession();
  } catch (err) {
    if (err instanceof UserAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  let body: { html?: string; width?: number; height?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { html, width, height } = body;
  if (!html || !width || !height) {
    return NextResponse.json(
      { error: "Paramètres manquants : html, width, height" },
      { status: 400 },
    );
  }

  let executablePath: string;
  try {
    executablePath = resolveChromiumPath();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chromium introuvable" },
      { status: 500 },
    );
  }

  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });

    // setContent waits for DOMContentLoaded; networkidle ensures fonts/images finish
    await page.setContent(html, { waitUntil: "networkidle", timeout: 30_000 });

    // Extra delay for CSS animations and web-component connectedCallbacks
    await page.waitForTimeout(300);

    const buffer = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height },
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await browser.close();
  }
}
