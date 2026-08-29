/* ────────────────────────────────────────────────────────────────
   Builds a fully static snapshot for GitHub Pages.

     node scripts/build-static.mjs

   Why the dance with src/app/api: Next.js refuses `output: "export"` while
   Route Handlers exist, so they are moved aside for the duration of the build
   and restored immediately afterwards (also on failure). The dashboard already
   falls back to `src/lib/fallback-data.ts` when /api/data is unavailable, so
   the exported site works end to end without a server.

   Output lands in ./docs (GitHub Pages "Deploy from a branch" source).
   ──────────────────────────────────────────────────────────────── */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "src", "app", "api");
const apiBackup = join(root, ".api-routes.bak");
const outDir = join(root, "out");
const docsDir = join(root, "docs");

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

  // 3 — publish build output to ./docs
  if (!existsSync(outDir)) throw new Error("Build finished but ./out is missing.");
  rmSync(docsDir, { recursive: true, force: true });
  mkdirSync(docsDir, { recursive: true });
  cpSync(outDir, docsDir, { recursive: true });
  // stop GitHub Pages from running the output through Jekyll
  writeFileSync(join(docsDir, ".nojekyll"), "");

  console.log("\n✅ Static site written to ./docs");
} finally {
  restore();
  rmSync(outDir, { recursive: true, force: true });
}
