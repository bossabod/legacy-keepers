# Legacy Keepers — Version System

The website is versioned with annotated **git tags**. Each tag points to a full,
self-contained snapshot of the entire project (HTML/CSS/JS/components/data/assets),
so any version can be restored instantly.

## Current versions

| Version | Tag            | Commit      | Description                                  |
|---------|----------------|-------------|----------------------------------------------|
| V1      | `V1-Original`  | `a5f7900`   | Current Original (pre-redesign baseline)     |
| V2      | `V2-Luxury`    | *(latest)*  | Luxury Private Club redesign (quiet luxury)  |

> Add one tag per future version (`V3-…`, `V4-…`) using the commands below.

## How to restore a version

**Restore the whole site to V1 (Original):**
```bash
git fetch --tags origin
git checkout -b restore/V1 V1-Original
git push origin restore/V1
# then publish the built output (see DEPLOY / publishing routine)
```

**Restore the latest version:**
```bash
git fetch --tags origin
git tag -l "V*"                    # list versions, newest last
git checkout -b restore/latest <newest-tag>
```

**Create a new version tag after a completed redesign:**
```bash
git tag -a V3-... -m "V3 — description"
git push origin V3-...
```

## Permanence rule
- Nothing is deleted unless explicitly requested.
- The old HTML/CSS/JS/assets/components/data all live in the tagged commits and in
  `git history` — restoring is `git checkout <tag>`, not a re-do.
