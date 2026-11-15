/**
 * Platform Architecture Index
 * Master Specification: Modular Architecture
 *
 * Each subsystem remains loosely coupled and replaceable.
 *
 * PHASE STATUS:
 * [x] Phase 1  — Project Architecture (this file, theme, design system, entity types)
 * [ ] Phase 2  — 3D Globe Engine (CesiumJS, terrain, camera, LOD, mini-globe)
 * [ ] Phase 3  — Search Engine (global search, coordinates, autocomplete, bookmarks)
 * [ ] Phase 4  — Entity System (CRUD, people, organizations, locations, metadata)
 * [ ] Phase 5  — Relationship Engine (graph, types, timeline, visualization, analysis)
 * [ ] Phase 6  — Dashboard (panels, widgets, analytics, filtering, timeline, status bar)
 * [ ] Phase 7  — Security (authentication, RBAC, permissions, audit logs, version history)
 * [ ] Phase 8  — Performance (caching, lazy loading, streaming, optimization)
 * [ ] Phase 9  — AI Ready Architecture (NLP search, analysis, summarization, reports)
 * [ ] Phase 10 — Final Polish (animations, accessibility, responsive, documentation)
 *
 * MODULE STRUCTURE:
 *
 * src/
 *   app/                         Next.js App Router
 *     layout.tsx                 Root layout with fonts and providers
 *     page.tsx                   Entry point (welcome → login → loading → dashboard)
 *     globals.css                Global styles and Tailwind theme
 *     api/
 *       data/route.ts            Data API endpoint
 *       health/route.ts          Health check
 *
 *   components/
 *     design-system/             Phase 1 — Reusable UI component library
 *       index.ts                 Barrel export
 *       Button.tsx               Button with variants (primary, secondary, ghost, danger)
 *       IconButton.tsx           Icon-only button
 *       Input.tsx                Text input with icon support
 *       Panel.tsx                Surface panel with optional glass effect
 *       Badge.tsx                Status/category badges
 *       StatusBar.tsx            Bottom status bar (coordinates, zoom, altitude, FPS)
 *       Skeleton.tsx             Loading placeholder
 *       EmptyState.tsx           Empty state with guidance
 *       Tooltip.tsx              Hover tooltip
 *
 *     layout/                    Phase 1+6 — Application layout (future expansion)
 *
 *     globe/                     Phase 2 — 3D Globe Engine (CesiumJS)
 *
 *     search/                    Phase 3 — Search Engine components
 *
 *     sections/                  Existing page sections
 *       Network.tsx              Global intelligence map
 *       Home.tsx                 Dashboard home with globe
 *       Projects.tsx             Opportunity gateway
 *       Messages.tsx             Communication center
 *       Archive.tsx              Classified archive
 *       Features.tsx             Member services
 *       ...                      Other sections
 *
 *     WelcomeScreen.tsx          Landing page
 *     LoginScreen.tsx            Authentication gate
 *     LoadingScreen.tsx          Cinematic loading sequence
 *     Dashboard.tsx              Main dashboard shell with navigation
 *     GlobalCommandGlobe.tsx     Canvas-based globe for home page
 *     brand.tsx                  Logo and wordmark components
 *     ui.tsx                     Legacy UI components (being migrated to design-system)
 *
 *   lib/
 *     theme.ts                   Phase 1 — Centralized theme system
 *     i18n.ts                    Internationalization (EN/AR)
 *     sound.ts                   Procedural audio engine
 *     format.ts                  Currency and data formatting
 *     store.tsx                  Global app state (currency, language, sound)
 *     types.ts                   Legacy data types
 *     fallback-data.ts           Fallback data for offline
 *     earth-data.ts              Earth land points for globe rendering
 *     world-polygons.ts          Country border polygon data
 *
 *     entities/                  Phase 4 — Entity Architecture
 *       types.ts                 Universal entity model, relationships, timeline, permissions
 *
 *     camera/                    Phase 2 — Camera Engine
 *       types.ts                 Camera state, controller interface, bookmarks, keyframes
 *
 *   hooks/                       Custom React hooks
 *     index.ts                   Barrel export
 *     useFps.ts                  FPS monitoring for status bar
 *     useGeoCoordinates.ts       Coordinate parsing (decimal, DMS, DDM formats)
 *
 *   db/                          Database layer
 *     schema.ts                  Drizzle ORM schema
 *     index.ts                   Connection pool
 */
export {};
