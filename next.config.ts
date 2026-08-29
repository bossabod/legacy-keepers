import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the sandbox preview host (https://<port>-<id>.e2b.app) to reach the dev server.
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
};

export default nextConfig;
