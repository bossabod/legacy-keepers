/* ============================================================
   nyc-osm.ts — REAL New York City data from OpenStreetMap.
   Fetches the actual building footprints (+ real heights) and the
   real street network for New York City's five boroughs from the
   OpenStreetMap Overpass API, at runtime in the viewer's browser.
   Coordinates are projected to local metres (a Web-Mercator-style
   tangent plane centred on midtown Manhattan) for use in the 3D scene.

   This is REAL data — real building locations, real footprints, real
   heights, real roads — not a procedurally-generated stand-in.
   On any failure we return partial/empty results so the scene always
   renders something.
   ============================================================ */

export type RoadClass = "motorway" | "trunk" | "primary" | "secondary" | "tertiary" | "residential" | "service";

export interface RoadSeg {
  pts: [number, number][];   // local [x, z] in metres
  width: number;             // road surface width in metres
  major: boolean;            // is an arterial (wider / more prominent)
}

export interface Building {
  x: number; z: number;       // centroid (local metres)
  w: number; d: number;       // footprint extents (metres)
  rot: number;                // orientation (radians)
  h: number;                  // real roof height (metres)
}

export interface WaterPoly {
  pts: [number, number][][];  // rings (local metres)
}
export type GreenPoly = WaterPoly;

export interface NycResult {
  roads: RoadSeg[];
  buildings: Building[];
  water: WaterPoly[];
  greens: GreenPoly[];
  ok: boolean;
  message?: string;
}

/* ---- local tangent-plane projection (metres) centred on midtown ---- */
const LON0 = -74.0060;
const LAT0 = 40.7128;
const M_PER_LON = 111320 * Math.cos((LAT0 * Math.PI) / 180); // ~86,000
const M_PER_LAT = 110540;

export function toLocal(lat: number, lon: number): [number, number] {
  return [(lon - LON0) * M_PER_LON, (LAT0 - lat) * M_PER_LAT];
}

/* NYC bounding boxes (borough-level) — [swLat, swLon, neLat, neLon] */
const NYC_BBOX = "40.470,-74.260,40.920,-73.700";
const MANHATTAN_BBOX = "40.700,-74.030,40.882,-73.905";
const BOROUGHS: [string, string][] = [
  ["Manhattan", MANHATTAN_BBOX],
  ["Brooklyn", "40.570,-74.040,40.740,-73.833"],
  ["Queens", "40.543,-73.970,40.800,-73.700"],
  ["Bronx", "40.785,-73.935,40.920,-73.765"],
  ["StatenIsland", "40.470,-74.260,40.650,-74.038"],
];

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function fetchOverpass(query: string, timeoutMs = 55000): Promise<any[]> {
  for (const ep of ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && Array.isArray(data.elements)) return data.elements;
    } catch {
      /* try next endpoint */
    }
  }
  return [];
}

function simplify<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const out: T[] = [];
  const stride = Math.max(1, Math.floor(arr.length / max));
  for (let i = 0; i < arr.length; i += stride) out.push(arr[i]);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
}

/* ---------- ROADS ---------- */
const ROAD_WIDTH: Record<string, number> = {
  motorway: 9, trunk: 8, primary: 7, secondary: 5,
  tertiary: 4, unclassified: 3, residential: 3, service: 2.4, living_street: 3,
};
const ROAD_MAJOR = /motorway|trunk|primary|secondary/;

function geomsToLocal(el: any): [number, number][] {
  if (!el || !Array.isArray(el.geometry)) return [];
  const pts: [number, number][] = [];
  for (const g of el.geometry) if (g && typeof g.lat === "number") pts.push(toLocal(g.lat, g.lon));
  return pts;
}

async function fetchRoads(): Promise<RoadSeg[]> {
  const roads: RoadSeg[] = [];
  // 1) arterial network across all five boroughs
  const mainQ = `[out:json][timeout:60];way["highway"~"motorway|trunk|primary|secondary"](bbox:${NYC_BBOX});out geom;`;
  const mainEl = await fetchOverpass(mainQ);
  for (const el of mainEl) {
    if (el.type !== "way") continue;
    const pts = geomsToLocal(el);
    if (pts.length < 2) continue;
    const hw = (el.tags?.highway as string) || "residential";
    roads.push({
      pts: simplify(pts, 90),
      width: ROAD_WIDTH[hw] ?? 3,
      major: ROAD_MAJOR.test(hw),
    });
  }
  // 2) dense local streets for Manhattan (the famous grid) — real geometry
  const localQ = `[out:json][timeout:60];way["highway"~"tertiary|residential|unclassified|service|living_street"](bbox:${MANHATTAN_BBOX});out geom;`;
  const localEl = await fetchOverpass(localQ);
  for (const el of localEl) {
    if (el.type !== "way") continue;
    const pts = geomsToLocal(el);
    if (pts.length < 2) continue;
    const hw = (el.tags?.highway as string) || "residential";
    roads.push({
      pts: simplify(pts, 90),
      width: ROAD_WIDTH[hw] ?? 3,
      major: ROAD_MAJOR.test(hw),
    });
  }
  return roads;
}

/* ---------- BUILDINGS (real footprints + real heights) ---------- */
function parseHeight(tags: any): number | null {
  if (!tags) return null;
  const h = tags.height;
  if (typeof h === "string") {
    const m = h.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
    if (m) {
      const v = parseFloat(m[1]);
      if (v >= 2) return v;
    }
  }
  const lv = tags["building:levels"];
  if (lv) {
    const n = parseInt(String(lv).replace(/\D/g, ""), 10);
    if (n > 0) return n * 3.2; // ~3.2m per storey
  }
  return null;
}

