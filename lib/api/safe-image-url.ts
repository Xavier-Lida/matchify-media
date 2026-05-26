const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /^::1$/,
];

export function isSafeImageUrl(value: string | null): boolean {
  if (value === null) {
    return true;
  }
  if (value.startsWith("data:image/")) {
    return true;
  }
  if (value.startsWith("/")) {
    return true;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return false;
    }
    const host = url.hostname;
    return !PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host));
  } catch {
    return false;
  }
}
