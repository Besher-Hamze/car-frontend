/** API origin without /api/v1 — used for uploaded files served from the backend root. */
export function getApiOrigin(): string {
  const u = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const trimmed = u.replace(/\/api\/v1\/?$/, '');
  return trimmed || 'http://localhost:4000';
}

/** Resolves stored paths like `/uploads/cars/...` or legacy absolute URLs for next/image `src`. */
export function resolveCarImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${getApiOrigin()}${path}`;
}
/** Resolves stored paths like `/uploads/cars/...` or legacy absolute URLs for next/image `src`. */
export function resolveCarImagesUrl(urls?: string[] | null): string[] | undefined {
  if (!urls) return undefined;
  return urls.map((url) => resolveCarImageUrl(url));
}