/* ============================================================
   network-map.ts — بيانات شبكة العمليات الدولية
   Global operations network data for the intelligence map.
   Fictional member nodes, city clusters, road classes and
   connection topology. Deterministic and bilingual-friendly.
   ============================================================ */

export type Region =
  | "NORTH AMERICA" | "SOUTH AMERICA" | "EUROPE"
  | "MIDDLE EAST" | "AFRICA" | "SOUTH ASIA"
  | "SOUTHEAST ASIA" | "EAST ASIA" | "OCEANIA";

export interface Cluster {
  city: string;
  country: string;
  region: Region;
  lat: number;
  lon: number;
  members: number;      // member count in this cluster
  hub?: boolean;        // is a global backbone hub
  major?: boolean;      // major metropolitan centre (density tint)
}

export const CLUSTERS: Cluster[] = [
  // North America
  { city: "New York", country: "United States", region: "NORTH AMERICA", lat: 40.7128, lon: -74.006, members: 3, hub: true, major: true },
  { city: "Los Angeles", country: "United States", region: "NORTH AMERICA", lat: 34.0522, lon: -118.2437, members: 2, major: true },
  { city: "San Francisco", country: "United States", region: "NORTH AMERICA", lat: 37.7749, lon: -122.4194, members: 2 },
  { city: "Chicago", country: "United States", region: "NORTH AMERICA", lat: 41.8781, lon: -87.6298, members: 1, major: true },
  { city: "Seattle", country: "United States", region: "NORTH AMERICA", lat: 47.6062, lon: -122.3321, members: 1 },
  { city: "Miami", country: "United States", region: "NORTH AMERICA", lat: 25.7617, lon: -80.1918, members: 1 },
  { city: "Washington", country: "United States", region: "NORTH AMERICA", lat: 38.9072, lon: -77.0369, members: 1 },
  { city: "Houston", country: "United States", region: "NORTH AMERICA", lat: 29.7604, lon: -95.3698, members: 1 },
  { city: "Toronto", country: "Canada", region: "NORTH AMERICA", lat: 43.6532, lon: -79.3832, members: 2 },
  { city: "Vancouver", country: "Canada", region: "NORTH AMERICA", lat: 49.2827, lon: -123.1207, members: 1 },
  { city: "Mexico City", country: "Mexico", region: "NORTH AMERICA", lat: 19.4326, lon: -99.1332, members: 2, major: true },
  // South America
  { city: "São Paulo", country: "Brazil", region: "SOUTH AMERICA", lat: -23.5505, lon: -46.6333, members: 2, hub: true, major: true },
  { city: "Rio de Janeiro", country: "Brazil", region: "SOUTH AMERICA", lat: -22.9068, lon: -43.1729, members: 1 },
  // Europe
  { city: "London", country: "United Kingdom", region: "EUROPE", lat: 51.5074, lon: -0.1278, members: 4, hub: true, major: true },
  { city: "Manchester", country: "United Kingdom", region: "EUROPE", lat: 53.4808, lon: -2.2426, members: 1 },
  { city: "Edinburgh", country: "United Kingdom", region: "EUROPE", lat: 55.9533, lon: -3.1883, members: 1 },
  { city: "Paris", country: "France", region: "EUROPE", lat: 48.8566, lon: 2.3522, members: 3, major: true },
  { city: "Berlin", country: "Germany", region: "EUROPE", lat: 52.52, lon: 13.405, members: 1 },
  { city: "Frankfurt", country: "Germany", region: "EUROPE", lat: 50.1109, lon: 8.6821, members: 2 },
  { city: "Munich", country: "Germany", region: "EUROPE", lat: 48.1351, lon: 11.582, members: 1 },
  { city: "Geneva", country: "Switzerland", region: "EUROPE", lat: 46.2044, lon: 6.1432, members: 2, major: true },
  { city: "Zurich", country: "Switzerland", region: "EUROPE", lat: 47.3769, lon: 8.5417, members: 1 },
  { city: "Milan", country: "Italy", region: "EUROPE", lat: 45.4642, lon: 9.19, members: 1 },
  { city: "Rome", country: "Italy", region: "EUROPE", lat: 41.9028, lon: 12.4964, members: 1 },
  { city: "Madrid", country: "Spain", region: "EUROPE", lat: 40.4168, lon: -3.7038, members: 1 },
  { city: "Barcelona", country: "Spain", region: "EUROPE", lat: 41.3851, lon: 2.1734, members: 1 },
  // Middle East & North Africa
  { city: "Istanbul", country: "Turkey", region: "MIDDLE EAST", lat: 41.0082, lon: 28.9784, members: 4, hub: true, major: true },
  { city: "Ankara", country: "Turkey", region: "MIDDLE EAST", lat: 39.9334, lon: 32.8597, members: 1 },
  { city: "Riyadh", country: "Saudi Arabia", region: "MIDDLE EAST", lat: 24.7136, lon: 46.6753, members: 4, hub: true, major: true },
  { city: "Jeddah", country: "Saudi Arabia", region: "MIDDLE EAST", lat: 21.4858, lon: 39.1925, members: 2 },
  { city: "Dubai", country: "UAE", region: "MIDDLE EAST", lat: 25.2048, lon: 55.2708, members: 3, hub: true, major: true },
  { city: "Abu Dhabi", country: "UAE", region: "MIDDLE EAST", lat: 24.4539, lon: 54.3773, members: 2 },
  { city: "Cairo", country: "Egypt", region: "MIDDLE EAST", lat: 30.0444, lon: 31.2357, members: 2, major: true },
  // Africa
  { city: "Johannesburg", country: "South Africa", region: "AFRICA", lat: -26.2041, lon: 28.0473, members: 2, hub: true },
  { city: "Cape Town", country: "South Africa", region: "AFRICA", lat: -33.9249, lon: 18.4241, members: 1 },
  // South Asia
  { city: "Mumbai", country: "India", region: "SOUTH ASIA", lat: 19.076, lon: 72.8777, members: 2, major: true },
  { city: "Delhi", country: "India", region: "SOUTH ASIA", lat: 28.7041, lon: 77.1025, members: 1 },
  { city: "Bengaluru", country: "India", region: "SOUTH ASIA", lat: 12.9716, lon: 77.5946, members: 1 },
  { city: "Karachi", country: "Pakistan", region: "SOUTH ASIA", lat: 24.8607, lon: 67.0011, members: 1 },
  { city: "Lahore", country: "Pakistan", region: "SOUTH ASIA", lat: 31.5204, lon: 74.3587, members: 1 },
  // Southeast Asia
  { city: "Singapore", country: "Singapore", region: "SOUTHEAST ASIA", lat: 1.3521, lon: 103.8198, members: 3, hub: true, major: true },
  { city: "Kuala Lumpur", country: "Malaysia", region: "SOUTHEAST ASIA", lat: 3.139, lon: 101.6869, members: 2 },
  { city: "Jakarta", country: "Indonesia", region: "SOUTHEAST ASIA", lat: -6.2088, lon: 106.8456, members: 2, major: true },
  { city: "Bangkok", country: "Thailand", region: "SOUTHEAST ASIA", lat: 13.7563, lon: 100.5018, members: 2, major: true },
  // East Asia
  { city: "Tokyo", country: "Japan", region: "EAST ASIA", lat: 35.6762, lon: 139.6503, members: 3, hub: true, major: true },
  { city: "Seoul", country: "South Korea", region: "EAST ASIA", lat: 37.5665, lon: 126.978, members: 2, major: true },
  // Oceania
  { city: "Sydney", country: "Australia", region: "OCEANIA", lat: -33.8688, lon: 151.2093, members: 2, hub: true, major: true },
  { city: "Melbourne", country: "Australia", region: "OCEANIA", lat: -37.8136, lon: 144.9631, members: 1 },
  { city: "Auckland", country: "New Zealand", region: "OCEANIA", lat: -36.8509, lon: 174.7645, members: 1 },
];

