import { useDesignTokens } from "@/components/design/DesignThemeProvider";
import { imageCrossOrigin } from "@/lib/export/image-utils";

export function BackdropPhoto({
  src,
  focal = "50% 30%",
  grade = "cool",
}: {
  src: string | null;
  focal?: string;
  grade?: "duotone" | "cool" | "warm" | "none";
}) {
  const filters: Record<string, string> = {
    duotone: "saturate(0.85) contrast(1.02) brightness(0.95)",
    cool: "saturate(0.95) contrast(1.02)",
    warm: "saturate(1) contrast(1.02)",
    none: "none",
  };

  return (
    <div data-layer="backdrop" style={{ position: "absolute", inset: 0 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          crossOrigin={imageCrossOrigin(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: focal,
            filter: filters[grade] ?? filters.none,
          }}
        />
      ) : (
        <PhotoPlaceholder label="HERO_PHOTO" />
      )}
    </div>
  );
}

function PhotoPlaceholder({ label }: { label: string }) {
  const T = useDesignTokens();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: `repeating-linear-gradient(45deg, ${T.inkSoft} 0 12px, ${T.ink} 12px 24px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 12,
          color: T.paperMute,
          letterSpacing: "0.2em",
          padding: "8px 14px",
          border: `1px dashed ${T.paperMute}`,
        }}
      >
        {label}
      </div>
    </div>
  );
}
