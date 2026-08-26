/**
 * Real NASA / space observation data helpers.
 * All fetches run in the browser against public official APIs.
 * No stock media, no AI imagery, no fake live video.
 */

export const NASA_API_KEY =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_NASA_API_KEY) ||
  "DEMO_KEY";

export type ObservatoryStatus = "loading" | "live" | "partial" | "offline" | "error";

export interface EpicFrame {
  identifier: string;
  image: string; // basename without extension
  caption: string;
  date: string; // "YYYY-MM-DD HH:mm:ss"
  centroid_coordinates?: { lat: number; lon: number };
  dscovr_j2000_position?: { x: number; y: number; z: number };
  /** Fully resolved PNG URL on epic.gsfc.nasa.gov */
  imageUrl: string;
}

export interface ApodData {
  title: string;
  explanation: string;
  date: string;
  media_type: string;
  url: string;
  hdurl?: string;
  copyright?: string;
}

export interface IssPosition {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKms: number;
  timestamp: number;
  source: string;
}

export interface SolarEvent {
  flrID?: string;
  beginTime?: string;
  peakTime?: string;
  classType?: string;
  sourceLocation?: string;
}

function epicPngUrl(dateStr: string, image: string): string {
  // dateStr: "2024-08-20 00:12:34" or "2024-08-20"
  const day = dateStr.slice(0, 10); // YYYY-MM-DD
  const [y, m, d] = day.split("-");
  return `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${d}/png/${image}.png`;
}

/** Latest DSCOVR EPIC full-disk Earth frames (official NASA). */
export async function fetchEpicLatest(signal?: AbortSignal): Promise<EpicFrame[]> {
  const url = `https://api.nasa.gov/EPIC/api/natural?api_key=${encodeURIComponent(NASA_API_KEY)}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`EPIC HTTP ${res.status}`);
  const raw = (await res.json()) as Array<{
    identifier: string;
    image: string;
    caption: string;
    date: string;
    centroid_coordinates?: { lat: number; lon: number };
    dscovr_j2000_position?: { x: number; y: number; z: number };
  }>;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((f) => ({
    ...f,
    imageUrl: epicPngUrl(f.date, f.image),
  }));
}

/** Astronomy Picture of the Day (official NASA). */
export async function fetchApod(signal?: AbortSignal): Promise<ApodData> {
  const url = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(NASA_API_KEY)}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`APOD HTTP ${res.status}`);
  return (await res.json()) as ApodData;
}

/** Live ISS state vector (wheretheiss.at public API). */
export async function fetchIssPosition(signal?: AbortSignal): Promise<IssPosition> {
  // Primary: wheretheiss.at
  try {
    const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544", {
      signal,
      cache: "no-store",
    });
    if (res.ok) {
      const j = (await res.json()) as {
        latitude: number;
        longitude: number;
        altitude: number;
        velocity: number;
        timestamp: number;
      };
      return {
        latitude: j.latitude,
        longitude: j.longitude,
        altitudeKm: j.altitude,
        velocityKms: j.velocity,
        timestamp: j.timestamp * 1000,
        source: "wheretheiss.at",
      };
    }
  } catch {
    /* fall through */
  }

  // Fallback: open-notify
  const res2 = await fetch("https://api.open-notify.org/iss-now.json", {
    signal,
    cache: "no-store",
  });
  if (!res2.ok) throw new Error(`ISS HTTP ${res2.status}`);
  const j2 = (await res2.json()) as {
    iss_position: { latitude: string; longitude: string };
    timestamp: number;
  };
  return {
    latitude: Number(j2.iss_position.latitude),
    longitude: Number(j2.iss_position.longitude),
    altitudeKm: 420,
    velocityKms: 7.66,
    timestamp: j2.timestamp * 1000,
    source: "open-notify.org",
  };
}

/** Recent solar flares from NASA DONKI (last ~14 days). */
export async function fetchSolarFlares(signal?: AbortSignal): Promise<SolarEvent[]> {
  const end = new Date();
  const start = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url =
    `https://api.nasa.gov/DONKI/FLR?startDate=${fmt(start)}&endDate=${fmt(end)}` +
    `&api_key=${encodeURIComponent(NASA_API_KEY)}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`DONKI HTTP ${res.status}`);
  const data = (await res.json()) as SolarEvent[];
  return Array.isArray(data) ? data.slice(-12).reverse() : [];
}

export function formatCoord(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}°${ns}  ${Math.abs(lon).toFixed(3)}°${ew}`;
}
