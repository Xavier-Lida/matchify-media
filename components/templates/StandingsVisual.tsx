import { LeagueHeader, TeamLogo } from "@/components/templates/shared";
import type { StandingsData, TemplateVisualProps } from "@/lib/templates/types";

const MAX_ROWS = 8;

export function StandingsVisual({
  data,
  branding,
}: TemplateVisualProps<StandingsData>) {
  const rows = data.rows.slice(0, MAX_ROWS);

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        background: `linear-gradient(165deg, ${branding.primaryColor} 0%, #020617 100%)`,
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: 56,
        boxSizing: "border-box",
      }}
    >
      <LeagueHeader branding={branding} />

      <div
        style={{
          textAlign: "center",
          fontSize: 34,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: branding.secondaryColor,
          marginBottom: 40,
        }}
      >
        {data.title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr 56px 56px 56px 56px 72px 72px 80px",
          gap: "8px 12px",
          padding: "16px 20px",
          fontSize: 18,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          opacity: 0.65,
          borderBottom: `2px solid ${branding.secondaryColor}`,
        }}
      >
        <span>#</span>
        <span>Équipe</span>
        <span style={{ textAlign: "center" }}>J</span>
        <span style={{ textAlign: "center" }}>V</span>
        <span style={{ textAlign: "center" }}>N</span>
        <span style={{ textAlign: "center" }}>D</span>
        <span style={{ textAlign: "center" }}>BP</span>
        <span style={{ textAlign: "center" }}>BC</span>
        <span style={{ textAlign: "center" }}>Pts</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((row, index) => (
          <div
            key={`${row.rank}-${row.teamName}`}
            style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr 56px 56px 56px 56px 72px 72px 80px",
              gap: "8px 12px",
              alignItems: "center",
              padding: "14px 20px",
              borderRadius: 12,
              backgroundColor:
                index === 0
                  ? `${branding.secondaryColor}33`
                  : index % 2 === 0
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
              fontSize: 24,
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 28 }}>{row.rank}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <TeamLogo logo={row.logo} name={row.teamName} size={48} />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 26,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.teamName}
              </span>
            </div>
            <Cell>{row.played}</Cell>
            <Cell>{row.wins}</Cell>
            <Cell>{row.draws}</Cell>
            <Cell>{row.losses}</Cell>
            <Cell>{row.gf}</Cell>
            <Cell>{row.ga}</Cell>
            <Cell highlight color={branding.secondaryColor}>
              {row.points}
            </Cell>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({
  children,
  highlight,
  color,
}: {
  children: React.ReactNode;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <span
      style={{
        textAlign: "center",
        fontWeight: highlight ? 900 : 600,
        fontSize: highlight ? 30 : 24,
        color: highlight ? color : undefined,
      }}
    >
      {children}
    </span>
  );
}
