/* ============================================================
   city-nodes.ts — white intelligence nodes per city.

   Logical placement only (never random): downtown, business
   district, port, airport, university, government quarter,
   technology park, financial centre, major intersections.

   Larger cities get more nodes, smaller cities fewer. Each city
   has its own deterministic pattern (seeded). All coordinates are
   geographic so nodes are georeferenced Leaflet markers that pan,
   zoom and scale with the map.
   ============================================================ */

export interface IntelNode {
  lat: number;
  lon: number;
  weight: number; // 0..1 → affects size slightly
  isHub?: boolean;      // priority hub node (1–2 per city)
  hubRed?: boolean;     // occasionally a hub is deep red
}

interface CitySpec {
  id: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
}

/* Deterministic PRNG. */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(id: string) {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0;
  return s;
}

/* Relative zone anchors around the city centre, as [dx, dy] in
   units of the city's lat/lon span. Sign varies per city. */
const ZONES: [number, number][] = [
  [0, 0],          // downtown
  [0.06, 0.08],    // business district
  [-0.08, 0.1],    // port / waterfront
  [0.1, -0.12],    // airport
  [-0.05, -0.12],  // university
  [0.04, -0.05],   // government quarter
  [-0.12, 0.05],   // technology park
  [0.12, 0.12],    // financial centre
];

/* Base node count by city tier. */
function tierCount(id: string): number {
  const majors = ["nyc", "lon", "ist", "tyo", "par", "bom", "sao", "ruh", "dxb", "sgp", "la", "chi", "syd", "cai", "bkk"];
  const mids = ["sf", "sea", "mia", "dc", "tor", "van", "mel", "bne", "kula", "jak", "soul", "mex", "frank", "muni", "berl", "madr", "mila", "rome", "stock", "oslo", "man", "jedd", "auh", "cairo"];
  if (majors.includes(id)) return 16;
  if (mids.includes(id)) return 11;
  return 7;
}

/**
 * Generate logical white intelligence nodes for a city.
 * Nodes are clustered around logical zones, with jitter so a city
 * reads as a distinct pattern; larger cities → more nodes.
 */
export function generateCityNodes(city: CitySpec): IntelNode[] {
  const rnd = mulberry(seedOf(city.id) + 0x1c7);
  const [[swLat, swLon], [neLat, neLon]] = city.bounds;
  const cLat = (swLat + neLat) / 2;
  const cLon = (swLon + neLon) / 2;
  const latSpan = Math.max(0.06, neLat - swLat);
  const lonSpan = Math.max(0.08, neLon - swLon);

  const count = tierCount(city.id);
  const nodes: IntelNode[] = [];

  // pick a random-ish subset ordering of zones (per-city permutation)
  const order = ZONES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const result: IntelNode[] = [];
  for (let n = 0; n < count; n++) {
    const zone = order[n % order.length];
    const [dx, dy] = ZONES[zone];
    // deterministic jitter within a small radius around the zone anchor
    const jr = 0.012 + rnd() * 0.028;
    const ja = rnd() * Math.PI * 2;
    const lat = cLat + dx * latSpan + Math.cos(ja) * jr * latSpan;
    const lon = cLon + dy * lonSpan + Math.sin(ja) * jr * lonSpan;
    // clamp into bounds
    const clat = Math.max(swLat + 0.002, Math.min(neLat - 0.002, lat));
    const clon = Math.max(swLon + 0.002, Math.min(neLon - 0.002, lon));
    // downtown & finance nodes weigh higher (slightly larger)
    const weight = zone === 0 || zone === 7 ? 0.9 : zone === 1 || zone === 3 ? 0.7 : 0.5;
    result.push({ lat: clat, lon: clon, weight });
  }

  // 1–2 priority hub nodes per city — downtown / business / financial only,
  // noticeably larger. One is occasionally deep red (#b32020).
  const hubCount = count >= 16 ? 2 : 1;
  const hubCandidates = result
    .map((n, i) => ({ n, i }))
    .filter(({ n }) => n.weight >= 0.7)
    .sort((a, b) => a.i - b.i);
  for (let h = 0; h < Math.min(hubCount, hubCandidates.length); h++) {
    const c = hubCandidates[h];
    c.n.isHub = true;
    // ~25% chance one hub is deep red; never two red in the same city
    c.n.hubRed = h === 0 && rnd() < 0.25;
  }

  return result;
}
