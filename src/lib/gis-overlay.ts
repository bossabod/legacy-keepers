/* ============================================================
   gis-overlay.ts — بيانات طبقات الاستخبارات الجغرافية
   Data for the GIS-style overlay layers rendered ABOVE the base
   map. The base map is never modified; these zones/nodes/links
   float as independent overlay graphics. Monochrome + deep
   forest/navy/burgundy tones, all very dark.
   ============================================================ */

/* --- Mountain ranges: [lon,lat][] polygons, very dark forest-green tint --- */
export const MOUNTAIN_ZONES: [number, number][][] = [
  // Himalaya
  [[75, 35], [80, 36], [84, 33], [90, 33], [95, 28], [90, 26], [84, 30], [78, 32], [75, 35]],
  // Alps
  [[6.5, 46.5], [9, 47], [12, 46.5], [14, 46], [12, 44], [8, 44], [6, 45.5], [6.5, 46.5]],
  // Caucasus
  [[40, 42], [44, 43], [48, 42], [46, 39], [42, 40], [40, 42]],
  // Rockies
  [[-114, 52], [-110, 49], [-105, 40], [-108, 34], [-112, 36], [-117, 45], [-120, 51], [-114, 52]],
  // Andes (north)
  [[-77, 8], [-72, 6], [-70, -5], [-74, -10], [-78, -5], [-79, 2], [-77, 8]],
  // Andes (south)
  [[-71, -28], [-66, -30], [-65, -40], [-69, -50], [-72, -45], [-73, -33], [-71, -28]],
  // Atlas
  [[-8, 31], [-3, 33], [3, 35], [6, 33], [2, 30], [-5, 30], [-8, 31]],
  // Zagros
  [[46, 36], [50, 38], [54, 36], [50, 32], [45, 32], [46, 36]],
  // Ural
  [[57, 64], [60, 66], [64, 62], [61, 58], [58, 58], [57, 64]],
  // Alps of New Zealand (Southern Alps)
  [[168, -44], [171, -43], [173, -45], [170, -47], [167, -46], [168, -44]],
];

/* --- Ocean/sea water regions: very dark navy tint polygons --- */
export const WATER_ZONES: [number, number][][] = [
  // North Atlantic
  [[-45, 60], [-20, 62], [-15, 50], [-25, 35], [-45, 30], [-60, 40], [-55, 55], [-45, 60]],
  // South Atlantic
  [[-35, -5], [-15, -10], [-5, -30], [-15, -45], [-35, -45], [-45, -25], [-35, -5]],
  // North Pacific
  [[-155, 55], [-130, 58], [-115, 45], [-125, 30], [-145, 25], [-165, 35], [-170, 50], [-155, 55]],
  // South Pacific
  [[-120, -10], [-90, -15], [-80, -30], [-95, -45], [-120, -45], [-140, -30], [-135, -15], [-120, -10]],
  // Indian Ocean
  [[45, -5], [65, -8], [85, -10], [95, -20], [80, -30], [55, -30], [40, -20], [45, -5]],
  // Mediterranean
  [[-5, 37], [5, 40], [12, 42], [20, 40], [24, 36], [15, 34], [3, 36], [-5, 37]],
  // Caribbean
  [[-85, 20], [-70, 22], [-60, 18], [-65, 12], [-80, 12], [-85, 20]],
  // Arctic
  [[-40, 78], [0, 82], [40, 82], [80, 80], [60, 70], [0, 70], [-40, 78]],
];

/* --- Major metropolitan centres for urban-density heat + road activity --- */
export interface MetroZone {
  lat: number;
  lon: number;
  radius: number;      // km-ish scale in degrees of latitude
  intensity: number;   // 0..1 density at centre
  name: string;
}