export interface Member {
  id: number;
  code: string;
  name: string;        // fictional codename
  region: Region;
  country: string;
  city: string;
  cluster: string;
  lat: number;
  lon: number;
  tier: number;        // 1..9
  status: "ACTIVE" | "STANDBY" | "SEALED";
  joined: string;
  projects: number;
  activity: number;    // 0..100
}

const CODENAMES = [
  "Falcon", "Onyx", "Meridian", "Aegis", "Cinder", "Sable", "Halcyon", "Vertex",
  "Lumen", "Atlas", "Nimbus", "Umbra", "Obelisk", "Raven", "Vantage", "Crest",
  "Drift", "Keystone", "Solstice", "Haven", "Pinnacle", "Signal", "Monarch",
  "Vesper", "Aurora", "Ember", "Gyre", "Niche", "Palladium", "Quietus",
  "Ridge", "Sovereign", "Tandem", "Umber", "Vanguard", "Wellspring", "Zephyr",
  "Axiom", "Bastion", "Citadel", "Dawn", "Epoch", "Fortress", "Guardian",
];

const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const STATUSES: Member["status"][] = ["ACTIVE", "ACTIVE", "ACTIVE", "STANDBY", "SEALED"];

/** Deterministic RNG so member data is stable across renders/languages. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function countryCode(country: string): string {
  const map: Record<string, string> = {
    "United States": "USA", "Canada": "CAN", "Mexico": "MEX", "Brazil": "BRA",
    "United Kingdom": "GBR", "France": "FRA", "Germany": "DEU", "Switzerland": "CHE",
    "Italy": "ITA", "Spain": "ESP", "Turkey": "TUR", "Saudi Arabia": "SAU",
    "UAE": "ARE", "Egypt": "EGY", "South Africa": "ZAF", "India": "IND",
    "Pakistan": "PAK", "Singapore": "SGP", "Malaysia": "MYS", "Indonesia": "IDN",
    "Thailand": "THA", "Japan": "JPN", "South Korea": "KOR", "Australia": "AUS",
    "New Zealand": "NZL",
  };
  return map[country] ?? "OOI";
}

export const MEMBERS: Member[] = (() => {
  const rand = rng(0x19f4_2a);
  const list: Member[] = [];
  let id = 0;
  for (const cl of CLUSTERS) {
    const cc = countryCode(cl.country);
    for (let k = 0; k < cl.members; k++) {
      // small jitter around the city centre so a cluster is a spread of nodes
      const jr = 0.6 + rand() * 1.4; // degrees
      const ja = rand() * Math.PI * 2;
      const lat = Math.max(-60, Math.min(70, cl.lat + Math.cos(ja) * jr));
      const lon = cl.lon + Math.sin(ja) * jr * 1.4;
      const tier = RANKS[Math.floor(rand() * RANKS.length)];
      list.push({
        id,
        code: `${cc}-${String(cl.members).padStart(2, "0")}${String(k + 1).padStart(2, "0")}`,
        name: CODENAMES[(id + Math.floor(rand() * 3)) % CODENAMES.length],
        region: cl.region,
        country: cl.country,
        city: cl.city,
        cluster: cl.city,
        lat,
        lon,
        tier,
        status: STATUSES[Math.floor(rand() * STATUSES.length)],
        joined: `${2013 + Math.floor(rand() * 14)}`,
        projects: Math.floor(rand() * 9),
        activity: Math.floor(20 + rand() * 80),
      });
      id++;
    }
  }
  return list;
})();

export const TOTAL_MEMBERS = MEMBERS.length;

/** Region short labels for the panel. */
export const REGION_LABEL: Record<Region, { en: string; ar: string }> = {
  "NORTH AMERICA": { en: "North America", ar: "أمريكا الشمالية" },
  "SOUTH AMERICA": { en: "South America", ar: "أمريكا الجنوبية" },
  EUROPE: { en: "Europe", ar: "أوروبا" },
  "MIDDLE EAST": { en: "Middle East", ar: "الشرق الأوسط" },
  AFRICA: { en: "Africa", ar: "أفريقيا" },
  "SOUTH ASIA": { en: "South Asia", ar: "جنوب آسيا" },
  "SOUTHEAST ASIA": { en: "Southeast Asia", ar: "جنوب شرق آسيا" },
  "EAST ASIA": { en: "East Asia", ar: "شرق آسيا" },
  OCEANIA: { en: "Oceania", ar: "أوقيانوسيا" },
};

