"use client";

/**
 * Geographic Coordinate Parser
 * Master Specification: Search by Coordinates
 *
 * Supports multiple coordinate formats:
 * - Decimal Degrees: 59.9139, 10.7522
 * - Degrees Minutes Seconds: 59°54'50"N, 10°45'8"E
 * - Degrees Decimal Minutes: 59 54.83 N, 10 45.13 E
 */

export interface ParsedCoordinate {
  lat: number;
  lon: number;
  valid: boolean;
}

export function useGeoCoordinates() {
  return {
    parse: parseCoordinate,
    format: formatCoordinate,
    formatDMS: formatDMS,
  };
}

export function parseCoordinate(input: string): ParsedCoordinate {
  const trimmed = input.trim();

  // Try decimal degrees: "59.9139, 10.7522" or "59.9139 10.7522"
  const decimalMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1]);
    const lon = parseFloat(decimalMatch[2]);
    if (isValidLat(lat) && isValidLon(lon)) return { lat, lon, valid: true };
  }

  // Try DMS: "59°54'50"N 10°45'8"E" or similar
  const dmsPattern = /(-?\d+)°\s*(\d+)'?\s*(\d+\.?\d*)?"?\s*([NSEW])/gi;
  const matches = [...trimmed.matchAll(dmsPattern)];
  if (matches.length >= 2) {
    const lat = dmsToDecimal(matches[0]);
    const lon = dmsToDecimal(matches[1]);
    if (lat !== null && lon !== null && isValidLat(lat) && isValidLon(lon)) {
      return { lat, lon, valid: true };
    }
  }

  // Try DDM: "59 54.83 N, 10 45.13 E"
  const ddmPattern = /(-?\d+)[\s°]+(\d+\.?\d*)\s*([NSEW])/gi;
  const ddmMatches = [...trimmed.matchAll(ddmPattern)];
  if (ddmMatches.length >= 2) {
    const lat = ddmToDecimal(ddmMatches[0]);
    const lon = ddmToDecimal(ddmMatches[1]);
    if (lat !== null && lon !== null && isValidLat(lat) && isValidLon(lon)) {
      return { lat, lon, valid: true };
    }
  }

  return { lat: 0, lon: 0, valid: false };
}

function dmsToDecimal(m: RegExpMatchArray): number | null {
  const deg = parseInt(m[1]);
  const min = parseInt(m[2]);
  const sec = parseFloat(m[3] || "0");
  const dir = m[4].toUpperCase();
  let decimal = deg + min / 60 + sec / 3600;
  if (dir === "S" || dir === "W") decimal = -decimal;
  return decimal;
}

function ddmToDecimal(m: RegExpMatchArray): number | null {
  const deg = parseInt(m[1]);
  const min = parseFloat(m[2]);
  const dir = m[3].toUpperCase();
  let decimal = deg + min / 60;
  if (dir === "S" || dir === "W") decimal = -decimal;
  return decimal;
}

function isValidLat(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLon(lon: number): boolean {
  return lon >= -180 && lon <= 180;
}

export function formatCoordinate(lat: number, lon: number, precision = 4): string {
  return `${lat.toFixed(precision)}°, ${lon.toFixed(precision)}°`;
}

export function formatDMS(lat: number, lon: number): string {
  return `${decimalToDMS(lat, "lat")}, ${decimalToDMS(lon, "lon")}`;
}

function decimalToDMS(decimal: number, type: "lat" | "lon"): string {
  const dir = type === "lat" ? (decimal >= 0 ? "N" : "S") : (decimal >= 0 ? "E" : "W");
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(0);
  return `${deg}°${min}'${sec}"${dir}`;
}
