/** crossOrigin only for truly cross-origin URLs (avoids breaking /public assets). */
export function imageCrossOrigin(src: string): "anonymous" | undefined {
  if (src.startsWith("data:")) {
    return undefined;
  }
  try {
    const url = new URL(src, window.location.origin);
    return url.origin !== window.location.origin ? "anonymous" : undefined;
  } catch {
    return undefined;
  }
}

type ImageSnapshot = {
  img: HTMLImageElement;
  src: string;
  crossOrigin: string | null;
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fetchImageAsDataUrl(src: string): Promise<string> {
  const url = new URL(src, window.location.href).href;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return blobToDataUrl(await response.blob());
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

/** Embeds images as data URLs; returns a restore function for the live DOM. */
export async function inlineImagesInNode(
  root: HTMLElement,
): Promise<() => void> {
  const images = Array.from(root.querySelectorAll("img"));
  const snapshots: ImageSnapshot[] = [];

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) {
        return;
      }

      snapshots.push({
        img,
        src,
        crossOrigin: img.getAttribute("crossorigin"),
      });

      img.removeAttribute("crossorigin");
      const dataUrl = await fetchImageAsDataUrl(src);
      img.setAttribute("src", dataUrl);
      await waitForImage(img);
    }),
  );

  return () => {
    for (const { img, src, crossOrigin } of snapshots) {
      img.setAttribute("src", src);
      if (crossOrigin) {
        img.setAttribute("crossorigin", crossOrigin);
      } else {
        img.removeAttribute("crossorigin");
      }
    }
  };
}
