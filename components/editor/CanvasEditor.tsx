"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type Konva from "konva";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect } from "react-konva";
import { useImage } from "./useImage";
import {
  computeCoverCrop,
  toFontString,
  type ImageInstruction,
  type LayeredRenderPlan,
  type RenderInstruction,
  type TextInstruction,
} from "@/lib/canvas";
import { useAvailableFonts } from "@/lib/hooks/use-available-fonts";
import type { JsonConfig, TextAlign } from "@/lib/types";

let measureCtx: CanvasRenderingContext2D | null = null;

function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  bold: boolean,
): number {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return 0;
  measureCtx.font = toFontString(fontSize, fontFamily, bold);
  return measureCtx.measureText(text).width;
}

const ALIGN_OFFSET: Record<TextAlign, (width: number) => number> = {
  left: () => 0,
  center: (w) => -w / 2,
  right: (w) => -w,
};

function PlanText({ ins }: { ins: TextInstruction }) {
  const width = measureTextWidth(
    ins.text,
    ins.fontSize,
    ins.fontFamily,
    ins.bold,
  );
  const x = ins.x + ALIGN_OFFSET[ins.align](width);
  return (
    <KonvaText
      x={x}
      y={ins.y}
      text={ins.text}
      fontSize={ins.fontSize}
      fontFamily={ins.fontFamily}
      fontStyle={ins.bold ? "bold" : "normal"}
      fill={ins.color}
      listening={false}
    />
  );
}

function PlanImage({ ins }: { ins: ImageInstruction }) {
  const { image, status } = useImage(ins.src);

  if (status === "loaded" && image) {
    const naturalWidth = image.width;
    const naturalHeight = image.height;
    const { sx, sy, sWidth, sHeight } = computeCoverCrop(
      naturalWidth,
      naturalHeight,
      ins.width,
      ins.height,
    );
    return (
      <KonvaImage
        image={image}
        x={ins.x}
        y={ins.y}
        width={ins.width}
        height={ins.height}
        crop={{ x: sx, y: sy, width: sWidth, height: sHeight }}
        listening={false}
      />
    );
  }

  return (
    <Rect
      x={ins.x}
      y={ins.y}
      width={ins.width}
      height={ins.height}
      fill="#3f3f46"
      listening={false}
    />
  );
}

function Background({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const { image, status } = useImage(src);
  if (status === "loaded" && image) {
    return (
      <KonvaImage
        image={image}
        x={0}
        y={0}
        width={width}
        height={height}
        listening={false}
      />
    );
  }
  return (
    <Rect x={0} y={0} width={width} height={height} fill="#18181b" listening={false} />
  );
}

const INSTRUCTION_COMPONENTS: {
  [K in RenderInstruction["kind"]]: (props: {
    ins: Extract<RenderInstruction, { kind: K }>;
  }) => React.ReactElement;
} = {
  text: PlanText,
  image: PlanImage,
};

function InstructionList({ instructions }: { instructions: RenderInstruction[] }) {
  return (
    <>
      {instructions.map((ins) => {
        const Component = INSTRUCTION_COMPONENTS[ins.kind] as (props: {
          ins: RenderInstruction;
        }) => React.ReactElement;
        return <Component key={ins.id} ins={ins} />;
      })}
    </>
  );
}

export interface CanvasEditorProps {
  config: JsonConfig;
  pngUrl: string;
  /** Plan par couche (préféré). */
  layeredPlan?: LayeredRenderPlan;
  /** Plan aplatie — rétrocompat si layeredPlan absent. */
  plan?: RenderInstruction[];
  stageRef?: RefObject<Konva.Stage | null>;
}

export default function CanvasEditor({
  config,
  pngUrl,
  layeredPlan,
  plan,
  stageRef,
}: CanvasEditorProps) {
  useAvailableFonts();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      setScale(Math.min(1, available / config.canvasWidth));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [config.canvasWidth]);

  const flatPlan = plan ?? [];
  const bg = layeredPlan?.background ?? [];
  const content = layeredPlan?.content ?? flatPlan;
  const fg = layeredPlan?.foreground ?? [];

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="overflow-hidden rounded-xl border border-border bg-surface-2"
        style={{ width: config.canvasWidth * scale, maxWidth: "100%" }}
      >
        <Stage
          ref={stageRef}
          width={config.canvasWidth * scale}
          height={config.canvasHeight * scale}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer>
            {layeredPlan ? (
              <>
                <InstructionList instructions={bg} />
                <Background
                  src={pngUrl}
                  width={config.canvasWidth}
                  height={config.canvasHeight}
                />
                <InstructionList instructions={content} />
                <InstructionList instructions={fg} />
              </>
            ) : (
              <>
                <Background
                  src={pngUrl}
                  width={config.canvasWidth}
                  height={config.canvasHeight}
                />
                <InstructionList instructions={flatPlan} />
              </>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
