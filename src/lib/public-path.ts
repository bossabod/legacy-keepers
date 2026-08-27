/** Prefix public asset paths for GitHub Pages basePath when set. */
export function publicPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!path) return base || "/";
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
