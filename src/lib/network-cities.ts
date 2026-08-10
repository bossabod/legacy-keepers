/* ==================================================================
   network-cities.ts — مدن الشبكة المتاحة (نقاط + نطاق حدودي لكل مدينة).
   The map is restricted to these cities. Each city has a center and a
   generous bounding box so the user can pan / zoom / rotate / tilt
   within a large area around the city — but cannot leave it.
   ================================================================== */

export interface NetworkCity {
  id: string;
  name: string; // EN display name
  arName?: string; // Arabic display name
  country: string;
  center: [number, number]; // [lon, lat]
  bounds: [[number, number], [number, number]]; // [[west,south],[east,north]]
  zoom: number;
}

/* Build a box of ~±span degrees around a center. */
function box(center: [number, number], span: number): [[number, number], [number, number]] {
  const [lon, lat] = center;
  return [
    [lon - span, lat - span * 0.7],
    [lon + span, lat + span * 0.7],
  ];
}

function city(
  id: string,
  name: string,
  country: string,
  center: [number, number],
  span = 1.1,
  zoom = 11,
  arName?: string
): NetworkCity {
  return { id, name, arName, country, center, bounds: box(center, span), zoom };
}

export const NETWORK_CITIES: NetworkCity[] = [
  // ---- Norway ----
  city("oslo", "Oslo", "Norway", [10.7522, 59.9139], 1.1, 11, "أوسلو"),
  city("bergen", "Bergen", "Norway", [5.3221, 60.3913], 1.1, 11, "بيرغن"),
  city("trondheim", "Trondheim", "Norway", [10.3951, 63.4305], 1.1, 11, "تروندهايم"),
  // ---- Sweden ----
  city("stockholm", "Stockholm", "Sweden", [18.0686, 59.3293], 1.1, 11, "ستوكهولم"),
  city("gothenburg", "Gothenburg", "Sweden", [11.9746, 57.7089], 1.1, 11, "غوتنبرغ"),
  city("malmo", "Malmö", "Sweden", [13.0038, 55.605], 1.1, 11, "مالمو"),
  // ---- Saudi Arabia ----
  city("riyadh", "Riyadh", "Saudi Arabia", [46.6753, 24.7136], 1.3, 11, "الرياض"),
  city("jeddah", "Jeddah", "Saudi Arabia", [39.1925, 21.4858], 1.3, 11, "جدة"),
  // ---- UAE ----
  city("dubai", "Dubai", "UAE", [55.2708, 25.2048], 1.0, 11, "دبي"),
  city("abudhabi", "Abu Dhabi", "UAE", [54.3773, 24.4539], 1.1, 11, "أبوظبي"),
  city("sharjah", "Sharjah", "UAE", [55.4209, 25.3463], 0.9, 11, "الشارقة"),
  // ---- Qatar ----
  city("doha", "Doha", "Qatar", [51.531, 25.2854], 1.0, 11, "الدوحة"),
  // ---- France ----
  city("paris", "Paris", "France", [2.3522, 48.8566], 1.0, 11, "باريس"),
  city("lyon", "Lyon", "France", [4.8357, 45.764], 1.0, 11, "ليون"),
  // ---- Switzerland ----
  city("zurich", "Zürich", "Switzerland", [8.5417, 47.3769], 0.9, 11, "زيورخ"),
  city("geneva", "Geneva", "Switzerland", [6.1432, 46.2044], 0.9, 11, "جنيف"),
  // ---- Australia ----
  city("sydney", "Sydney", "Australia", [151.2093, -33.8688], 1.3, 11, "سيدني"),
  city("melbourne", "Melbourne", "Australia", [144.9631, -37.8136], 1.3, 11, "ملبورن"),
  city("brisbane", "Brisbane", "Australia", [153.0251, -27.4698], 1.3, 11, "بريزبن"),
  // ---- Russia ----
  city("moscow", "Moscow", "Russia", [37.6173, 55.7558], 1.3, 11, "موسكو"),
];

export function getCity(id: string): NetworkCity | undefined {
  return NETWORK_CITIES.find((c) => c.id === id);
}

export const DEFAULT_CITY = "dubai";
