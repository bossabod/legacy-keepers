"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ==================================================================
   NetworkMap — a flat 2D map of New York City (Leaflet + OSM tiles).
   No 3D buildings, no globe, no network fetches beyond normal map
   tiles, no loading screen. Renders instantly, drag / zoom / scroll.
   Dark styling to match the site.
   ================================================================== */

// New York City
const CENTER: [number, number] = [40.7128, -74.006];
const ZOOM = 12;

export default function NetworkMap({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const map = L.map(el, {
      center: CENTER,
      zoom: ZOOM,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });

    // Free & open raster tiles (OpenStreetMap standard style).
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: "abc",
    }).addTo(map);

    // dark control buttons
    const zoom = L.control.zoom({ position: "bottomright" });
    zoom.addTo(map);

    (el as any).__globeApi = {
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
    };

    // keep the map sized correctly if its container resizes
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
    };
  }, []);

  return (
    <div ref={mountRef} data-globe className={className} style={{ width: "100%", height: "100%" }} />
  );
}
