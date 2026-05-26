import { LeagueHeader, TeamLogo } from "@/components/templates/shared";
import type { MatchDayData, TemplateVisualProps } from "@/lib/templates/types";

export function MatchDayVisual({
  data,
  branding,
}: TemplateVisualProps<MatchDayData>) {
  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        background: `linear-gradient(180deg, ${branding.primaryColor} 0%, #0b1220 70%)`,
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        padding: 64,
        boxSizing: "border-box",
      }}
    >
      <LeagueHeader branding={branding} />

      <div
        style={{
          textAlign: "center",
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: branding.secondaryColor,
          margin: "24px 0 64px",
        }}
      >
        {data.matchday}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.75,
          }}
        >
          Prochain match
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 64,
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center", flex: 1 }}>
            <TeamLogo logo={data.teamA.logo} name={data.teamA.name} size={220} />
            <div
              style={{
                marginTop: 28,
                fontSize: 44,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {data.teamA.name}
            </div>
          </div>

          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: branding.secondaryColor,
            }}
          >
            VS
          </div>

          <div style={{ textAlign: "center", flex: 1 }}>
            <TeamLogo logo={data.teamB.logo} name={data.teamB.name} size={220} />
            <div
              style={{
                marginTop: 28,
                fontSize: 44,
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {data.teamB.name}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 48,
            padding: "32px 48px",
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.08)",
            textAlign: "center",
            width: "100%",
            maxWidth: 800,
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700 }}>{data.dateTime}</div>
          <div style={{ fontSize: 30, marginTop: 16, opacity: 0.85 }}>
            {data.venue}
          </div>
        </div>
      </div>
    </div>
  );
}
