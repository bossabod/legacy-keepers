/* ============================================================
   city-intel.ts — Road-network-driven urban intelligence overlay
   data for the Network map.

   Instead of random circles/blobs, everything is derived from a
   procedurally-generated ROAD NETWORK per city:

     • road density & intersection density  → deep-red urban heat
     • very low density / open land         → soft amber (low activity)
     • coastal / water side                 → navy blue (deep) + lighter
                                             shallow coastal band
     • mountain regions (per-city)          → dark military green

   All coordinates are geographic (lat/lon) so every element is a
   georeferenced map layer that pans/zooms with the map and loads only
   for the active city. Deterministic per city (seeded) → each city has
   a unique, stable pattern.
   ============================================================ */

export interface CityBound {
  id: string;
  name: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
}

export interface RoadSeg {
  pts: [number, number][];  // [lat, lon]
  kind: "arterial" | "secondary" | "local";
}

export interface HeatCell {
  lat: number;
  lon: number;
  dLat: number;
  dLon: number;
  density: number;   // 0..1 road+intersection density
  zone: "core" | "medium" | "low" | "sparse";
}

export interface WaterBand {
  lat: number;
  lon: number;
  dLat: number;
  dLon: number;
  deep: boolean;
}

export interface MountainZone {
  lat: number;
  lon: number;
  dLat: number;
  dLon: number;
}

export interface IntelNode {
  lat: number;
  lon: number;
  weight: number; // 0..1 — downtown>financial>few industrial
}

