/* ============================================================
   vector-cities.ts — مدن الشبكة للخريطة المتجهة (MapLibre)
   Strategic cities + the white intelligence-node field per city.
   Coordinates are geographic; nodes are seeded per city so each
   city has a stable, unique pattern. Larger cities → more nodes.
   ============================================================ */

export interface VCity {
  id: string;
  name: string;
  country: string;
  flag: string;
  center: [number, number]; // [lat, lon]
  zoom: number;
  bbox: [[number, number], [number, number]]; // [[swLat,swLon],[neLat,neLon]]
  tier: number; // 0 major, 1 mid, 2 small
}

export const VCITIES: VCity[] = [
  { id: "nyc", name: "New York", country: "United States", flag: "🇺🇸", center: [40.7589, -73.9851], zoom: 12.2, bbox: [[40.47, -74.25], [40.92, -73.7]], tier: 0 },
  { id: "lon", name: "London", country: "United Kingdom", flag: "🇬🇧", center: [51.5074, -0.1278], zoom: 12.2, bbox: [[51.32, -0.51], [51.68, 0.28]], tier: 0 },
  { id: "par", name: "Paris", country: "France", flag: "🇫🇷", center: [48.8566, 2.3522], zoom: 12.2, bbox: [[48.72, 2.22], [49.0, 2.52]], tier: 0 },
  { id: "ist", name: "Istanbul", country: "Türkiye", flag: "🇹🇷", center: [41.0082, 28.9784], zoom: 12.2, bbox: [[40.92, 28.85], [41.15, 29.15]], tier: 0 },
  { id: "dxb", name: "Dubai", country: "United Arab Emirates", flag: "🇦🇪", center: [25.2048, 55.2708], zoom: 12.2, bbox: [[25.0, 55.05], [25.42, 55.42]], tier: 0 },
  { id: "ruh", name: "Riyadh", country: "Saudi Arabia", flag: "🇸🇦", center: [24.7136, 46.6753], zoom: 12.2, bbox: [[24.55, 46.52], [24.9, 46.85]], tier: 0 },
  { id: "tyo", name: "Tokyo", country: "Japan", flag: "🇯🇵", center: [35.6762, 139.6503], zoom: 12.2, bbox: [[35.55, 139.5], [35.85, 139.9]], tier: 0 },
  { id: "sgp", name: "Singapore", country: "Singapore", flag: "🇸🇬", center: [1.3521, 103.8198], zoom: 12.4, bbox: [[1.24, 103.67], [1.48, 103.98]], tier: 0 },
  { id: "syd", name: "Sydney", country: "Australia", flag: "🇦🇺", center: [-33.8688, 151.2093], zoom: 12.2, bbox: [[-33.98, 151.1], [-33.7, 151.35]], tier: 0 },
  { id: "bom", name: "Mumbai", country: "India", flag: "🇮🇳", center: [19.076, 72.8777], zoom: 12.2, bbox: [[18.9, 72.8], [19.28, 72.98]], tier: 0 },
  { id: "cai", name: "Cairo", country: "Egypt", flag: "🇪🇬", center: [30.0444, 31.2357], zoom: 12.2, bbox: [[29.94, 31.1], [30.15, 31.35]], tier: 0 },
  { id: "la", name: "Los Angeles", country: "United States", flag: "🇺🇸", center: [34.0522, -118.2437], zoom: 12.2, bbox: [[33.9, -118.45], [34.2, -118.05]], tier: 0 },
  { id: "chi", name: "Chicago", country: "United States", flag: "🇺🇸", center: [41.8781, -87.6298], zoom: 12.2, bbox: [[41.72, -87.75], [42.0, -87.5]], tier: 0 },
  { id: "sao", name: "São Paulo", country: "Brazil", flag: "🇧🇷", center: [-23.5505, -46.6333], zoom: 12.2, bbox: [[-23.65, -46.7], [-23.45, -46.55]], tier: 0 },
  { id: "bkk", name: "Bangkok", country: "Thailand", flag: "🇹🇭", center: [13.7563, 100.5018], zoom: 12.2, bbox: [[13.65, 100.42], [13.9, 100.62]], tier: 0 },
  { id: "tor", name: "Toronto", country: "Canada", flag: "🇨🇦", center: [43.6532, -79.3832], zoom: 12.2, bbox: [[43.57, -79.5], [43.75, -79.25]], tier: 1 },
  { id: "mad", name: "Madrid", country: "Spain", flag: "🇪🇸", center: [40.4168, -3.7038], zoom: 12.2, bbox: [[40.3, -3.8], [40.5, -3.55]], tier: 1 },
  { id: "rom", name: "Rome", country: "Italy", flag: "🇮🇹", center: [41.9028, 12.4964], zoom: 12.2, bbox: [[41.8, 12.38], [42.0, 12.6]], tier: 1 },
  { id: "ber", name: "Berlin", country: "Germany", flag: "🇩🇪", center: [52.52, 13.405], zoom: 12.2, bbox: [[52.42, 13.28], [52.6, 13.52]], tier: 1 },
  { id: "zrh", name: "Zurich", country: "Switzerland", flag: "🇨🇭", center: [47.3769, 8.5417], zoom: 12.4, bbox: [[47.3, 8.44], [47.45, 8.64]], tier: 1 },
  { id: "aml", name: "Amsterdam", country: "Netherlands", flag: "🇳🇱", center: [52.3676, 4.9041], zoom: 12.4, bbox: [[52.3, 4.78], [52.42, 4.98]], tier: 1 },
  { id: "stock", name: "Stockholm", country: "Sweden", flag: "🇸🇪", center: [59.3293, 18.0686], zoom: 12.2, bbox: [[59.23, 18.0], [59.42, 18.18]], tier: 1 },
  { id: "mel", name: "Melbourne", country: "Australia", flag: "🇦🇺", center: [-37.8136, 144.9631], zoom: 12.2, bbox: [[-37.9, 144.85], [-37.7, 145.05]], tier: 1 },
  { id: "soul", name: "Seoul", country: "South Korea", flag: "🇰🇷", center: [37.5665, 126.978], zoom: 12.2, bbox: [[37.45, 126.85], [37.68, 127.12]], tier: 0 },
  { id: "del", name: "Delhi", country: "India", flag: "🇮🇳", center: [28.7041, 77.1025], zoom: 12.2, bbox: [[28.5, 77.0], [28.85, 77.25]], tier: 1 },
];

