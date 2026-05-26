import { useDesignTokens } from "@/components/design/DesignThemeProvider";
import { imageCrossOrigin } from "@/lib/export/image-utils";

export function LogoOnLight({ logoUrl }: { logoUrl: string | null }) {
  const T = useDesignTokens();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        crossOrigin={imageCrossOrigin(logoUrl)}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 8,
        background:
          "repeating-linear-gradient(45deg, #EEE8DA 0 6px, #F5F1E8 6px 12px)",
        border: "1.5px dashed #B9B3A3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: T.fontMono,
        fontSize: 10,
        color: "#7A7460",
        letterSpacing: "0.2em",
      }}
    >
      LOGO
    </div>
  );
}
