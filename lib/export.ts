import { toPng } from "html-to-image";

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/constants";
import { inlineImagesInNode } from "@/lib/export/image-utils";

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function downloadViaBlob(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  const objectUrl = URL.createObjectURL(dataUrlToBlob(dataUrl));
  link.href = objectUrl;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function resolveExportTarget(node: HTMLElement): HTMLElement {
  return (
    node.querySelector<HTMLElement>('[data-layer="frame"]') ?? node
  );
}

function readBackgroundColor(target: HTMLElement): string {
  return target.style.background || "#0A1426";
}

/** Removes CSS transforms on preview wrappers so capture is at full 1080×1350. */
function suspendAncestorTransforms(leaf: HTMLElement): () => void {
  const restores: Array<() => void> = [];
  let el: HTMLElement | null = leaf.parentElement;

  while (el) {
    const transform = el.style.transform;
    if (transform && transform !== "none") {
      restores.push(() => {
        el!.style.transform = transform;
      });
      el.style.transform = "none";
    }
    el = el.parentElement;
  }

  return () => {
    for (const restore of restores.reverse()) {
      restore();
    }
  };
}

function suspendImageFilters(root: HTMLElement): () => void {
  const snapshots: Array<{ img: HTMLImageElement; filter: string }> = [];

  root.querySelectorAll("img").forEach((img) => {
    const el = img as HTMLImageElement;
    if (el.style.filter) {
      snapshots.push({ img: el, filter: el.style.filter });
      el.style.filter = "none";
    }
  });

  return () => {
    for (const { img, filter } of snapshots) {
      img.style.filter = filter;
    }
  };
}

async function capturePng(target: HTMLElement): Promise<string> {
  return toPng(target, {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    pixelRatio: 1,
    cacheBust: false,
    includeQueryParams: false,
    skipAutoScale: true,
    backgroundColor: readBackgroundColor(target),
    style: {
      transform: "none",
      transformOrigin: "top left",
      margin: "0",
      width: `${CANVAS_WIDTH}px`,
      height: `${CANVAS_HEIGHT}px`,
    },
  });
}

export async function exportNode(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  try {
    await document.fonts.ready;
  } catch {
    // ignore
  }

  const target = resolveExportTarget(node);
  const restoreImages = await inlineImagesInNode(target);
  const restoreTransforms = suspendAncestorTransforms(target);
  const restoreFilters = suspendImageFilters(target);

  await waitForPaint();

  try {
    const dataUrl = await capturePng(target);

    try {
      downloadViaBlob(dataUrl, filename);
    } catch {
      downloadDataUrl(dataUrl, filename);
    }
  } finally {
    restoreFilters();
    restoreTransforms();
    restoreImages();
  }
}
