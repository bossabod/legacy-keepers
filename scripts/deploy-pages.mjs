#!/usr/bin/env node
/**
 * Deploy the static `out/` folder to origin/gh-pages.
 * Run after: STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/legacy-keepers next build
 */
import { execSync } from "node:child_process";
import { existsSync, cpSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = process.cwd();
const outDir = join(root, "out");
if (!existsSync(outDir)) {
  console.error("Missing out/ — run: npm run export:static");
  process.exit(1);
}

// Ensure SPA-friendly 404 for GitHub Pages
const indexHtml = join(outDir, "index.html");
const notFound = join(outDir, "404.html");
if (existsSync(indexHtml) && !existsSync(notFound)) {
  cpSync(indexHtml, notFound);
}
writeFileSync(join(outDir, ".nojekyll"), "");

const work = join(tmpdir(), `lk-gh-pages-${Date.now()}`);
mkdirSync(work, { recursive: true });

const run = (cmd, cwd = work) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
};

run(`git clone --depth 1 --branch gh-pages ${execSync("git remote get-url origin", { cwd: root }).toString().trim()} .`);
// wipe tracked files except .git
run(`git rm -rf . 2>/dev/null || true`);
// copy build
cpSync(outDir, work, { recursive: true });
// restore .git if cp overwrote (cpSync into work merges)
run("git add -A");
const msg = `Deploy: static site ${new Date().toISOString()}`;
try {
  run(`git commit -m ${JSON.stringify(msg)}`);
} catch {
  console.log("Nothing to commit (already up to date).");
}
run("git push origin HEAD:gh-pages");
console.log("\n✅ Published → https://bossabod.github.io/legacy-keepers/");
rmSync(work, { recursive: true, force: true });
