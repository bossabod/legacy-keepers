import type { NextConfig } from "next";

/* `STATIC_EXPORT=1` produces a fully static build (no Node server, no API
   routes) for the GitHub Pages demo. The dashboard reads bundled fallback data
   whenever /api/data is unreachable, so the exported site is fully functional.
   Run it with:  npm run build:static   (see scripts/build-static.mjs) */
const isStaticExport = process.env.STATIC_EXPORT === "1";

/* Where the static bundle is served from.
   Default "" -> relative asset urls (./_next/...), which makes the export
   portable: it runs from a domain root, from ANY sub-folder, or from a CDN.
   Set STATIC_BASE_PATH=/legacy-keepers for absolute, sub-path-pinned urls. */
const basePath = process.env.STATIC_BASE_PATH ?? "";

const staticExportConfig = {
  output: "export" as const,
  distDir: "out",
  basePath: basePath || undefined,
  // With no basePath the bundle is meant to be portable, so emit RELATIVE
  // asset urls (./_next/...) — that way it runs from any sub-folder or CDN,
  // not just from a domain root.
  assetPrefix: basePath ? `${basePath}/` : "./",
  images: { unoptimized: true },
  trailingSlash: true,
};

const nextConfig: NextConfig = {
  // Allow the sandbox preview host (https://<port>-<id>.e2b.app) to reach the dev server.
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
  ...(isStaticExport ? staticExportConfig : {}),
};

export default nextConfig;
