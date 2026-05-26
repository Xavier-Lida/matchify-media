export function Grain() {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>
       <filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' seed='4'/>
       <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter>
       <rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/>
     </svg>`,
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        mixBlendMode: "overlay",
        opacity: 0.18,
        pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`,
        backgroundSize: "220px 220px",
      }}
    />
  );
}
