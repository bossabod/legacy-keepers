THE LEGACY KEEPERS — static site build
=====================================

Login credentials:
  Membership ID : Q-T-971
  Password      : COVENANT

This build uses RELATIVE asset paths (./_next/..., ./images/...), so it runs
from a domain root, any sub-folder, or a CDN. Just upload the whole folder.
No build step, no database, no server needed.

Local preview:
    cd this-folder && python3 -m http.server 8080
then open http://localhost:8080

Notes
-----
- Ships with bundled demo data; PostgreSQL is optional.
- Fonts are self-hosted (no Google Fonts request at runtime).
- Welcome layout: start image on top, main page directly below it, both on
  one centre axis with a fixed gap.
- Build date: 2026-08-29
