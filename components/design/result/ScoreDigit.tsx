import { useDesignTokens } from "@/components/design/DesignThemeProvider";
import { SCORE_FONT_SIZE } from "@/components/design/result/constants";

export function ScoreDigit({
  value,
  winner,
}: {
  value: number;
  winner: boolean;
}) {
  const T = useDesignTokens();

  return (
    <span
      style={{
        fontFamily: T.fontDisplay,
        fontSize: SCORE_FONT_SIZE,
        lineHeight: 0.9,
        color: winner ? T.gold : T.paper,
        letterSpacing: "-0.01em",
      }}
    >
      {value}
    </span>
  );
}
