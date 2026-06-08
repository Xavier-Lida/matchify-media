import "server-only";

import {
  createCanvas,
  loadImage,
  type SKRSContext2D,
  type Image,
} from "@napi-rs/canvas";
import {
  buildLayeredRenderPlan,
  computeCoverCrop,
  computeContainFit,
  toFontString,
  type ImageInstruction,
  type LayeredRenderPlan,
  type RenderInstruction,
  type ShapeInstruction,
  type TextInstruction,
} from "@/lib/canvas";
import { fetchFontsFromDb } from "@/lib/fonts-db";
import { ensureFontsRegistered } from "@/lib/fonts-server";
import type { FieldValues, JsonConfig, TextAlign } from "@/lib/types";

const ALIGN_TO_CANVAS: Record<TextAlign, CanvasTextAlign> = {
  left: "left",
  center: "center",
  right: "right",
};

async function tryLoadImage(src: string): Promise<Image | null> {
  try {
    return await loadImage(src, { maxRedirects: 3 });
  } catch {
    return null;
  }
}

function drawText(ctx: SKRSContext2D, ins: TextInstruction): void {
  ctx.save();
  ctx.font = toFontString(ins.fontSize, ins.fontFamily, ins.bold);
  ctx.fillStyle = ins.color;
  ctx.textAlign = ALIGN_TO_CANVAS[ins.align];
  ctx.textBaseline = "top";
  ctx.fillText(ins.text, ins.x, ins.y, ins.maxWidth);
  ctx.restore();
}

function drawShape(ctx: SKRSContext2D, ins: ShapeInstruction): void {
  ctx.save();
  ctx.globalAlpha = ins.opacity;
  ctx.fillStyle = ins.fill;
  ctx.fillRect(ins.x, ins.y, ins.width, ins.height);
  ctx.restore();
}

async function drawImageInstruction(
  ctx: SKRSContext2D,
  ins: ImageInstruction,
): Promise<void> {
  const img = await tryLoadImage(ins.src);
  if (!img) {
    ctx.save();
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(ins.x, ins.y, ins.width, ins.height);
    ctx.restore();
    return;
  }
  if (ins.fit === "contain") {
    const { dx, dy, dWidth, dHeight } = computeContainFit(
      img.width,
      img.height,
      ins.width,
      ins.height,
    );
    ctx.drawImage(img, ins.x + dx, ins.y + dy, dWidth, dHeight);
  } else {
    const { sx, sy, sWidth, sHeight } = computeCoverCrop(
      img.width,
      img.height,
      ins.width,
      ins.height,
    );
    ctx.drawImage(img, sx, sy, sWidth, sHeight, ins.x, ins.y, ins.width, ins.height);
  }
}

const EXECUTORS: {
  [K in RenderInstruction["kind"]]: (
    ctx: SKRSContext2D,
    ins: Extract<RenderInstruction, { kind: K }>,
  ) => void | Promise<void>;
} = {
  text: drawText,
  image: drawImageInstruction,
  shape: drawShape,
};

async function drawInstructions(
  ctx: SKRSContext2D,
  instructions: RenderInstruction[],
): Promise<void> {
  for (const ins of instructions) {
    const execute = EXECUTORS[ins.kind] as (
      ctx: SKRSContext2D,
      ins: RenderInstruction,
    ) => void | Promise<void>;
    await execute(ctx, ins);
  }
}

async function drawLayeredPlan(
  ctx: SKRSContext2D,
  plan: LayeredRenderPlan,
  pngUrl: string,
  canvasWidth: number,
  canvasHeight: number,
): Promise<void> {
  await drawInstructions(ctx, plan.background);

  const design = await tryLoadImage(pngUrl);
  if (design) {
    ctx.drawImage(design, 0, 0, canvasWidth, canvasHeight);
  }

  await drawInstructions(ctx, plan.content);
  await drawInstructions(ctx, plan.foreground);
}

export interface RenderOptions {
  config: JsonConfig;
  pngUrl: string;
  values: FieldValues;
  format?: "png" | "jpeg";
  quality?: number;
}

/**
 * Rendu serveur : images background → png_url → content → foreground.
 */
export async function renderTemplateToBuffer({
  config,
  pngUrl,
  values,
  format = "png",
  quality = 0.92,
}: RenderOptions): Promise<Buffer> {
  const fonts = await fetchFontsFromDb();
  await ensureFontsRegistered(fonts);

  const canvas = createCanvas(config.canvasWidth, config.canvasHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

  const plan = buildLayeredRenderPlan(config, values);
  await drawLayeredPlan(
    ctx,
    plan,
    pngUrl,
    config.canvasWidth,
    config.canvasHeight,
  );

  if (format === "jpeg") {
    return canvas.encode("jpeg", Math.round(quality * 100));
  }
  return canvas.encode("png");
}
