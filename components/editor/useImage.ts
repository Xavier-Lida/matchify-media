"use client";

import { useEffect, useState } from "react";

export type ImageStatus = "empty" | "loading" | "loaded" | "error";

export interface LoadedImage {
  image: HTMLImageElement | undefined;
  status: ImageStatus;
}

interface InternalState {
  src?: string;
  image?: HTMLImageElement;
  status: ImageStatus;
}

/**
 * Charge une image (URL distante, blob ou data URL) pour Konva.
 * `crossOrigin = anonymous` évite de « tainter » le canvas afin que l'export
 * PNG/JPG reste possible. En cas d'échec (CORS/404), `status` passe à "error"
 * et l'appelant affiche un placeholder.
 *
 * L'état transitoire (loading/empty) est dérivé pendant le rendu ; seuls les
 * callbacks asynchrones (load/error) appellent setState.
 */
export function useImage(src?: string): LoadedImage {
  const [state, setState] = useState<InternalState>({
    src,
    status: src ? "loading" : "empty",
  });

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    const image = new window.Image();
    if (!src.startsWith("blob:") && !src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => {
      if (!cancelled) setState({ src, image, status: "loaded" });
    };
    image.onerror = () => {
      if (!cancelled) setState({ src, image: undefined, status: "error" });
    };
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  // L'état committé concerne une autre source → on est en transition.
  if (state.src !== src) {
    return { image: undefined, status: src ? "loading" : "empty" };
  }
  return { image: state.image, status: state.status };
}
