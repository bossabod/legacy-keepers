/* ==================================================================
   network-targets.ts — المدن/المناطق المستهدفة في الشبكة.
   Each target is a city with a surrounding region radius, used to draw
   a subtle red highlight on the map (visible when zoomed out).
   ================================================================== */

export interface NetworkTarget {
  id: string;
  name: string;
  country: string;
  center: [number, number]; // [lon, lat]
  radiusKm: number;         // region radius around the city
}

const CITY = (
  id: string,
  name: string,
  country: string,
  lon: number,
  lat: number,
  radiusKm = 45
): NetworkTarget => ({ id, name, country, center: [lon, lat], radiusKm });

export const NETWORK_TARGETS: NetworkTarget[] = [
  // Norway
  CITY("oslo", "Oslo", "Norway", 10.7522, 59.9139),
  CITY("bergen", "Bergen", "Norway", 5.3221, 60.3913),
  CITY("trondheim", "Trondheim", "Norway", 10.3951, 63.4305),
  // Sweden
  CITY("stockholm", "Stockholm", "Sweden", 18.0686, 59.3293),
  CITY("gothenburg", "Gothenburg", "Sweden", 11.9746, 57.7089),
  CITY("malmo", "Malmö", "Sweden", 13.0038, 55.605),
  // Saudi Arabia
  CITY("riyadh", "Riyadh", "Saudi Arabia", 46.6753, 24.7136, 70),
  CITY("jeddah", "Jeddah", "Saudi Arabia", 39.1925, 21.4858, 60),
  // UAE
  CITY("dubai", "Dubai", "UAE", 55.2708, 25.2048, 40),
  CITY("abudhabi", "Abu Dhabi", "UAE", 54.3773, 24.4539, 45),
  CITY("sharjah", "Sharjah", "UAE", 55.4209, 25.3463, 35),
  // Qatar
  CITY("doha", "Doha", "Qatar", 51.531, 25.2854, 40),
  // France
  CITY("paris", "Paris", "France", 2.3522, 48.8566, 50),
  CITY("lyon", "Lyon", "France", 4.8357, 45.764, 45),
  // Switzerland
  CITY("zurich", "Zürich", "Switzerland", 8.5417, 47.3769, 40),
  CITY("geneva", "Geneva", "Switzerland", 6.1432, 46.2044, 35),
  // Australia
  CITY("sydney", "Sydney", "Australia", 151.2093, -33.8688, 60),
  CITY("melbourne", "Melbourne", "Australia", 144.9631, -37.8136, 60),
  CITY("brisbane", "Brisbane", "Australia", 153.0251, -27.4698, 55),
  // Russia
  CITY("moscow", "Moscow", "Russia", 37.6173, 55.7558, 70),
];
