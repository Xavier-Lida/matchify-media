import { readFile } from "fs/promises";
import { join } from "path";

// Serve the bundled html2canvas lib so iframe srcdoc templates can load it
// without relying on an external CDN.
export async function GET() {
  const filePath = join(
    process.cwd(),
    "node_modules/html2canvas/dist/html2canvas.min.js",
  );
  const content = await readFile(filePath, "utf-8");
  return new Response(content, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