/** Global backbone hubs (largest nodes, anchor the inter-regional network). */
export const HUBS = CLUSTERS.filter((c) => c.hub).map((c) => c.city);

/* ------------------------------------------------------------------ */
/*  Road network — classified procedural routes between major centres.  */
/*  Each road is a polyline of [lon,lat]; class defines colour/weight.  */
/* ------------------------------------------------------------------ */
export type RoadClass = "highway" | "secondary" | "arterial" | "density";

export interface Road {
  class: RoadClass;
  points: [number, number][];
}

function greatCircle(a: Cluster, b: Cluster, steps = 24): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const lat = a.lat + (b.lat - a.lat) * f;
    // arc longitude through the shorter path
    let dlon = ((b.lon - a.lon + 540) % 360) - 180;
    const lon = a.lon + dlon * f;
    pts.push([lon, lat]);
  }
  return pts;
}

const ROADS: Road[] = [];

/* Highways — global backbone corridors between hubs */
const backbonePairs: [string, string][] = [
  ["New York", "London"], ["New York", "Chicago"], ["New York", "Washington"],
  ["Chicago", "Los Angeles"], ["Los Angeles", "San Francisco"], ["New York", "Miami"],
  ["London", "Paris"], ["London", "Frankfurt"], ["Paris", "Frankfurt"],
  ["Frankfurt", "Istanbul"], ["Istanbul", "Riyadh"], ["Istanbul", "Dubai"],
  ["Riyadh", "Dubai"], ["Dubai", "Mumbai"], ["Dubai", "Singapore"],
  ["Singapore", "Tokyo"], ["Singapore", "Jakarta"], ["Singapore", "Sydney"],
  ["Tokyo", "Seoul"], ["Sydney", "Melbourne"],
  ["London", "São Paulo"], ["New York", "São Paulo"], ["Johannesburg", "Dubai"],
];
for (const [ca, cb] of backbonePairs) {
  const a = CLUSTERS.find((c) => c.city === ca);
  const b = CLUSTERS.find((c) => c.city === cb);
  if (a && b) ROADS.push({ class: "highway", points: greatCircle(a, b, 20) });
}

