/* ────────────────────────────────────────────────────────────────
   Builds a fully static snapshot for GitHub Pages.

     node scripts/build-static.mjs

   Why the dance with src/app/api: Next.js refuses `output: "export"` while
   Route Handlers exist, so they are moved aside for the duration of the build
   and restored immediately afterwards (also on failure). The dashboard already
   falls back to `src/lib/fallback-data.ts` when /api/data is unavailable, so
   the exported site works end to end without a server.

   Output lands in $STATIC_OUT_DIR (default ./docs, the GitHub Pages
   "Deploy from a branch" source). Set STATIC_BASE_PATH="" for a portable
   build that can be served from any domain root.
   ──────────────────────────────────────────────────────────────── */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "src", "app", "api");
const apiBackup = join(root, ".api-routes.bak");
const outDir = join(root, "out");
const publishDir = join(root, process.env.STATIC_OUT_DIR || "docs");

const run = (cmd, args) =>
  execFileSync(cmd, args, { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1" } });

const restore = () => {
  if (existsSync(apiBackup) && !existsSync(apiDir)) renameSync(apiBackup, apiDir);
};

try {
  // 1 — move Route Handlers out of the way
  if (existsSync(apiDir)) renameSync(apiDir, apiBackup);

  // 2 — build the static export
  run("npx", ["next", "build"]);

  // 3 — publish build output
  if (!existsSync(outDir)) throw new Error("Build finished but ./out is missing.");
  rmSync(publishDir, { recursive: true, force: true });
  mkdirSync(publishDir, { recursive: true });
  cpSync(outDir, publishDir, { recursive: true });
  // stop GitHub Pages from running the output through Jekyll
  writeFileSync(join(publishDir, ".nojekyll"), "");

  console.log(`\n✅ Static site written to ${process.env.STATIC_OUT_DIR || "docs"}`);
} finally {
  restore();
  rmSync(outDir, { recursive: true, force: true });
}