export const METRO_ZONES: MetroZone[] = [
  { lat: 40.71, lon: -74.01, radius: 1.6, intensity: 1.0, name: "New York" },
  { lat: 34.05, lon: -118.24, radius: 1.5, intensity: 0.9, name: "Los Angeles" },
  { lat: 41.88, lon: -87.63, radius: 1.3, intensity: 0.8, name: "Chicago" },
  { lat: 51.51, lon: -0.13, radius: 1.4, intensity: 1.0, name: "London" },
  { lat: 48.86, lon: 2.35, radius: 1.2, intensity: 0.9, name: "Paris" },
  { lat: 41.01, lon: 28.98, radius: 1.4, intensity: 0.95, name: "Istanbul" },
  { lat: 24.71, lon: 46.68, radius: 1.1, intensity: 0.85, name: "Riyadh" },
  { lat: 25.20, lon: 55.27, radius: 1.0, intensity: 0.9, name: "Dubai" },
  { lat: 19.08, lon: 72.88, radius: 1.5, intensity: 0.95, name: "Mumbai" },
  { lat: 1.35, lon: 103.82, radius: 0.9, intensity: 0.95, name: "Singapore" },
  { lat: 35.68, lon: 139.65, radius: 1.5, intensity: 1.0, name: "Tokyo" },
  { lat: -23.55, lon: -46.63, radius: 1.4, intensity: 0.9, name: "São Paulo" },
  { lat: -33.87, lon: 151.21, radius: 1.2, intensity: 0.8, name: "Sydney" },
  { lat: 28.70, lon: 77.10, radius: 1.4, intensity: 0.9, name: "Delhi" },
  { lat: 19.43, lon: -99.13, radius: 1.4, intensity: 0.9, name: "Mexico City" },
  { lat: 30.04, lon: 31.24, radius: 1.2, intensity: 0.8, name: "Cairo" },
];

/* --- Active regional intelligence zones (faint blurred dark-red circles) --- */
export interface RegionZone {
  lat: number;
  lon: number;
  radius: number;
  activity: number; // 0..1
}

export const REGION_ZONES: RegionZone[] = [
  { lat: 25, lon: 45, radius: 14, activity: 0.8 },   // Gulf
  { lat: 42, lon: -75, radius: 16, activity: 0.7 },  // US East Coast
  { lat: 51, lon: 5, radius: 14, activity: 0.7 },    // Western Europe
  { lat: 8, lon: 105, radius: 15, activity: 0.6 },   // Southeast Asia
  { lat: 36, lon: 139, radius: 12, activity: 0.6 },  // Japan
  { lat: -20, lon: -50, radius: 15, activity: 0.6 }, // Brazil
];

/* --- Road corridors for activity glow (metro-to-metro) --- */
export const ROAD_ACTIVITY: [number, number][][] = [
  [[40.71, -74.01], [39.95, -75.16]],   // NYC → Philadelphia
  [[40.71, -74.01], [41.88, -87.63]],   // NYC → Chicago
  [[51.51, -0.13], [48.86, 2.35]],      // London → Paris
  [[51.51, -0.13], [53.48, -2.24]],     // London → Manchester
  [[41.01, 28.98], [40.21, 29.00]],     // Istanbul
  [[24.71, 46.68], [25.20, 55.27]],     // Riyadh → Dubai
  [[25.20, 55.27], [24.45, 54.38]],     // Dubai → Abu Dhabi
  [[19.08, 72.88], [28.70, 77.10]],     // Mumbai → Delhi
  [[35.68, 139.65], [35.47, 139.59]],   // Tokyo
  [[-23.55, -46.63], [-22.91, -43.17]], // São Paulo → Rio
];

/* --- Member network nodes: country distribution (major countries more) --- */
export interface NetNode {
  id: number;
  lat: number;
  lon: number;
  size: number;
  label: string;
  country: string;
  isHQ?: boolean;
}

