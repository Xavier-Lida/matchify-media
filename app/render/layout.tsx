export default function RenderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#000",
      }}
    >
      {children}
    </div>
  );
}
