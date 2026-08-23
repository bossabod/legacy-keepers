# Legacy Keepers — Version System

The website is versioned with **folder snapshots** under `versions/` plus annotated **git tags**.
Each snapshot is a full copy of `src`, `public`, and project config so any version can be restored instantly.

## Current versions

| Version | Location | Description |
|---------|----------|-------------|
| V_CURRENT | `versions/V_CURRENT/` | Full backup **before** moving Project Operations |
| V_PROJECTS_OPERATIONS | `versions/V_PROJECTS_OPERATIONS/` | After moving globe + ops dashboard into PROJECTS → Project Operations |
| V1 | tag `V1-Original` | Current Original (pre-redesign baseline) |
| V2 | tag `V2-Luxury` | Luxury Private Club redesign (quiet luxury) |

## Restore V_CURRENT (site as it was before this move)

```bash
cp -a versions/V_CURRENT/src/. src/
cp -a versions/V_CURRENT/public/. public/
cp -a versions/V_CURRENT/package.json versions/V_CURRENT/package-lock.json .
# then restart: npm run dev
```

Or from git:

```bash
git checkout V_CURRENT -- src public
```

## Restore V_PROJECTS_OPERATIONS

```bash
cp -a versions/V_PROJECTS_OPERATIONS/src/. src/
cp -a versions/V_PROJECTS_OPERATIONS/public/. public/
```

## Permanence rule
- Nothing is deleted unless explicitly requested.
- Old Home lives at `src/components/sections/Home.original.tsx`.
- Globe component `src/components/GlobalCommandGlobe.tsx` is unchanged.