/* city anchors: [name, country, lat, lon, count] */
const CITY_ANCHORS: [string, string, number, number, number][] = [
  ["New York", "United States", 40.71, -74.01, 3],
  ["Los Angeles", "United States", 34.05, -118.24, 2],
  ["Chicago", "United States", 41.88, -87.63, 2],
  ["San Francisco", "United States", 37.77, -122.42, 2],
  ["Seattle", "United States", 47.61, -122.33, 1],
  ["Miami", "United States", 25.76, -80.19, 1],
  ["Houston", "United States", 29.76, -95.37, 1],
  ["Toronto", "Canada", 43.65, -79.38, 2],
  ["Vancouver", "Canada", 49.28, -123.12, 1],
  ["Mexico City", "Mexico", 19.43, -99.13, 2],
  ["São Paulo", "Brazil", -23.55, -46.63, 3],
  ["Rio de Janeiro", "Brazil", -22.91, -43.17, 1],
  ["London", "United Kingdom", 51.51, -0.13, 4],
  ["Manchester", "United Kingdom", 53.48, -2.24, 1],
  ["Edinburgh", "United Kingdom", 55.95, -3.19, 1],
  ["Paris", "France", 48.86, 2.35, 3],
  ["Berlin", "Germany", 52.52, 13.41, 1],
  ["Frankfurt", "Germany", 50.11, 8.68, 2],
  ["Munich", "Germany", 48.14, 11.58, 1],
  ["Geneva", "Switzerland", 46.20, 6.14, 2],
  ["Zurich", "Switzerland", 47.38, 8.54, 1],
  ["Milan", "Italy", 45.46, 9.19, 1],
  ["Rome", "Italy", 41.90, 12.50, 1],
  ["Madrid", "Spain", 40.42, -3.70, 1],
  ["Barcelona", "Spain", 41.39, 2.17, 1],
  ["Istanbul", "Turkey", 41.01, 28.98, 4],
  ["Ankara", "Turkey", 39.93, 32.86, 1],
  ["Riyadh", "Saudi Arabia", 24.71, 46.68, 3],
  ["Jeddah", "Saudi Arabia", 21.49, 39.19, 2],
  ["Dubai", "UAE", 25.20, 55.27, 3],
  ["Abu Dhabi", "UAE", 24.45, 54.38, 2],
  ["Cairo", "Egypt", 30.04, 31.24, 2],
  ["Johannesburg", "South Africa", -26.20, 28.05, 2],
  ["Cape Town", "South Africa", -33.92, 18.42, 1],
  ["Mumbai", "India", 19.08, 72.88, 2],
  ["Delhi", "India", 28.70, 77.10, 1],
  ["Bengaluru", "India", 12.97, 77.59, 1],
  ["Karachi", "Pakistan", 24.86, 67.00, 1],
  ["Lahore", "Pakistan", 31.52, 74.36, 1],
  ["Singapore", "Singapore", 1.35, 103.82, 3],
  ["Kuala Lumpur", "Malaysia", 3.14, 101.69, 2],
  ["Jakarta", "Indonesia", -6.21, 106.85, 2],
  ["Bangkok", "Thailand", 13.76, 100.50, 2],
  ["Tokyo", "Japan", 35.68, 139.65, 3],
  ["Seoul", "South Korea", 37.57, 126.98, 2],
  ["Sydney", "Australia", -33.87, 151.21, 2],
  ["Melbourne", "Australia", -37.81, 144.96, 1],
  ["Auckland", "New Zealand", -36.85, 174.76, 1],
];

export const NET_NODES: NetNode[] = (() => {
  const list: NetNode[] = [];
  let id = 0;
  for (const [city, country, lat, lon, count] of CITY_ANCHORS) {
    for (let k = 0; k < count; k++) {
      const jr = 0.4 + (k / Math.max(1, count)) * 1.2;
      const ja = (k * 2.4 + city.length);
      list.push({
        id,
        lat: lat + Math.cos(ja) * jr * 0.6,
        lon: lon + Math.sin(ja) * jr,
        size: k === 0 ? 3.5 : 2.4,
        label: k === 0 ? city : "",
        country,
        isHQ: k === 0 && city === "Istanbul",
      });
      id++;
    }
  }
  return list;
})();

export const TOTAL_NODES = NET_NODES.length;

/* --- Connection topology --- */
export interface Link { a: number; b: number }

