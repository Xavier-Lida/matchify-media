import { useDesignTokens } from "@/components/design/DesignThemeProvider";
import { LeagueGlyph } from "@/components/design/LeagueGlyph";

export function LeagueMark({
  name = "MERIDIAN",
  division = "DIV 1",
  color,
  size = 1,
  logo_url = null,
}: {
  name?: string;
  division?: string;
  color?: string;
  size?: number;
  logo_url?: string | null;
}) {
  const T = useDesignTokens();
  const accent = color ?? T.gold;

  return (
    <div
      data-layer="meta"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14 * size,
        fontFamily: T.fontDisplay,
        letterSpacing: "0.04em",
      }}
    >
      {logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo_url}
          alt={name}
          style={{
            width: 48 * size,
            height: 48 * size,
            objectFit: "contain",
          }}
        />
      ) : (
        <LeagueGlyph color={accent} size={48 * size} />
      )}
      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            fontSize: 38 * size,
            letterSpacing: "0.06em",
            color: T.paper,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: T.fontMono,
            fontSize: 12 * size,
            letterSpacing: "0.18em",
            color: accent,
            marginTop: 4 * size,
          }}
        >
          {division}
        </div>
      </div>
    </div>
  );
}
