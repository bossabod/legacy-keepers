/* ============================================================
   street-map.ts — إجرائية: شبكة شوارع لكل مدينة (بلا CDN)
   Deterministic procedural street network per city so the map always
   shows streets — no dependency on external tiles. A subset of
   streets is flagged RED (the "highlighted" corridors).

   All coordinates are geographic [lat, lon]; rendered as georeferenced
   Leaflet polylines that pan/zoom with the map. Same seeded pattern per
   city → unique, stable layout.
   ============================================================ */

export interface Street {
  id: string;
  name: string;
  pts: [number, number][]; // [lat, lon]
  kind: "arterial" | "secondary" | "local";
  red: boolean; // highlight this street red
}

interface CitySpec {
  id: string;
  center: [number, number];
  bbox: [[number, number], [number, number]]; // [[swLat,swLon],[neLat,neLon]]
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
function seedOf(id: string) {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0;
  return s;
}

const STREET_NAMES = [
  "Meridian Ave", "Obsidian Rd", "Covenant St", "Silver Blvd", "Pillar Way",
  "Keystone Ln", "Aegis Avenue", "Halcyon Street", "Vantage Blvd", "Obelisk Rd",
  "Crest Avenue", "Signal Street", "Vesper Lane", "Atlas Blvd", "Lumen Road",
  "Ember Street", "Bastion Avenue", "Umbra Lane", "Monarch Blvd", "Sovereign Rd",
];

/** Generate a street network for a city. Red streets are a fixed subset
    of the arterial corridors (deterministic), so coloring is stable. */
export function generateStreets(city: CitySpec): Street[] {
  const rnd = mulberry(seedOf(city.id) + 0x5c3);
  const [[swLat, swLon], [neLat, neLon]] = city.bbox;
  const cLat = (swLat + neLat) / 2, cLon = (swLon + neLon) / 2;
  const latSpan = Math.max(0.06, neLat - swLat);
  const lonSpan = Math.max(0.08, neLon - swLon);

  const streets: Street[] = [];
  let n = 0;

  // horizontal streets (constant lat, slight curvature via jitter)
  const hCount = 9;
  for (let i = 0; i < hCount; i++) {
    const f = i / (hCount - 1);
    const b = Math.pow(Math.abs(2 * f - 1), 1.3);
    const lat = cLat + (2 * f - 1) * (latSpan / 2) * (0.5 + b * 0.55);
    const pts: [number, number][] = [];
    const segs = 10;
    for (let s = 0; s <= segs; s++) {
      const u = s / segs;
      const wob = Math.sin(u * Math.PI * 2 + i) * 0.004;
      pts.push([lat + wob, swLon + u * lonSpan]);
    }
    streets.push({
      id: `h${i}`,
      name: STREET_NAMES[n % STREET_NAMES.length],
      pts,
      kind: i % 3 === 0 ? "arterial" : i % 2 === 0 ? "secondary" : "local",
      red: false,
    });
    n++;
  }

  // vertical streets
  const vCount = 11;
  for (let i = 0; i < vCount; i++) {
    const f = i / (vCount - 1);
    const b = Math.pow(Math.abs(2 * f - 1), 1.3);
    const lon = cLon + (2 * f - 1) * (lonSpan / 2) * (0.5 + b * 0.55);
    const pts: [number, number][] = [];
    const segs = 10;
    for (let s = 0; s <= segs; s++) {
      const u = s / segs;
      const wob = Math.sin(u * Math.PI * 2 + i * 0.7) * 0.004;
      pts.push([swLat + u * latSpan, lon + wob]);
    }
    streets.push({
      id: `v${i}`,
      name: STREET_NAMES[n % STREET_NAMES.length],
      pts,
      kind: i % 3 === 0 ? "arterial" : i % 2 === 0 ? "secondary" : "local",
      red: false,
    });
    n++;
  }

  // a few diagonal connectors (arterial)
  for (let k = 0; k < 4; k++) {
    const a = k % 2;
    const p1: [number, number] = [cLat + (a ? -1 : 1) * latSpan * 0.42, cLon + (a ? 1 : -1) * lonSpan * 0.42];
    const p2: [number, number] = [cLat + (a ? 1 : -1) * latSpan * 0.42, cLon + (a ? -1 : 1) * lonSpan * 0.42];
    streets.push({
      id: `d${k}`,
      name: STREET_NAMES[n % STREET_NAMES.length],
      pts: [p1, p2],
      kind: "arterial",
      red: false,
    });
    n++;
  }

  // Mark a deterministic subset of arterials as RED (the highlighted
  // corridors). Deterministic based on seed so it's stable per city.
  const arterial = streets.filter(s => s.kind === "arterial");
  const redCount = Math.max(2, Math.min(4, arterial.length));
  for (let r = 0; r < redCount; r++) {
    const idx = Math.floor(rnd() * arterial.length);
    arterial[idx].red = true;
  }

  return streets;
}
