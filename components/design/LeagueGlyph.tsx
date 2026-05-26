export function LeagueGlyph({
  color,
  size = 48,
}: {
  color: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M24 2 L44 12 L44 36 L24 46 L4 36 L4 12 Z"
        stroke={color}
        strokeWidth="2.5"
      />
      <path
        d="M14 34 L14 16 L24 28 L34 16 L34 34"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="miter"
        fill="none"
      />
      <circle cx="24" cy="24" r="1.6" fill={color} />
    </svg>
  );
}
