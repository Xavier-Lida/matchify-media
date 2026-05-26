import type { CSSProperties, ReactNode } from "react";

import { useDesignTokens } from "@/components/design/DesignThemeProvider";

export function Pill({
  children,
  tone = "gold",
  style,
}: {
  children: ReactNode;
  tone?: "gold" | "ink" | "ghost" | "paper";
  style?: CSSProperties;
}) {
  const T = useDesignTokens();

  const styles = {
    gold: { bg: T.gold, fg: T.ink, border: "none" as const },
    ink: { bg: T.ink, fg: T.paper, border: `1px solid ${T.inkLine}` },
    ghost: {
      bg: "rgba(255,255,255,0.08)",
      fg: T.paper,
      border: "1px solid rgba(255,255,255,0.18)",
    },
    paper: { bg: T.paper, fg: T.ink, border: "none" as const },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 999,
        background: styles.bg,
        color: styles.fg,
        border: styles.border,
        fontFamily: T.fontMono,
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
