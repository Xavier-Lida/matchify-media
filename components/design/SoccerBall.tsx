export function SoccerBall({
  size = 18,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ display: "inline-block", verticalAlign: "-0.18em" }}
    >
      <circle cx="12" cy="12" r="9.4" />
      <polygon
        points="12,7.9 16.1,10.85 14.55,15.6 9.45,15.6 7.9,10.85"
        fill={color}
        stroke={color}
        strokeWidth="0.6"
      />
      <line x1="12" y1="7.9" x2="12" y2="2.6" />
      <line x1="16.1" y1="10.85" x2="21.2" y2="9.2" />
      <line x1="14.55" y1="15.6" x2="17.7" y2="20.1" />
      <line x1="9.45" y1="15.6" x2="6.3" y2="20.1" />
      <line x1="7.9" y1="10.85" x2="2.8" y2="9.2" />
    </svg>
  );
}
