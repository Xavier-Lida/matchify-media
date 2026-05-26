"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/constants";

type TemplateCanvasProps = {
  children: ReactNode;
  exportRef?: React.RefObject<HTMLDivElement | null>;
};

export function TemplateCanvas({ children, exportRef }: TemplateCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateScale = () => {
      const available = container.clientWidth - 16;
      const next = Math.min(available / CANVAS_WIDTH, 1);
      setScale(next > 0 ? next : 0.35);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const scaledWidth = CANVAS_WIDTH * scale;
  const scaledHeight = CANVAS_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className="flex w-full items-start justify-center overflow-hidden rounded-lg border bg-muted/30 p-2"
      style={{ minHeight: scaledHeight + 16 }}
    >
      <div
        style={{
          width: scaledWidth,
          height: scaledHeight,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div
            ref={exportRef}
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
