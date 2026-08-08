"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ==================================================================
   NetworkMap — a flat 2D map of New York City (Leaflet).
   Two base styles, switchable instantly:
     • Standard  — OpenStreetMap raster tiles
     • Satellite — Esri World Imagery (free, real aerial/satellite, no key)
   No 3D buildings, no globe, no loading screen. Drag / zoom / scroll.
   Dark styling to match the site.
   ================================================================== */

export type MapStyle = "standard" | "satellite";

const CENTER: [number, number] = [40.7128, -74.006];
const ZOOM = 12;

export default function NetworkMap({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<MapStyle>("standard");

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

    // ---- two base layers, only one visible at a time ----
    const standard = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: "abc",
      }
    );
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      }
    );

    const layers: Record<MapStyle, L.TileLayer> = { standard, satellite };
    const apply = (s: MapStyle) => {
      Object.values(layers).forEach((l) => map.removeLayer(l));
      layers[s].addTo(map);
      // re-apply the CSS filter so satellite is not darkened the same way
      const c = (el as HTMLDivElement).querySelector(".leaflet-tile");
      (el as HTMLDivElement).classList.toggle("is-satellite", s === "satellite");
      void c;
    };
    apply(styleRef.current);

    // dark control buttons
    const zoom = L.control.zoom({ position: "bottomright" });
    zoom.addTo(map);

    (el as any).__globeApi = {
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      setStyle: (s: MapStyle) => { styleRef.current = s; apply(s); },
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
