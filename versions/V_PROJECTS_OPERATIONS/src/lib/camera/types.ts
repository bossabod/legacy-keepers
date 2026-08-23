/**
 * Camera Engine — Types & State Management
 * Master Specification: Camera System & Navigation Architecture
 *
 * The camera engine provides:
 * - Orbital Earth Camera (primary)
 * - Smooth interpolation with velocity/inertia
 * - Continuous zoom (no steps)
 * - Camera bookmarks architecture
 * - Keyframe system for future cinematic paths
 * - Mini-globe synchronization
 */

import type { CameraState, CameraBookmark } from "@/lib/entities/types";

export interface CameraController {
  state: CameraState;
  target: CameraState;
  bookmarks: CameraBookmark[];
  history: CameraState[];
  historyIndex: number;

  // Navigation
  flyTo: (lat: number, lon: number, zoom?: number, duration?: number) => void;
  zoomIn: (factor?: number) => void;
  zoomOut: (factor?: number) => void;
  reset: () => void;

  // History
  back: () => void;
  forward: () => void;

  // Bookmarks
  addBookmark: (name: string) => void;
  goToBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;

  // State queries
  isAnimating: () => boolean;
  getAltitudeLabel: () => string;
}

export const DEFAULT_CAMERA: CameraState = {
  lat: 20,
  lon: 10,
  altitude: 15000000,   // ~15,000 km (planet view)
  zoom: 2,
  heading: 0,
  pitch: 0,
  roll: 0,
  fov: 45,
};

// Zoom level to approximate altitude (meters)
export function zoomToAltitude(zoom: number): number {
  // World spans 256 * 2^zoom pixels at 96 DPI
  // Altitude ≈ earthCircumference / (2 * pixels) * scaleFactor
  const earthRadius = 6378137;
  const circumference = 2 * Math.PI * earthRadius;
  const worldPixels = 256 * Math.pow(2, zoom);
  // Each pixel represents circumference / worldPixels meters at equator
  // Altitude relates to how many pixels fit in viewport
  return circumference / worldPixels * 400;
}

export function altitudeToZoom(altitude: number): number {
  return Math.log2((256 * 2 * Math.PI * 6378137) / (altitude * 400));
}

export function getAltitudeLabel(altitude: number): string {
  if (altitude > 1000000) return `${(altitude / 1000000).toFixed(1)}M m`;
  if (altitude > 1000) return `${(altitude / 1000).toFixed(0)}K m`;
  return `${Math.round(altitude)} m`;
}
