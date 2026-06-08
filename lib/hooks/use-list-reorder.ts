"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 5;

function findListIndexAt(clientX: number, clientY: number): number | null {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  const row = el.closest("[data-field-index]");
  if (!row) return null;
  const raw = row.getAttribute("data-field-index");
  if (raw === null) return null;
  const index = Number.parseInt(raw, 10);
  return Number.isNaN(index) ? null : index;
}

/** Index d'insertion selon la moitié verticale de la ligne survolée. */
function resolveDropIndex(
  hoverIndex: number,
  clientY: number,
  rowEl: Element,
): number {
  const rect = rowEl.getBoundingClientRect();
  const mid = rect.top + rect.height / 2;
  return clientY < mid ? hoverIndex : hoverIndex + 1;
}

export interface UseListReorderOptions {
  itemCount: number;
  onReorder: (from: number, to: number) => void;
}

/**
 * Drag vertical sur poignée pour réordonner une liste.
 * Retourne l'index d'insertion prévu (dropTargetIndex) pendant le drag.
 */
export function useListReorder({ itemCount, onReorder }: UseListReorderOptions) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const sourceRef = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const startClientRef = useRef<{ x: number; y: number } | null>(null);
  const lastClientRef = useRef<{ x: number; y: number } | null>(null);

  const updateDropTarget = useCallback(
    (clientX: number, clientY: number) => {
      lastClientRef.current = { x: clientX, y: clientY };
      const hoverIndex = findListIndexAt(clientX, clientY);
      if (hoverIndex === null) {
        setDropTargetIndex(null);
        return;
      }
      const el = document.elementFromPoint(clientX, clientY);
      const row = el?.closest("[data-field-index]");
      if (!row) {
        setDropTargetIndex(null);
        return;
      }
      let to = resolveDropIndex(hoverIndex, clientY, row);
      if (to > itemCount) to = itemCount;
      setDropTargetIndex(to);
    },
    [itemCount],
  );

  const onGripPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      sourceRef.current = index;
      draggedRef.current = false;
      startClientRef.current = { x: e.clientX, y: e.clientY };
      lastClientRef.current = { x: e.clientX, y: e.clientY };
      setDraggingIndex(null);
      setDropTargetIndex(null);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const onGripPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (sourceRef.current === null || !startClientRef.current) return;
      const dx = e.clientX - startClientRef.current.x;
      const dy = e.clientY - startClientRef.current.y;
      if (!draggedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

      draggedRef.current = true;
      setDraggingIndex(sourceRef.current);
      e.preventDefault();
      updateDropTarget(e.clientX, e.clientY);
    },
    [updateDropTarget],
  );

  const finishDrag = useCallback(
    (e: React.PointerEvent) => {
      const from = sourceRef.current;
      sourceRef.current = null;
      startClientRef.current = null;

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // capture déjà relâchée
      }

      if (from !== null && draggedRef.current) {
        const last = lastClientRef.current;
        let to: number | null = null;
        if (last) {
          const hover = findListIndexAt(last.x, last.y);
          if (hover !== null) {
            const el = document.elementFromPoint(last.x, last.y);
            const row = el?.closest("[data-field-index]");
            to = row
              ? resolveDropIndex(hover, last.y, row)
              : hover;
            to = Math.max(0, Math.min(to, itemCount));
          }
        }
        if (to !== null && from !== to) {
          onReorder(from, to);
        }
      }

      draggedRef.current = false;
      setDraggingIndex(null);
      setDropTargetIndex(null);
    },
    [itemCount, onReorder],
  );

  const onGripPointerUp = useCallback(
    (e: React.PointerEvent) => {
      finishDrag(e);
    },
    [finishDrag],
  );

  const onGripPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      finishDrag(e);
    },
    [finishDrag],
  );

  useEffect(() => {
    if (draggingIndex === null) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [draggingIndex]);

  const getGripProps = useCallback(
    (index: number) => ({
      role: "button" as const,
      tabIndex: 0,
      "aria-grabbed": draggingIndex === index,
      "aria-label": "Réordonner",
      className: `shrink-0 touch-none px-1 text-muted hover:text-foreground ${
        draggingIndex === index
          ? "cursor-grabbing opacity-80"
          : "cursor-grab active:cursor-grabbing"
      }`,
      onPointerDown: onGripPointerDown(index),
      onPointerMove: onGripPointerMove,
      onPointerUp: onGripPointerUp,
      onPointerCancel: onGripPointerCancel,
    }),
    [
      draggingIndex,
      onGripPointerCancel,
      onGripPointerDown,
      onGripPointerMove,
      onGripPointerUp,
    ],
  );

  return {
    draggingIndex,
    dropTargetIndex,
    getGripProps,
  };
}
