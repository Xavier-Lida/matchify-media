import type { CSSProperties, ReactNode } from "react";

import { useDesignTokens } from "@/components/design/DesignThemeProvider";

export function Frame({
  children,
  tone = "ink",
  style,
}: {
  children: ReactNode;
  tone?: "ink" | "paper" | string;
  style?: CSSProperties;
}) {
  const T = useDesignTokens();
  const bg = tone === "ink" ? T.ink : tone === "paper" ? T.paper : tone;

  return (
    <div
      data-layer="frame"
      style={{
        width: T.W,
        height: T.H,
        position: "relative",
        overflow: "hidden",
        background: bg,
        color: T.paper,
        fontFamily: T.fontBody,
        fontSize: 18,
        lineHeight: 1.3,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
