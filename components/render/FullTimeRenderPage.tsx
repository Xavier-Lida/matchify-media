"use client";

import { useEffect } from "react";

import { FullTimeVisual } from "@/components/templates/FullTimeVisual";
import type { FullTimeRenderPayload } from "@/lib/render/types";

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  ).then(() => undefined);
}

export function FullTimeRenderPage({ payload }: { payload: FullTimeRenderPayload }) {
  useEffect(() => {
    let cancelled = false;

    async function markReady() {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise<void>((resolve) => setTimeout(resolve, 8000)),
        ]);
      } catch {
        // ignore
      }

      const frame = document.querySelector('[data-layer="frame"]');
      if (frame) {
        await waitForImages(frame as HTMLElement);
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      if (!cancelled) {
        document.documentElement.dataset.renderReady = "true";
      }
    }

    void markReady();

    return () => {
      cancelled = true;
      delete document.documentElement.dataset.renderReady;
    };
  }, [payload]);

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#000",
      }}
    >
      <FullTimeVisual data={payload.data} branding={payload.branding} />
    </div>
  );
}
