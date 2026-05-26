import { SoccerBall } from "@/components/design/SoccerBall";
import { useDesignTokens } from "@/components/design/DesignThemeProvider";
import type { ResultScorer } from "@/lib/design/result-types";

function GoalBalls({ count, color }: { count: number; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {Array.from({ length: count }, (_, i) => (
        <SoccerBall key={i} size={13} color={color} />
      ))}
    </span>
  );
}

export function ScorerList({
  list,
  align = "left",
}: {
  list: ResultScorer[];
  align?: "left" | "right";
}) {
  const T = useDesignTokens();

  return (
    <div
      style={{
        textAlign: align,
        fontSize: 13,
        color: T.paperMute,
        lineHeight: 1.8,
      }}
    >
      {list.map((s, i) => {
        const goals = s.goals ?? 1;
        return (
          <div
            key={`${s.name}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: align === "left" ? "flex-start" : "flex-end",
              gap: 8,
            }}
          >
            {align === "left" ? (
              <GoalBalls count={goals} color={T.gold} />
            ) : null}
            <span
              style={{
                fontWeight: 600,
                color: T.paper,
                letterSpacing: "0.02em",
                fontSize: 13,
              }}
            >
              {s.name}
            </span>
            {align === "right" ? (
              <GoalBalls count={goals} color={T.gold} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