export const NET_LINKS: Link[] = (() => {
  const links: Link[] = [];
  const byCity: Record<string, number[]> = {};
  NET_NODES.forEach((n, i) => {
    const city = n.label || `${n.country}`;
    (byCity[city] ??= []).push(i);
  });
  // local: connect within same city cluster
  for (const ids of Object.values(byCity)) {
    for (let i = 1; i < ids.length; i++) links.push({ a: ids[0], b: ids[i] });
  }
  // strategic inter-country backbone
  const strategic: [string, string][] = [
    ["United States", "United Kingdom"],
    ["United States", "Japan"],
    ["United Kingdom", "United Arab Emirates"],
    ["United Arab Emirates", "Singapore"],
    ["Singapore", "Australia"],
    ["Turkey", "Saudi Arabia"],
    ["Saudi Arabia", "India"],
    ["United States", "Brazil"],
    ["United Kingdom", "France"],
    ["Germany", "Switzerland"],
    ["China", "South Korea"],
    ["India", "Pakistan"],
    ["Japan", "South Korea"],
    ["Malaysia", "Indonesia"],
  ];
  const firstOf = (country: string) => NET_NODES.findIndex((n) => n.country === country);
  for (const [ca, cb] of strategic) {
    const a = firstOf(ca), b = firstOf(cb);
    if (a >= 0 && b >= 0 && a !== b) links.push({ a, b });
  }
  return links;
})();

export const REGION_LABELS: Record<string, { en: string; ar: string }> = {
  "United States": { en: "USA", ar: "أمريكا" },
  "United Kingdom": { en: "UK", ar: "بريطانيا" },
  "United Arab Emirates": { en: "UAE", ar: "الإمارات" },
  "Saudi Arabia": { en: "KSA", ar: "السعودية" },
  "South Korea": { en: "KOR", ar: "كوريا" },
};

/* ------------------------------------------------------------------ */
/*  Additional analytical overlay data                                 */
/* ------------------------------------------------------------------ */

/* Radar-scan hubs — transparent circular sweeps around important hubs. */
export interface RadarHub {
  lat: number;
  lon: number;
  radius: number; // degrees-ish
  speed: number;  // sweep rotation speed (rad/s)
}
export const RADAR_HUBS: RadarHub[] = [
  { lat: 40.71, lon: -74.01, radius: 4.5, speed: 0.7 },   // New York
  { lat: 51.51, lon: -0.13, radius: 4.5, speed: 0.65 },   // London
  { lat: 41.01, lon: 28.98, radius: 4.0, speed: 0.6 },    // Istanbul
  { lat: 24.71, lon: 46.68, radius: 4.0, speed: 0.55 },   // Riyadh
  { lat: 25.20, lon: 55.27, radius: 3.5, speed: 0.6 },    // Dubai
  { lat: 1.35, lon: 103.82, radius: 3.5, speed: 0.5 },    // Singapore
  { lat: 35.68, lon: 139.65, radius: 4.0, speed: 0.6 },   // Tokyo
  { lat: -23.55, lon: -46.63, radius: 4.0, speed: 0.5 },  // São Paulo
  { lat: -33.87, lon: 151.21, radius: 3.5, speed: 0.5 },  // Sydney
];

/* Contour-style analysis lines over mountain regions. Each is a ring
   of lat/lon forming an irregular oval (elevation-band analogue). */
export const MOUNTAIN_CONTOURS: [number, number][][] = [
  [[77, 31], [80, 34], [84, 33], [87, 30], [84, 28], [79, 29], [77, 31]],
  [[76, 33], [79, 35], [83, 35], [86, 32], [83, 30], [78, 31], [76, 33]],
  [[8, 44.5], [10, 46.5], [13, 46.8], [15, 46], [13, 44.2], [9.5, 44], [8, 44.5]],
  [[7, 45.5], [9, 47], [12, 46.8], [14, 45.6], [11.5, 44.4], [8.5, 45], [7, 45.5]],
  [[41, 41], [44, 43], [48, 42.5], [49, 40.5], [45, 39.5], [42, 40.5], [41, 41]],
  [[-109, 38], [-106, 40], [-105, 43], [-109, 45], [-113, 44], [-114, 40], [-109, 38]],
  [[-111, 40], [-108, 42], [-107, 45], [-111, 47], [-115, 46], [-116, 43], [-111, 40]],
  [[-73, 7], [-70, 5], [-69, -2], [-72, -6], [-76, -3], [-77, 3], [-73, 7]],
  [[-70, -30], [-67, -31], [-65, -37], [-68, -44], [-72, -42], [-73, -35], [-70, -30]],
  [[-6, 31], [-2, 32], [3, 34], [5, 33], [2, 31], [-4, 31], [-6, 31]],
];

