/* ==================================================================
   network-links.ts — العُقد (nodes) والوصلات (links) لشبكة العلاقات
   العالمية المعروضة كطبقة فوق الخريطة.
   The defined target cities are the primary nodes; a few global hubs
   (New York, London, Istanbul, Tokyo, etc.) are added as connectors so
   the network reads as a real worldwide connections mesh. Links connect
   cities in a meaningful (not random) web.
   ================================================================== */

export interface NetworkNode {
  id: string;
  name: string;
  center: [number, number]; // [lon, lat]
  hub?: boolean;            // true = global connector node
}

export interface NetworkLink {
  from: string; // node id
  to: string;   // node id
}

const N = (id: string, name: string, lon: number, lat: number, hub = false): NetworkNode => ({
  id, name, center: [lon, lat], hub,
});

export const NETWORK_NODES: NetworkNode[] = [
  // --- specified target cities ---
  N("oslo", "Oslo", 10.7522, 59.9139),
  N("bergen", "Bergen", 5.3221, 60.3913),
  N("trondheim", "Trondheim", 10.3951, 63.4305),
  N("stockholm", "Stockholm", 18.0686, 59.3293),
  N("gothenburg", "Gothenburg", 11.9746, 57.7089),
  N("malmo", "Malmö", 13.0038, 55.605),
  N("riyadh", "Riyadh", 46.6753, 24.7136),
  N("jeddah", "Jeddah", 39.1925, 21.4858),
  N("dubai", "Dubai", 55.2708, 25.2048),
  N("abudhabi", "Abu Dhabi", 54.3773, 24.4539),
  N("sharjah", "Sharjah", 55.4209, 25.3463),
  N("doha", "Doha", 51.531, 25.2854),
  N("paris", "Paris", 2.3522, 48.8566),
  N("lyon", "Lyon", 4.8357, 45.764),
  N("zurich", "Zürich", 8.5417, 47.3769),
  N("geneva", "Geneva", 6.1432, 46.2044),
  N("sydney", "Sydney", 151.2093, -33.8688),
  N("melbourne", "Melbourne", 144.9631, -37.8136),
  N("brisbane", "Brisbane", 153.0251, -27.4698),
  N("moscow", "Moscow", 37.6173, 55.7558),
  // --- global connector hubs ---
  N("newyork", "New York", -74.006, 40.7128, true),
  N("london", "London", -0.1276, 51.5072, true),
  N("istanbul", "Istanbul", 28.9784, 41.0082, true),
  N("tokyo", "Tokyo", 139.6917, 35.6895, true),
  N("toronto", "Toronto", -79.3832, 43.6532, true),
  N("losangeles", "Los Angeles", -118.2437, 34.0522, true),
];

export const NETWORK_LINKS: NetworkLink[] = [
  // Norway ↔ Sweden
  { from: "oslo", to: "stockholm" },
  { from: "oslo", to: "bergen" },
  { from: "oslo", to: "trondheim" },
  { from: "trondheim", to: "bergen" },
  { from: "stockholm", to: "gothenburg" },
  { from: "stockholm", to: "malmo" },
  { from: "gothenburg", to: "malmo" },
  // Scandinavia → Europe
  { from: "oslo", to: "london" },
  { from: "stockholm", to: "istanbul" },
  { from: "malmo", to: "paris" },
  // France / Switzerland
  { from: "paris", to: "lyon" },
  { from: "paris", to: "zurich" },
  { from: "lyon", to: "geneva" },
  { from: "zurich", to: "geneva" },
  { from: "zurich", to: "istanbul" },
  { from: "geneva", to: "london" },
  { from: "paris", to: "london" },
  // Russia
  { from: "moscow", to: "istanbul" },
  { from: "moscow", to: "stockholm" },
  { from: "moscow", to: "tokyo" },
  // Gulf (Saudi / UAE / Qatar)
  { from: "riyadh", to: "jeddah" },
  { from: "riyadh", to: "dubai" },
  { from: "riyadh", to: "doha" },
  { from: "jeddah", to: "dubai" },
  { from: "dubai", to: "abudhabi" },
  { from: "dubai", to: "sharjah" },
  { from: "abudhabi", to: "sharjah" },
  { from: "dubai", to: "doha" },
  { from: "doha", to: "abudhabi" },
  { from: "dubai", to: "istanbul" },
  { from: "doha", to: "istanbul" },
  // Europe → Gulf → Asia
  { from: "london", to: "dubai" },
  { from: "paris", to: "dubai" },
  { from: "istanbul", to: "dubai" },
  // Australia
  { from: "sydney", to: "melbourne" },
  { from: "sydney", to: "brisbane" },
  { from: "melbourne", to: "brisbane" },
  { from: "sydney", to: "tokyo" },
  { from: "brisbane", to: "tokyo" },
  // Americas connectors
  { from: "newyork", to: "london" },
  { from: "newyork", to: "toronto" },
  { from: "toronto", to: "losangeles" },
  { from: "losangeles", to: "tokyo" },
  { from: "newyork", to: "dubai" },
];

/* GeoJSON helpers */
export function buildNodesGeoJSON() {
  return {
    type: "FeatureCollection",
    features: NETWORK_NODES.map((n) => ({
      type: "Feature",
      properties: { name: n.name, hub: !!n.hub },
      geometry: { type: "Point", coordinates: n.center },
    })),
  };
}

export function buildLinksGeoJSON() {
  const byId = new Map(NETWORK_NODES.map((n) => [n.id, n]));
  const features: any[] = [];
  for (const link of NETWORK_LINKS) {
    const a = byId.get(link.from);
    const b = byId.get(link.to);
    if (!a || !b) continue;
    features.push({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [a.center, b.center],
      },
    });
  }
  return { type: "FeatureCollection", features };
}
