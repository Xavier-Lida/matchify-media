import { BackdropPhoto } from "@/components/design/BackdropPhoto";
import { FooterStrip } from "@/components/design/FooterStrip";
import { Frame } from "@/components/design/Frame";
import {
  SCORE_CENTER_GAP,
  SCORE_PANEL_MIN_HEIGHT,
  SCORE_PANEL_WIDTH,
} from "@/components/design/result/constants";
import { hexToRgba } from "@/lib/design/tokens";
import { LogoEndcap } from "@/components/design/result/LogoEndcap";
import { ScoreDigit } from "@/components/design/result/ScoreDigit";
import { ScorerList } from "@/components/design/result/ScorerList";
import { useDesignTokens } from "@/components/design/DesignThemeProvider";
import type { ResultData } from "@/lib/design/result-types";

export function ResultVisual({ data }: { data: ResultData }) {
  const T = useDesignTokens();
  const { home, away, score, scorers, league, date, hero_photo } = data;
  const hasScorers =
    (scorers.home?.length || 0) + (scorers.away?.length || 0) > 0;

  const matchdayPadded =
    typeof league.matchday === "number"
      ? `MATCHDAY ${String(league.matchday).padStart(2, "0")}`
      : league.division.startsWith("MATCHDAY")
        ? league.division
        : `MATCHDAY ${league.matchday.replace(/\D/g, "").padStart(2, "0") || league.matchday}`;

  const scorePanelBackground = `linear-gradient(
    45deg,
    ${T.inkSoft} 0%,
    ${T.ink} 28%,
    ${T.ink} 72%,
    ${T.inkSoft} 100%
  )`;

  const ink = T.ink;
  const bottomVignette = `linear-gradient(
    180deg,
    ${hexToRgba(ink, 0.15)} 0%,
    ${hexToRgba(ink, 0)} 40%,
    ${hexToRgba(ink, 0.55)} 72%,
    ${hexToRgba(ink, 0.88)} 88%,
    ${hexToRgba(ink, 0.95)} 100%
  )`;

  return (
    <Frame>
      <BackdropPhoto src={hero_photo} grade="cool" focal="50% 32%" />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: bottomVignette,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 140,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", width: SCORE_PANEL_WIDTH }}>
          <div
            style={{
              position: "absolute",
              top: -20,
              left: "50%",
              transform: "translateX(-50%)",
              background: T.gold,
              color: T.ink,
              padding: "8px 20px",
              borderRadius: 6,
              fontFamily: T.fontDisplay,
              fontSize: 18,
              letterSpacing: "0.12em",
              whiteSpace: "nowrap",
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
              maxWidth: "95%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {league.name.toUpperCase()}
          </div>

          <div
            style={{
              background: scorePanelBackground,
              borderRadius: 12,
              minHeight: SCORE_PANEL_MIN_HEIGHT,
              padding: 0,
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "stretch",
            }}
          >
            <LogoEndcap logoUrl={home.logo_url} side="left" />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: SCORE_CENTER_GAP,
                padding: "8px 20px",
              }}
            >
              <ScoreDigit
                value={score[0]}
                winner={score[0] > score[1]}
              />
              <div
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  flexShrink: 0,
                  margin: "4px 8px",
                  background: `linear-gradient(180deg, transparent 0%, ${T.gold} 25%, ${T.gold} 75%, transparent 100%)`,
                }}
              />
              <ScoreDigit
                value={score[1]}
                winner={score[1] > score[0]}
              />
            </div>

            <LogoEndcap logoUrl={away.logo_url} side="right" />
          </div>

          <div
            style={{
              marginTop: 14,
              textAlign: "center",
              fontFamily: T.fontMono,
              fontSize: 12,
              letterSpacing: "0.3em",
              color: T.paper,
              textTransform: "uppercase",
            }}
          >
            {date} · {league.field_name}
          </div>

          {hasScorers ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 10,
              }}
            >
              <ScorerList list={scorers.home} align="left" />
              <ScorerList list={scorers.away} align="right" />
            </div>
          ) : null}
        </div>
      </div>

      <FooterStrip
        leagueLogo={league.logo_url}
        leagueName={league.name}
        matchday={matchdayPadded}
      />
    </Frame>
  );
}
