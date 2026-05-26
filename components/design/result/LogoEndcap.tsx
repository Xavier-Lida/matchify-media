import { LogoOnLight } from "@/components/design/result/LogoOnLight";
import { LOGO_ENDCAP_WIDTH } from "@/components/design/result/constants";

export function LogoEndcap({
  logoUrl,
  side,
}: {
  logoUrl: string | null;
  side: "left" | "right";
}) {
  const borderRadius =
    side === "left" ? "12px 0 0 12px" : "0 12px 12px 0";

  return (
    <div
      style={{
        width: LOGO_ENDCAP_WIDTH,
        height: "100%",
        alignSelf: "stretch",
        background: "#FFFFFF",
        borderRadius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        boxSizing: "border-box",
        boxShadow: side === "left" ? "4px 0 12px rgba(0,0,0,0.2)" : "-4px 0 12px rgba(0,0,0,0.2)",
      }}
    >
      <LogoOnLight logoUrl={logoUrl} />
    </div>
  );
}
