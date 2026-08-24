# Legacy Keepers — Version System

The website is versioned with annotated **git tags**. Each tag points to a full,
self-contained snapshot of the entire project (HTML/CSS/JS/components/data/assets),
so any version can be restored instantly.

## Current versions

| Version | Tag                     | Commit      | Description                                                        |
|---------|-------------------------|-------------|--------------------------------------------------------------------|
| V1      | `V1-Original`           | `a5f7900`   | Original baseline (pre-V2 redesign)                                |
| V2      | `V2-Luxury`             | `5cd7514`   | Luxury Private Club redesign (quiet luxury)                        |
| VC      | `V_CURRENT`             | `661502d`   | Full backup of the current site **before** the Project Operations move |
| VPO     | `V_PROJECTS_OPERATIONS` | *(latest)*  | After moving Project Operations from HOME into PROJECTS            |

> Add one tag per future version (`V3-…`, `V4-…`) using the commands below.

## How to restore a version

**Restore the whole site to a specific version (e.g. V_CURRENT):**
```bash
git fetch --tags origin
git checkout -b restore/V_CURRENT V_CURRENT
git push origin restore/V_CURRENT
# then publish the built output (see DEPLOY / publishing routine)
```

**Restore the latest version:**
```bash
git fetch --tags origin
git tag -l "V*"                    # list versions, newest last
git checkout -b restore/latest <newest-tag>
```

**Create a new version tag after a completed change:**
```bash
git tag -a V3-... -m "V3 — description"
git push origin V3-...
```

## Project Operations move (this version)
- `src/components/projects/ProjectOperations.tsx` — the full operational page moved from HOME
  (interactive map/globe, annual/operational performance, project status, monthly growth,
  timeline, estimated spend, quick glance, world clocks, digital & physical projects).
- `src/components/sections/Home.tsx` — cleaned (keeps cinematic opening, The House journey,
  room shortcuts). The original HOME is preserved in `src/components/sections/Home.original.tsx`.
- `src/components/sections/Projects.tsx` — now exposes **PROJECTS → Project Operations**.

## Permanence rule
- Nothing is deleted unless explicitly requested.
