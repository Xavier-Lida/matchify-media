import { chromium, type Browser } from "playwright";

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/constants";

const globalForBrowser = globalThis as typeof globalThis & {
  __matchifyBrowser?: Browser;
};

async function getBrowser(): Promise<Browser> {
  if (globalForBrowser.__matchifyBrowser?.isConnected()) {
    return globalForBrowser.__matchifyBrowser;
  }

  const browser = await chromium.launch({
    headless: true,
  });
  globalForBrowser.__matchifyBrowser = browser;
  return browser;
}

function getRenderBaseUrl(): string {
  if (process.env.RENDER_BASE_URL) {
    return process.env.RENDER_BASE_URL;
  }
  const port = process.env.PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}

export async function captureFulltime(renderId: string): Promise<Buffer> {
  const baseUrl = getRenderBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}/render/fulltime/${renderId}`;
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForSelector('[data-layer="frame"]', {
      state: "attached",
      timeout: 20_000,
    });
    await page.waitForFunction(
      () => document.documentElement.dataset.renderReady === "true",
      { timeout: 25_000 },
    );

    const frame = page.locator('[data-layer="frame"]');
    await frame.waitFor({ state: "visible", timeout: 10_000 });

    const screenshot = await frame.screenshot({
      type: "png",
      animations: "disabled",
    });

    return Buffer.from(screenshot);
  } finally {
    await page.close();
  }
}

export async function closeRenderBrowser(): Promise<void> {
  if (globalForBrowser.__matchifyBrowser) {
    await globalForBrowser.__matchifyBrowser.close();
    globalForBrowser.__matchifyBrowser = undefined;
  }
}
