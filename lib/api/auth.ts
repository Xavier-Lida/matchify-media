import { NextResponse } from "next/server";

export function verifyApiKey(request: Request): NextResponse | null {
  const configuredKey = process.env.MATCHIFY_API_KEY;
  const isDev = process.env.NODE_ENV === "development";

  if (!configuredKey) {
    if (isDev) {
      return null;
    }
    return NextResponse.json(
      { error: "MATCHIFY_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : null;

  if (!token || token !== configuredKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
