"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 5;

export function screenToCanvas(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  scale: number,
): { x: number; y: number } {
  return {
    x: Math.round((clientX - rect.left) / scale),
    y: Math.round((clientY - rect.top) / scale),
  };
}

export interface UseFieldDragOptions {
  scale: number;
  getCanvasRect: () => DOMRect | null;
  onDragEnd: (x: number, y: number) => void;
  onClick: () => void;
}

/**
 * Gère pointer drag avec seuil pour distinguer clic vs déplacement.
 */
export function useFieldDrag({
  scale,
  getCanvasRect,
  onDragEnd,
  onClick,
}: UseFieldDragOptions) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(
    null,
  );
  const draggedRef = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const rect = getCanvasRect();
      if (!rect) return;
      const origin = screenToCanvas(e.clientX, e.clientY, rect, scale);
      startRef.current = {
        x: origin.x,
        y: origin.y,
        clientX: e.clientX,
        clientY: e.clientY,
      };
      draggedRef.current = false;
      setDragging(false);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getCanvasRect, scale],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      const dx = e.clientX - start.clientX;
      const dy = e.clientY - start.clientY;
      if (!draggedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

      draggedRef.current = true;
      setDragging(true);
      e.preventDefault();

      const rect = getCanvasRect();
      if (!rect) return;
      const pos = screenToCanvas(e.clientX, e.clientY, rect, scale);
      onDragEnd(pos.x, pos.y);
    },
    [getCanvasRect, onDragEnd, scale],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current;
      startRef.current = null;
      setDragging(false);

      if (!start) return;

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // capture déjà relâchée
      }

      if (draggedRef.current) {
        const rect = getCanvasRect();
        if (rect) {
          const pos = screenToCanvas(e.clientX, e.clientY, rect, scale);
          onDragEnd(pos.x, pos.y);
        }
      } else {
        onClick();
      }
      draggedRef.current = false;
    },
    [getCanvasRect, onClick, onDragEnd, scale],
  );

  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [dragging]);

  return {
    dragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
