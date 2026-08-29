import type { NextConfig } from "next";

/* `STATIC_EXPORT=1` produces a fully static build (no Node server, no API
   routes) for the GitHub Pages demo. The dashboard reads bundled fallback data
   whenever /api/data is unreachable, so the exported site is fully functional.
   Run it with:  npm run build:static   (see scripts/build-static.mjs) */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const staticExportConfig = {
  output: "export" as const,
  distDir: "out",
  // GitHub Pages serves project sites from https://<user>.github.io/<repo>/
  basePath: "/legacy-keepers",
  assetPrefix: "/legacy-keepers/",
  images: { unoptimized: true },
  trailingSlash: true,
};

const nextConfig: NextConfig = {
  // Allow the sandbox preview host (https://<port>-<id>.e2b.app) to reach the dev server.
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
  ...(isStaticExport ? staticExportConfig : {}),
};

export default nextConfig;