/** Oriented bounding box of a polygon (approx, from its two furthest vertices). */
function obb(pts: [number, number][]): { x: number; z: number; w: number; d: number; rot: number } | null {
  const n = pts.length;
  if (n < 3) return null;
  let best = -1, ai = 0, bi = 1;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const dx = pts[i][0] - pts[j][0], dz = pts[i][1] - pts[j][1];
    const d = dx * dx + dz * dz;
    if (d > best) { best = d; ai = i; bi = j; }
  }
  let ax = pts[bi][0] - pts[ai][0], az = pts[bi][1] - pts[ai][1];
  const alen = Math.hypot(ax, az);
  if (alen < 0.001) return null;
  ax /= alen; az /= alen;
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const p of pts) {
    const u = p[0] * ax + p[1] * az;
    const v = p[0] * -az + p[1] * ax;
    if (u < minU) minU = u; if (u > maxU) maxU = u;
    if (v < minV) minV = v; if (v > maxV) maxV = v;
  }
  const cu = (minU + maxU) / 2, cv = (minV + maxV) / 2;
  const cx = cu * ax + cv * -az;
  const cz = cu * az + cv * ax;
  return { x: cx, z: cz, w: maxU - minU, d: maxV - minV, rot: Math.atan2(ax, az) };
}

async function fetchBuildings(): Promise<Building[]> {
  const seen = new Set<number>();
  const out: Building[] = [];
  // Fetch per borough so each request stays reasonable.
  for (const [, bbox] of BOROUGHS) {
    const q = `[out:json][timeout:75];(` +
      `way["building"]["building:levels"](bbox:${bbox});` +
      `way["building"]["height"](bbox:${bbox});` +
      `);out geom;`;
    const els = await fetchOverpass(q);
    for (const el of els) {
      if (el.type !== "way" || seen.has(el.id)) continue;
      const h = parseHeight(el.tags);
      if (!h) continue;
      seen.add(el.id);
      const pts = geomsToLocal(el);
      const box = obb(pts);
      if (!box) continue;
      if (box.w < 1 || box.d < 1) continue;
      out.push({ x: box.x, z: box.z, w: box.w, d: box.d, rot: box.rot, h });
    }
    // keep each fetch from getting too huge / slow
    if (out.length > 120000) break;
  }
  return out;
}

/* ---------- WATER ---------- */
async function fetchWater(): Promise<WaterPoly[]> {
  const q = `[out:json][timeout:60];` +
    `(way["natural"="water"](bbox:${NYC_BBOX});` +
    `way["waterway"="riverbank"](bbox:${NYC_BBOX});` +
    `relation["natural"="water"](bbox:${NYC_BBOX});` +
    `relation["waterway"="riverbank"](bbox:${NYC_BBOX});` +
    `);out geom;`;
  const els = await fetchOverpass(q);
  const polys: WaterPoly[] = [];
  for (const el of els) {
    if (el.type !== "way" && el.type !== "relation") continue;
    const pts = geomsToLocal(el);
    if (pts.length < 4) continue;
    const simplified = simplify(pts, 140);
    if (simplified.length >= 3) polys.push({ pts: [simplified] });
  }
  return polys;
}

/* ---------- PARKS / GREENS ---------- */
async function fetchGreens(): Promise<GreenPoly[]> {
  const q = `[out:json][timeout:60];` +
    `(way["leisure"="park"](bbox:${NYC_BBOX});` +
    `way["landuse"="grass"](bbox:${NYC_BBOX});` +
    `way["landuse"="forest"](bbox:${NYC_BBOX});` +
    `way["natural"="wood"](bbox:${NYC_BBOX});` +
    `way["landuse"="recreation_ground"](bbox:${NYC_BBOX});` +
    `);out geom;`;
  const els = await fetchOverpass(q);
  const polys: GreenPoly[] = [];
  for (const el of els) {
    if (el.type !== "way") continue;
    const pts = geomsToLocal(el);
    if (pts.length < 4) continue;
    polys.push({ pts: [simplify(pts, 120)] });
  }
  return polys;
}

/* ---------- MAIN ---------- */
export async function fetchNycRealData(onStage?: (msg: string) => void): Promise<NycResult> {
  const result: NycResult = { roads: [], buildings: [], water: [], greens: [], ok: true };
  let anyFail = false;
  const mark = (m: string) => { try { onStage?.(m); } catch { /* noop */ } };

  try {
    mark("جلب المياه/الشواطئ…");
    result.water = await fetchWater();
  } catch { anyFail = true; result.water = []; }

  try {
    mark("جلب الشوارع الحقيقية…");
    result.roads = await fetchRoads();
  } catch { anyFail = true; result.roads = []; }

  try {
    mark("جلب مباني نيويورك الحقيقية (5 أحياء)…");
    result.buildings = await fetchBuildings();
  } catch { anyFail = true; result.buildings = []; }

  try {
    mark("جلب الحدائق والمساحات الخضراء…");
    result.greens = await fetchGreens();
  } catch { anyFail = true; result.greens = []; }

  result.ok = !anyFail;
  if (result.roads.length === 0 && result.buildings.length === 0) {
    result.message = "لم تتوفر بيانات حية الآن — تحقق من اتصال الإنترنت.";
  }
  return result;
}
