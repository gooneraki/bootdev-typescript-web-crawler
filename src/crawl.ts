export function normalizeURL(rawUrl: string) {
  const url = new URL(rawUrl);
  const normalized = `${url.hostname}${url.pathname}`.toLowerCase();

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}
