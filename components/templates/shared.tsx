import type { Branding } from "@/lib/templates/types";

export function LeagueHeader({ branding }: { branding: Branding }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        paddingBottom: 32,
      }}
    >
      {branding.logoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoDataUrl}
          alt=""
          style={{ width: 72, height: 72, objectFit: "contain" }}
        />
      ) : (
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        />
      )}
      <span
        style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#ffffff",
        }}
      >
        {branding.leagueName}
      </span>
    </div>
  );
}

export function TeamLogo({
  logo,
  name,
  size = 160,
}: {
  logo: string | null;
  name: string;
  size?: number;
}) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
        }}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.28,
        fontWeight: 800,
        color: "#ffffff",
      }}
    >
      {initials}
    </div>
  );
}
