/* ============================================================
   osm-roads.ts — جلب هندسة الشوارع الحقيقية من OpenStreetMap
   Fetch REAL street geometry from OpenStreetMap (Overpass API) for
   a given city bounding box, then classify and simplify it into the
   same RoadSeg shape used by the intelligence overlay.

   Because the base map is a raster tile layer (streets are pixels,
   not vector data), this is the correct way to obtain real street
   geometry. The base map image is never touched — the fetched roads
   are rendered as georeferenced overlay layers above it.

   Network call happens client-side (in the viewer's browser). On any
   failure we fall back to the procedural road network so the map
   always works.
   ============================================================ */

export type RoadClass = "arterial" | "secondary" | "local";

export interface OsmRoad {
  pts: [number, number][]; // [lat, lon]
  kind: RoadClass;
  name?: string;
}

export interface OsmResult {
  ok: boolean;
  roads: OsmRoad[];
  nodeCount: number;
  message?: string;
}

/* Overpass endpoints — tried in order, with failover. */
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const HIGHWAY_PATTERNS: Record<RoadClass, RegExp> = {
  arterial: /motorway|trunk|primary/,
  secondary: /secondary|tertiary/,
  local: /residential|unclassified|service|living_street/,
};

function classify(highway: string): RoadClass {
  if (HIGHWAY_PATTERNS.arterial.test(highway)) return "arterial";
  if (HIGHWAY_PATTERNS.secondary.test(highway)) return "secondary";
  if (HIGHWAY_PATTERNS.local.test(highway)) return "local";
  return "local";
}

/* Simplify a polyline using Douglas–Peucker-ish stride sampling. */
function simplify(pts: [number, number][], maxPoints: number): [number, number][] {
  if (pts.length <= maxPoints) return pts;
  const out: [number, number][] = [];
  const stride = Math.max(1, Math.floor(pts.length / maxPoints));
  for (let i = 0; i < pts.length; i += stride) out.push(pts[i]);
  if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
  return out;
}

/* Build the Overpass query for real road ways in a bounding box. */
function buildQuery(bbox: string): string {
  return `[out:json][timeout:25];
(
  way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street"](bbox:${bbox});
);
out geom;`;
}

/* Parse Overpass response elements into OsmRoad[]. */
function parseResponse(data: any): OsmRoad[] {
  if (!data || !Array.isArray(data.elements)) return [];
  const roads: OsmRoad[] = [];
  for (const el of data.elements) {
    if (el.type !== "way" || !Array.isArray(el.geometry)) continue;
    const kind = classify(el.tags?.highway ?? "residential");
    const pts: [number, number][] = el.geometry.map((g: any) => [g.lat, g.lon] as [number, number]);
    if (pts.length < 2) continue;
    // drop geometry longer than ~140 points per road (LOD/perf)
    roads.push({ pts: simplify(pts, 140), kind, name: el.tags?.name });
  }
  return roads;
}

/**
 * Fetch real streets for a city bounding box.
 * Tries Overpass endpoints in order with a short timeout.
 */
export async function fetchOsmRoads(bounds: [[number, number], [number, number]]): Promise<OsmResult> {
  const [[swLat, swLon], [neLat, neLon]] = bounds;
  // Overpass bbox format: south, west, north, east
  const bbox = `${swLat.toFixed(5)},${swLon.toFixed(5)},${neLat.toFixed(5)},${neLon.toFixed(5)}`;
  const query = buildQuery(bbox);

  for (const ep of ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 18000);
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      const roads = parseResponse(data);
      if (roads.length > 0) {
        return { ok: true, roads, nodeCount: roads.length };
      }
    } catch (e) {
      // try next endpoint
    }
  }
  return { ok: false, roads: [], nodeCount: 0, message: "OSM unavailable" };
}