export const VCOUNTRIES = Array.from(new Set(VCITIES.map(c => c.country)));

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

export interface VNode {
  lat: number;
  lon: number;
  weight: number;
  isHub?: boolean;
  hubRed?: boolean;
}

/* Logical zones around the city centre: downtown, business, port,
   airport, university, government, tech park, financial. */
const ZONES: [number, number][] = [
  [0, 0], [0.05, 0.07], [-0.07, 0.09], [0.09, -0.11],
  [-0.04, -0.11], [0.03, -0.04], [-0.11, 0.04], [0.11, 0.11],
];

function tierCount(tier: number): number {
  if (tier === 0) return 18;
  if (tier === 1) return 12;
  return 8;
}

/** Deterministic white intelligence nodes for a city. */
export function vNodesFor(city: VCity): VNode[] {
  const rnd = mulberry(seedOf(city.id) + 0x2a9);
  const [[swLat, swLon], [neLat, neLon]] = city.bbox;
  const cLat = (swLat + neLat) / 2, cLon = (swLon + neLon) / 2;
  const latSpan = Math.max(0.06, neLat - swLat);
  const lonSpan = Math.max(0.08, neLon - swLon);

  const count = tierCount(city.tier);
  const out: VNode[] = [];
  const order = ZONES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let n = 0; n < count; n++) {
    const zone = order[n % order.length];
    const [dx, dy] = ZONES[zone];
    const jr = 0.012 + rnd() * 0.03;
    const ja = rnd() * Math.PI * 2;
    const lat = cLat + dx * latSpan + Math.cos(ja) * jr * latSpan;
    const lon = cLon + dy * lonSpan + Math.sin(ja) * jr * lonSpan;
    const clat = Math.max(swLat + 0.002, Math.min(neLat - 0.002, lat));
    const clon = Math.max(swLon + 0.002, Math.min(neLon - 0.002, lon));
    const weight = zone === 0 || zone === 7 ? 0.9 : zone === 1 || zone === 3 ? 0.7 : 0.5;
    out.push({ lat: clat, lon: clon, weight });
  }
  // 1–2 hubs; occasionally one deep red
  const hubs = out.filter(n => n.weight >= 0.7).slice(0, city.tier === 0 ? 2 : 1);
  hubs.forEach((n, h) => {
    n.isHub = true;
    n.hubRed = h === 0 && rnd() < 0.25;
  });
  return out;
}

/** Pair each node with ONE nearby node → small local mesh. */
export function vLinksFor(nodes: VNode[]): [number, number][] {
  const links: [number, number][] = [];
  const used = new Set<number>();
  for (let i = 0; i < nodes.length; i++) {
    if (used.has(i)) continue;
    let best = -1, bestD = Infinity;
    for (let j = 0; j < nodes.length; j++) {
      if (j === i || used.has(j)) continue;
      const d = Math.hypot(nodes[i].lat - nodes[j].lat, nodes[i].lon - nodes[j].lon);
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best >= 0) { links.push([i, best]); used.add(i); used.add(best); }
  }
  return links;
}