/* Small white location markers in important cities. */
export const LOCATION_MARKERS: { lat: number; lon: number }[] = [
  { lat: 40.71, lon: -74.01 }, { lat: 34.05, lon: -118.24 }, { lat: 41.88, lon: -87.63 },
  { lat: 51.51, lon: -0.13 }, { lat: 48.86, lon: 2.35 }, { lat: 52.52, lon: 13.41 },
  { lat: 41.01, lon: 28.98 }, { lat: 24.71, lon: 46.68 }, { lat: 25.20, lon: 55.27 },
  { lat: 19.08, lon: 72.88 }, { lat: 1.35, lon: 103.82 }, { lat: 35.68, lon: 139.65 },
  { lat: 37.57, lon: 126.98 }, { lat: -23.55, lon: -46.63 }, { lat: -33.87, lon: 151.21 },
  { lat: 30.04, lon: 31.24 }, { lat: -26.20, lon: 28.05 }, { lat: 3.14, lon: 101.69 },
];

/* Strategic-hub labels. */
export const HUB_LABELS: { lat: number; lon: number; name: string }[] = [
  { lat: 40.71, lon: -74.01, name: "NEW YORK" },
  { lat: 51.51, lon: -0.13, name: "LONDON" },
  { lat: 41.01, lon: 28.98, name: "ISTANBUL" },
  { lat: 24.71, lon: 46.68, name: "RIYADH" },
  { lat: 25.20, lon: 55.27, name: "DUBAI" },
  { lat: 1.35, lon: 103.82, name: "SINGAPORE" },
  { lat: 35.68, lon: 139.65, name: "TOKYO" },
  { lat: -23.55, lon: -46.63, name: "SÃO PAULO" },
  { lat: -33.87, lon: 151.21, name: "SYDNEY" },
];

/* Red hotspot clusters around high-density urban centres. */
export const HOTSPOTS: { lat: number; lon: number; radius: number; intensity: number }[] = [
  { lat: 40.71, lon: -74.01, radius: 1.2, intensity: 0.5 },
  { lat: 51.51, lon: -0.13, radius: 1.1, intensity: 0.5 },
  { lat: 41.01, lon: 28.98, radius: 1.2, intensity: 0.55 },
  { lat: 24.71, lon: 46.68, radius: 1.0, intensity: 0.5 },
  { lat: 25.20, lon: 55.27, radius: 0.9, intensity: 0.55 },
  { lat: 19.08, lon: 72.88, radius: 1.3, intensity: 0.55 },
  { lat: 1.35, lon: 103.82, radius: 0.8, intensity: 0.55 },
  { lat: 35.68, lon: 139.65, radius: 1.3, intensity: 0.6 },
  { lat: -23.55, lon: -46.63, radius: 1.2, intensity: 0.5 },
];

/* Faint network grids in important metros (grid cell size in degrees). */
export const GRID_METROS: { lat: number; lon: number; size: number; cells: number }[] = [
  { lat: 40.71, lon: -74.01, size: 1.1, cells: 2 },
  { lat: 51.51, lon: -0.13, size: 1.1, cells: 2 },
  { lat: 41.01, lon: 28.98, size: 1.0, cells: 2 },
  { lat: 35.68, lon: 139.65, size: 1.2, cells: 2 },
  { lat: 1.35, lon: 103.82, size: 0.8, cells: 2 },
];

/* Active-member blinking points (subset of nodes flagged active). */
export const ACTIVE_MEMBERS: { lat: number; lon: number }[] = (() => {
  // deterministic selection of city anchors, weighted to major metros
  const anchors = [
    [40.71, -74.01], [34.05, -118.24], [51.51, -0.13], [48.86, 2.35],
    [41.01, 28.98], [24.71, 46.68], [25.20, 55.27], [19.08, 72.88],
    [1.35, 103.82], [35.68, 139.65], [-23.55, -46.63], [-33.87, 151.21],
    [30.04, 31.24], [37.57, 126.98], [3.14, 101.69], [40.71, -74.01],
  ];
  return anchors.map((a, i) => ({ lat: a[0] + (i % 3) * 0.25, lon: a[1] + (i % 2) * 0.3 }));
})();