/* Secondary — regional routes within Europe / US / Gulf / Asia */
const secondaryPairs: [string, string][] = [
  ["London", "Manchester"], ["London", "Edinburgh"], ["Paris", "Berlin"],
  ["Frankfurt", "Munich"], ["Frankfurt", "Milan"], ["Paris", "Madrid"],
  ["Madrid", "Barcelona"], ["Geneva", "Zurich"], ["Geneva", "Milan"],
  ["Milan", "Rome"], ["Berlin", "Hamburg"],
  ["Los Angeles", "Seattle"], ["Chicago", "Houston"], ["Washington", "Toronto"],
  ["Toronto", "Vancouver"], ["Seattle", "Vancouver"], ["Miami", "Houston"],
  ["Istanbul", "Ankara"], ["Riyadh", "Jeddah"], ["Dubai", "Abu Dhabi"],
  ["Dubai", "Cairo"], ["Cairo", "Istanbul"],
  ["Mumbai", "Delhi"], ["Mumbai", "Bengaluru"], ["Delhi", "Lahore"],
  ["Karachi", "Lahore"], ["Karachi", "Mumbai"],
  ["Singapore", "Kuala Lumpur"], ["Singapore", "Bangkok"],
  ["Kuala Lumpur", "Jakarta"], ["Bangkok", "Jakarta"], ["Bangkok", "Singapore"],
  ["Tokyo", "Seoul"], ["Sydney", "Auckland"],
  ["Johannesburg", "Cape Town"], ["São Paulo", "Rio de Janeiro"],
  ["Mexico City", "Houston"], ["Mexico City", "Miami"],
];
for (const [ca, cb] of secondaryPairs) {
  const a = CLUSTERS.find((c) => c.city === ca);
  const b = CLUSTERS.find((c) => c.city === cb);
  if (a && b) ROADS.push({ class: "secondary", points: greatCircle(a, b, 16) });
}

