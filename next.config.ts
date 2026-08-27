import type { NextConfig } from "next";

const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // Static GitHub Pages deploy (base path matches repo name)
  ...(isStatic
    ? {
        output: "export" as const,
        basePath: "/legacy-keepers",
        assetPrefix: "/legacy-keepers",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
  // Allow Arena / e2b live-preview hosts in dev
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev", "localhost", "127.0.0.1"],
  ...(!isStatic
    ? {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "Content-Security-Policy", value: "frame-ancestors *" },
              ],
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
