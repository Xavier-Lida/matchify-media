"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Returns a callback ref and the live CSS pixel width of the attached element.
 * Using a callback ref (instead of useRef + useEffect) ensures the ResizeObserver
 * is set up whenever the element actually mounts, even if it's conditionally rendered.
 */
export function useElementWidth(): [(el: HTMLDivElement | null) => void, number] {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [width, setWidth] = useState(0);

  const callbackRef = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el) {
      setWidth(0);
      return;
    }
    setWidth(el.offsetWidth);
    const obs = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    obs.observe(el);
    observerRef.current = obs;
  }, []);

  return [callbackRef, width];
}
