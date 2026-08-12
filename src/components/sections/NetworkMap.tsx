"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildNodesGeoJSON, buildLinksGeoJSON } from "@/lib/network-links";

/* ==================================================================
   NetworkMap — New York City satellite map (MapLibre GL), NYC only.
   The camera is centered on New York City and locked to its metro
   bounds: you cannot pan out of NYC to other cities/countries.
     • Satellite base — Esri World Imagery (free, no key).
     • 3D Buildings — OpenFreeMap vector tiles.
     • Terrain — free public terrarium DEM tiles.
     • Network overlay — glowing white nodes + luminous blue links
       (relations / connections layer, togglable).
   Map source / colors / functions are unchanged.
   Exposes: zoomIn / zoomOut / set3D(bool) / setNetwork(bool).
   ================================================================== */

// New York City metro bounds (SW lon/lat, NE lon/lat)
const NYC_BOUNDS: [[number, number], [number, number]] = [
  [-74.3, 40.48],
  [-73.7, 40.93],
];
const CENTER: [number, number] = [-74.006, 40.7128];
// Zoom قريب جدًا — مستوى المباني والشوارع (ثابت لاحقًا)
const ZOOM = 16;

export default function NetworkMap({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let map: MapLibreMap | null = null;

    const style: any = {
      version: 8,
      sources: {
        satellite: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 19,
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        },
        terrain: {
          type: "raster-dem",
          tiles: [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
          ],
          encoding: "terrarium",
          tileSize: 256,
          maxzoom: 15,
          attribution: "Terrain &copy; Tilezen / Mapzen elevation tiles",
        },
      },
      layers: [{ id: "satellite", type: "raster", source: "satellite" }],
    };

    map = new maplibregl.Map({
      container: el,
      style,
      center: CENTER,
      zoom: ZOOM,
      minZoom: ZOOM,
      maxZoom: ZOOM,
      pitch: 0,
      bearing: 0,
      maxPitch: 65,
      maxBounds: NYC_BOUNDS, // lock to New York City
      dragRotate: true,
      pitchWithRotate: true,
      attributionControl: false,
      // ---- Zoom مقيّد بالكامل: تعطيل كل وسائل التكبير/التبعيد ----
      scrollZoom: false,
      boxZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      keyboard: false,
      dragPan: true,
      canvasContextAttributes: { antialias: true },
    });

    // تأكيد إضافي: أي محاولة تقريب تعيد الزوم إلى الثابت
    map.on("zoom", () => {
      if (map && map.getZoom() !== ZOOM) map.setZoom(ZOOM);
    });

    const mapReady = map;
    mapReady.on("load", () => {
      // Terrain (3D relief) — best-effort; map still works if it fails.
      try {
        mapReady.setTerrain({ source: "terrain", exaggeration: 1.2 });
      } catch (e) {
        // terrain optional
      }

      // Real 3D buildings (OpenFreeMap) — best-effort.
      try {
        mapReady.addSource("openfreemap", {
          type: "vector",
          url: "https://tiles.openfreemap.org/planet",
        });
        mapReady.addLayer({
          id: "3d-buildings",
          source: "openfreemap",
          "source-layer": "building",
          type: "fill-extrusion",
          minzoom: 15,
          filter: ["!=", ["get", "hide_3d"], true],
          layout: { visibility: "none" },
          paint: {
            "fill-extrusion-color": [
              "interpolate", ["linear"], ["get", "render_height"],
              0, "#c9c4b8", 90, "#9e998e", 200, "#8b867b", 350, "#7d7870",
            ],
            "fill-extrusion-opacity": 0.9,
            "fill-extrusion-height": [
              "interpolate", ["linear"], ["zoom"], 15, 0, 16, ["get", "render_height"],
            ],
            "fill-extrusion-base": [
              "case", [">=", ["get", "zoom"], 16], ["get", "render_min_height"], 0,
            ],
          },
        });
      } catch (e) {
        // buildings optional — satellite + terrain still work
      }

      // ---- network overlay (nodes + links) — kept as-is ----
      try {
        mapReady.addSource("net-nodes", { type: "geojson", data: buildNodesGeoJSON() as any });
        mapReady.addSource("net-links", { type: "geojson", data: buildLinksGeoJSON() as any });

        mapReady.addLayer({
          id: "net-link-glow",
          source: "net-links",
          type: "line",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#2a7fff", "line-width": 2.2, "line-opacity": 0.18 },
        });
        mapReady.addLayer({
          id: "net-link",
          source: "net-links",
          type: "line",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#3d8bff", "line-width": 1, "line-opacity": 0.7 },
        });

        mapReady.addLayer({
          id: "net-node-halo",
          source: "net-nodes",
          type: "circle",
          paint: {
            "circle-radius": ["case", ["get", "hub"], 7, 5],
            "circle-color": "#ffffff",
            "circle-opacity": 0.25,
            "circle-blur": 0.9,
          },
        });
        mapReady.addLayer({
          id: "net-node",
          source: "net-nodes",
          type: "circle",
          paint: {
            "circle-radius": ["case", ["get", "hub"], 3.2, 2.4],
            "circle-color": "#ffffff",
            "circle-opacity": 0.95,
            "circle-stroke-color": "#9cc4ff",
            "circle-stroke-width": 0.8,
          },
        });
      } catch (e) {
        // network overlay optional — map still works
      }
    });

    (el as any).__globeApi = {
      // Zoom ثابت — الأزرار الخارجية بلا تأثير
      zoomIn: () => { if (map && map.getZoom() !== ZOOM) map.setZoom(ZOOM); },
      zoomOut: () => { if (map && map.getZoom() !== ZOOM) map.setZoom(ZOOM); },
      setNetwork: (on: boolean) => {
        if (!map) return;
        const ids = ["net-link-glow", "net-link", "net-node-halo", "net-node"];
        for (const id of ids) {
          if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
        }
      },
      set3D: (on: boolean) => {
        if (!map) return;
        if (on) {
          // zoom يبقى ثابتًا (ZOOM) — الميلان فقط
          map.easeTo({ pitch: 55, bearing: -30, zoom: ZOOM, duration: 900 });
          if (map.getLayer("3d-buildings")) {
            map.setLayoutProperty("3d-buildings", "visibility", "visible");
          }
        } else {
          map.easeTo({ pitch: 0, bearing: 0, zoom: ZOOM, duration: 700 });
          if (map.getLayer("3d-buildings")) {
            map.setLayoutProperty("3d-buildings", "visibility", "none");
          }
        }
      },
    };

    // keep map sized correctly
    const ro = new ResizeObserver(() => map?.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      map?.remove();
    };
  }, []);

  return (
    <div ref={mountRef} data-globe className={className} style={{ width: "100%", height: "100%" }} />
  );
}
