"use client";

import type { FontDefinition } from "@/lib/fonts";

const loaded = new Set<string>();

/**
 * Charge les polices custom dans document.fonts pour Konva / canvas 2D.
 */
export async function loadFontFaces(fonts: FontDefinition[]): Promise<void> {
  const tasks: Promise<void>[] = [];

  for (const font of fonts) {
    const regularKey = `${font.name}::regular::${font.regular_url}`;
    if (!loaded.has(regularKey)) {
      tasks.push(
        (async () => {
          const face = new FontFace(font.name, `url(${font.regular_url})`, {
            weight: "400",
          });
          await face.load();
          document.fonts.add(face);
          loaded.add(regularKey);
        })(),
      );
    }

    if (font.bold_url && font.bold_url !== font.regular_url) {
      const boldKey = `${font.name}::bold::${font.bold_url}`;
      if (!loaded.has(boldKey)) {
        tasks.push(
          (async () => {
            const face = new FontFace(font.name, `url(${font.bold_url})`, {
              weight: "700",
            });
            await face.load();
            document.fonts.add(face);
            loaded.add(boldKey);
          })(),
        );
      }
    }
  }

  await Promise.allSettled(tasks);
}
