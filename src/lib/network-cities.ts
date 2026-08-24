/* ==================================================================
   network-cities.ts — الدول والمدن المتاحة لنظام التنقل في الخريطة.
   كل مدينة لها مركز وحدود جغرافية (نطاق التحريك) ومستوى تفصيل (zoom).
   ================================================================== */

export interface NavCity {
  id: string;
  name: string;
  center: [number, number]; // [lon, lat]
  bounds: [[number, number], [number, number]]; // [[west,south],[east,north]]
  zoom: number;
}

export interface NavCountry {
  id: string;
  name: string;
  cities: NavCity[];
}

/* يُنشئ حدوداً كريمة حول المركز (نطاق تحريك كبير داخل المدينة) */
function c(id: string, name: string, lon: number, lat: number, span = 0.28, zoom = 16): NavCity {
  return {
    id,
    name,
    center: [lon, lat],
    bounds: [
      [lon - span, lat - span * 0.75],
      [lon + span, lat + span * 0.75],
    ],
    zoom,
  };
}

export const NAV_COUNTRIES: NavCountry[] = [
  {
    id: "norway",
    name: "Norway",
    cities: [
      c("oslo", "Oslo", 10.7522, 59.9139),
      c("bergen", "Bergen", 5.3221, 60.3913),
      c("trondheim", "Trondheim", 10.3951, 63.4305),
    ],
  },
  {
    id: "sweden",
    name: "Sweden",
    cities: [
      c("stockholm", "Stockholm", 18.0686, 59.3293),
      c("gothenburg", "Gothenburg", 11.9746, 57.7089),
    ],
  },
  {
    id: "germany",
    name: "Germany",
    cities: [c("berlin", "Berlin", 13.405, 52.52)],
  },
  {
    id: "switzerland",
    name: "Switzerland",
    cities: [
      c("zurich", "Zurich", 8.5417, 47.3769),
      c("geneva", "Geneva", 6.1432, 46.2044),
      c("bern", "Bern", 7.4474, 46.948),
    ],
  },
  {
    id: "uk",
    name: "United Kingdom",
    cities: [c("london", "London", -0.1276, 51.5072)],
  },
  {
    id: "usa",
    name: "USA",
    cities: [
      c("newyork", "New York City", -74.006, 40.7128, 0.22),
      c("losangeles", "Los Angeles", -118.2437, 34.0522, 0.3),
      c("chicago", "Chicago", -87.6298, 41.8781, 0.28),
      c("miami", "Miami", -80.1918, 25.7617, 0.26),
    ],
  },
  {
    id: "saudi",
    name: "Saudi Arabia",
    cities: [
      c("riyadh", "Riyadh", 46.6753, 24.7136, 0.3),
      c("jeddah", "Jeddah", 39.1925, 21.4858, 0.28),
      c("alkhobar", "Al Khobar", 50.2087, 26.2172, 0.26),
    ],
  },
  {
    id: "uae",
    name: "UAE",
    cities: [
      c("dubai", "Dubai", 55.2708, 25.2048, 0.22),
      c("abudhabi", "Abu Dhabi", 54.3773, 24.4539, 0.26),
      c("sharjah", "Sharjah", 55.4209, 25.3463, 0.2),
    ],
  },
  {
    id: "qatar",
    name: "Qatar",
    cities: [c("doha", "Doha", 51.531, 25.2854, 0.24)],
  },
  {
    id: "turkey",
    name: "Turkey",
    cities: [
      c("istanbul", "Istanbul", 28.9784, 41.0082, 0.3),
      c("mersin", "Mersin", 34.6333, 36.8, 0.26),
    ],
  },
];

export const DEFAULT_CITY_ID = "newyork";

export function findCity(id: string): NavCity | undefined {
  for (const co of NAV_COUNTRIES) {
    const cc = co.cities.find((x) => x.id === id);
    if (cc) return cc;
  }
  return undefined;
}