export interface CityIntel {
  roads: RoadSeg[];
  cells: HeatCell[];
  water: WaterBand[];
  mountains: MountainZone[];
  nodes: IntelNode[];
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Seed derived from city id → unique, stable pattern per city. */
function seedOf(id: string) {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0;
  return s;
}

/* Does the city sit on a coast / water? (by name) → water side bearing. */
function waterSide(id: string): "n" | "s" | "e" | "w" | "ne" | "se" | null {
  const n = id.toLowerCase();
  if (["nyc", "syd", "sao", "bom", "dxb", "cai"].includes(n)) return "e";
  if (["la", "sf", "par"].includes(n)) return null;
  if (n === "ist") return "n";
  if (n === "lon") return "s";
  if (n === "sgp") return "s";
  if (n === "tyo") return "e";
  return null;
}
/* Mountains near this city? (by name) */
function mountainCorner(id: string): "n" | "w" | "ne" | null {
  const n = id.toLowerCase();
  if (n === "la") return "n";
  if (n === "sao") return "w";
  if (n === "bom") return "ne";
  if (n === "tyo") return "w";
  return null;
}

export function buildCityIntel(city: CityBound): CityIntel {
  const rnd = mulberry(seedOf(city.id) + 0x51);
  const [[swLat, swLon], [neLat, neLon]] = city.bounds;
  const cLat = (swLat + neLat) / 2, cLon = (swLon + neLon) / 2;
  const latSpan = Math.max(0.06, neLat - swLat);
  const lonSpan = Math.max(0.08, neLon - swLon);

  /* ---------------- ROAD NETWORK ---------------- */
  // downtown occupies inner ~55%; spacing tightens toward centre.
  const downtown = { lat: cLat, lon: cLon, rLat: latSpan * 0.30, rLon: lonSpan * 0.30 };
  const roads: RoadSeg[] = [];

  // horizontal arterial streets
  const nHor = 9;
  for (let i = 0; i < nHor; i++) {
    const f = i / (nHor - 1);
    // bias lines toward centre (log spacing) so downtown is denser
    const b = Math.pow(Math.abs(2 * f - 1), 1.4);
    const lat = cLat + (2 * f - 1) * (latSpan / 2) * (0.55 + b * 0.6);
    const kind: RoadSeg["kind"] = i % 3 === 0 ? "arterial" : i % 2 === 0 ? "secondary" : "local";
    roads.push({ pts: [[lat, swLon], [lat, neLon]], kind });
  }
  // vertical streets
  const nVer = 11;
  for (let i = 0; i < nVer; i++) {
    const f = i / (nVer - 1);
    const b = Math.pow(Math.abs(2 * f - 1), 1.4);
    const lon = cLon + (2 * f - 1) * (lonSpan / 2) * (0.5 + b * 0.6);
    const kind: RoadSeg["kind"] = i % 3 === 0 ? "arterial" : i % 2 === 0 ? "secondary" : "local";
    roads.push({ pts: [[swLat, lon], [neLat, lon]], kind });
  }
  // a few diagonal connectors through downtown
  for (let k = 0; k < 4; k++) {
    const a = k % 2;
    const p1: [number, number] = [downtown.lat + (a ? -1 : 1) * downtown.rLat, downtown.lon + (a ? 1 : -1) * downtown.rLon];
    const p2: [number, number] = [downtown.lat + (a ? 1 : -1) * downtown.rLat, downtown.lon + (a ? -1 : 1) * downtown.rLon];
    roads.push({ pts: [p1, p2], kind: "secondary" });
  }

  /* ---------------- DENSITY GRID (from road network) ---------------- */
  const GRID = 16;
  const cells: HeatCell[] = [];
  const cellLat = latSpan / GRID;
  const cellLon = lonSpan / GRID;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const lat0 = swLat + r * cellLat, lon0 = swLon + c * cellLon;
      const lat1 = lat0 + cellLat, lon1 = lon0 + cellLon;
      // count road length inside cell + intersections
      let len = 0, inter = 0;
      for (const road of roads) {
        for (const [pl, pn] of road.pts.slice(0, -1).map((p, i) => [p, road.pts[i + 1]] as const)) {
          // axis-aligned segments → clip along axis
          const lo = Math.min(pl[0], pn[0]), hi = Math.max(pl[0], pn[0]);
          const llo = Math.min(pl[1], pn[1]), lhi = Math.max(pl[1], pn[1]);
          // horizontal line (constant lat): intersects cell if lat in range
          if (Math.abs(llo - lhi) < 1e-9) {
            const lat = pl[0];
            if (lat >= lat0 && lat < lat1) {
              const o = Math.max(lon0, llo), o2 = Math.min(lon1, lhi);
              if (o2 > o) len += (o2 - o);
            }
          } else if (Math.abs(lo - hi) < 1e-9) {
            const lon = pl[1];
            if (lon >= lon0 && lon < lon1) {
              const o = Math.max(lat0, lo), o2 = Math.min(lat1, hi);
              if (o2 > o) len += (o2 - o);
            }
          }
        }
      }
      // road density normalized
      const diag = Math.hypot(cellLat, cellLon);
      const density = Math.min(1, len / diag);
      let zone: HeatCell["zone"];
      if (density > 0.5) zone = "core";
      else if (density > 0.28) zone = "medium";
      else if (density > 0.1) zone = "low";
      else zone = "sparse";
      cells.push({ lat: lat0, lon: lon0, dLat: cellLat, dLon: cellLon, density, zone });
    }
  }

  /* ---------------- WATER (coastal) ---------------- */
  const water: WaterBand[] = [];
  const ws = waterSide(city.id);
  if (ws) {
    const band = Math.max(cellLat, cellLon) * 2;
    if (ws === "n") { water.push({ lat: neLat - band, lon: swLon, dLat: band, dLon: lonSpan, deep: false }); }
    else if (ws === "s") { water.push({ lat: swLat, lon: swLon, dLat: band, dLon: lonSpan, deep: false }); }
    else if (ws === "e") { water.push({ lat: swLat, lon: neLon - band, dLat: latSpan, dLon: band, deep: false }); }
    else if (ws === "w") { water.push({ lat: swLat, lon: swLon, dLat: latSpan, dLon: band, deep: false }); }
    else if (ws === "ne") { water.push({ lat: cLat, lon: cLon, dLat: latSpan * 0.55, dLon: lonSpan * 0.55, deep: false }); }
    else if (ws === "se") { water.push({ lat: cLat, lon: cLon, dLat: latSpan * 0.55, dLon: lonSpan * 0.55, deep: false }); }
    // deep band beyond
    const db = band * 1.6;
    if (ws === "e") water.push({ lat: swLat, lon: neLon, dLat: latSpan, dLon: db, deep: true });
    if (ws === "n") water.push({ lat: neLat, lon: swLon, dLat: db, dLon: lonSpan, deep: true });
    if (ws === "s") water.push({ lat: swLat - db, lon: swLon, dLat: db, dLon: lonSpan, deep: true });
    if (ws === "w") water.push({ lat: swLat, lon: swLon - db, dLat: latSpan, dLon: db, deep: true });
  }

  /* ---------------- MOUNTAINS ---------------- */
  const mountains: MountainZone[] = [];
  const mc = mountainCorner(city.id);
  if (mc) {
    const z = { lat: 0, lon: 0, dLat: latSpan * 0.4, dLon: lonSpan * 0.4 };
    if (mc === "n") { z.lat = neLat - z.dLat; z.lon = swLon + lonSpan * 0.3; }
    else if (mc === "w") { z.lat = swLat + latSpan * 0.2; z.lon = swLon; }
    else if (mc === "ne") { z.lat = cLat; z.lon = cLon; }
    mountains.push(z);
  }

  /* ---------------- INTELLIGENCE NODES (reduced ~70%, non-uniform) ---------------- */
  // distribution driven by road density & downtown proximity
  const nodes: IntelNode[] = [];
  const TARGET = Math.round(520 * 0.30); // ~156 → ~70% fewer
  let tries = 0;
  while (nodes.length < TARGET && tries < TARGET * 40) {
    tries++;
    const r = rnd(), a = rnd() * Math.PI * 2;
    const ring = Math.pow(r, 0.5);
    const lat = cLat + Math.cos(a) * (latSpan / 2) * ring;
    const lon = cLon + Math.sin(a) * (lonSpan / 2) * ring;
    // find cell density
    const ci = Math.min(GRID - 1, Math.max(0, Math.floor((lat - swLat) / cellLat)));
    const cj = Math.min(GRID - 1, Math.max(0, Math.floor((lon - swLon) / cellLon)));
    const cell = cells[ci * GRID + cj];
    if (!cell) continue;
    // acceptance probability: dense areas attract nodes, sparse repel
    const downtownFactor = 1 - Math.min(1, ring * 1.4);
    const p = cell.density * 0.9 + downtownFactor * 0.25;
    if (rnd() < p) {
      nodes.push({ lat, lon, weight: cell.density * 0.6 + downtownFactor * 0.4 });
    }
  }

  return { roads, cells, water, mountains, nodes };
}