/* Density — burgundy core roads inside the busiest metropolitan centres */
const METRO_CORES: [string, string][] = [
  ["New York", "Washington"], ["New York", "Philadelphia"],
  ["London", "Manchester"], ["Paris", "Lyon"],
  ["Istanbul", "Izmir"], ["Riyadh", "Dammam"], ["Dubai", "Abu Dhabi"],
  ["Mumbai", "Pune"], ["Singapore", "Johor Bahru"],
  ["Tokyo", "Yokohama"], ["São Paulo", "Campinas"],
];
for (const [ca, cb] of METRO_CORES) {
  const a = CLUSTERS.find((c) => c.city === ca);
  const b = CLUSTERS.find((c) => c.city === cb);
  if (a && b) ROADS.push({ class: "density", points: greatCircle(a, b, 10) });
}

export const ROADS_BY_CLASS: Record<RoadClass, [number, number][][]> = {
  highway: ROADS.filter((r) => r.class === "highway").map((r) => r.points),
  secondary: ROADS.filter((r) => r.class === "secondary").map((r) => r.points),
  arterial: ROADS.filter((r) => r.class === "arterial").map((r) => r.points),
  density: ROADS.filter((r) => r.class === "density").map((r) => r.points),
};

/* ------------------------------------------------------------------ */
/*  Connection topology — members → local cluster → region → global.   */
/* ------------------------------------------------------------------ */
export interface Link {
  a: number; // member id
  b: number;
  kind: "local" | "regional" | "global";
}

export const LINKS: Link[] = (() => {
  const links: Link[] = [];
  const byCluster: Record<string, number[]> = {};
  MEMBERS.forEach((m) => {
    (byCluster[m.cluster] ??= []).push(m.id);
  });

  // local: connect members within the same cluster (star to first)
  for (const ids of Object.values(byCluster)) {
    for (let i = 1; i < ids.length; i++) links.push({ a: ids[0], b: ids[i], kind: "local" });
  }

  // regional: connect each cluster's first member to a regional hub
  const regionRep: Partial<Record<Region, number>> = {};
  for (const cl of CLUSTERS) {
    if (cl.hub && regionRep[cl.region] === undefined) {
      const first = MEMBERS.find((m) => m.cluster === cl.city);
      if (first) regionRep[cl.region] = first.id;
    }
  }
  for (const cl of CLUSTERS) {
    const first = MEMBERS.find((m) => m.cluster === cl.city);
    if (!first) continue;
    const rep = regionRep[cl.region];
    if (rep !== undefined && rep !== first.id) {
      links.push({ a: first.id, b: rep, kind: "regional" });
    }
  }

  // global: connect all region reps in a ring (backbone)
  const reps = Object.values(regionRep).filter(Boolean) as number[];
  for (let i = 0; i < reps.length; i++) {
    const a = reps[i];
    const b = reps[(i + 1) % reps.length];
    links.push({ a, b, kind: "global" });
  }

  // de-duplicate
  const seen = new Set<string>();
  return links.filter((l) => {
    const k = l.a < l.b ? `${l.a}-${l.b}` : `${l.b}-${l.a}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
})();
