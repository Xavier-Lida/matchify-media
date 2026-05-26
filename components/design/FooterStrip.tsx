import { useDesignTokens } from "@/components/design/DesignThemeProvider";
import { imageCrossOrigin } from "@/lib/export/image-utils";

export function FooterStrip({
  leagueLogo,
  leagueName,
  matchday,
}: {
  leagueLogo: string | null;
  leagueName: string;
  matchday: string;
}) {
  const T = useDesignTokens();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: `${28}px ${T.margin}px`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${T.inkLine}`,
        background:
          "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: 56,
        }}
      >
        {leagueLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={leagueLogo}
            alt={leagueName}
            crossOrigin={imageCrossOrigin(leagueLogo)}
            style={{
              height: 52,
              maxWidth: 240,
              objectFit: "contain",
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 28,
              letterSpacing: "0.06em",
              color: T.paper,
            }}
          >
            {leagueName}
          </span>
        )}
      </div>

      <span
        style={{
          fontFamily: T.fontMono,
          fontSize: 13,
          letterSpacing: "0.25em",
          color: T.paperMute,
          textTransform: "uppercase",
        }}
      >
        {matchday}
      </span>
    </div>
  );
}
