"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ==================================================================
   NetworkMap — interactive monochrome night map (MapLibre GL JS).
   Based on the official OpenFreeMap "dark" vector style (free, no key,
   already the source used for buildings — no new external provider),
   then the style's own layer paints are re-colored into a strict
   black / gray / white palette:
     • background & water & land   → near-black (#000 / #050505)
     • major roads / highways      → white (#e6e6e6) to light gray
     • secondary streets           → mid gray
     • local streets               → dark gray
     • boundaries / buildings      → gray shades only
     • labels & symbols            → white/light-gray with black halo
   All blue/green/yellow/red/orange removed. This changes the map
   layers' colors themselves (not a CSS filter). Data source, MapLibre
   and all interactions (Satellite-look base, 3D buildings, terrain,
   rotate, tilt, zoom, pan) are unchanged in behaviour.
   Exposes: zoomIn / zoomOut / set3D(bool).
   ================================================================== */

const CENTER: [number, number] = [-74.006, 40.7128];
const ZOOM = 12;

const DARK_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

/* Monochrome road palette by OSM highway class. */
const ROAD_COLOR = [
  "match", ["get", "class"],
  ["motorway", "motorway_link", "trunk", "trunk_link"], "#e6e6e6",
  ["primary", "primary_link"], "#d0d0d0",
  ["secondary", "secondary_link"], "#b0b0b0",
  ["tertiary", "tertiary_link"], "#929292",
  ["residential", "unclassified", "living_street"], "#6e6e6e",
  ["service", "track", "path"], "#4a4a4a",
  "#3c3c3c",
];

/* Recolor a single layer's paints into the monochrome palette. */
function recolorLayer(map: MapLibreMap, layer: any) {
  try {
    const type = layer.type;
    const sl = layer["source-layer"] as string | undefined;

    if (type === "background") {
      map.setPaintProperty(layer.id, "background-color", "#000000");
      return;
    }
    if (type === "fill") {
      if (sl === "water" || sl === "waterway") {
        map.setPaintProperty(layer.id, "fill-color", "#010101");
      } else if (sl === "landuse" || sl === "landcover" || sl === "park") {
        map.setPaintProperty(layer.id, "fill-color", "#070707");
      } else if (sl === "building") {
        map.setPaintProperty(layer.id, "fill-color", "#161616");
        map.setPaintProperty(layer.id, "fill-opacity", 0.9);
      } else {
        map.setPaintProperty(layer.id, "fill-color", "#050505");
      }
      return;
    }
    if (type === "line") {
      if (sl === "transportation") {
        map.setPaintProperty(layer.id, "line-color", ROAD_COLOR as any);
        map.setPaintProperty(layer.id, "line-opacity", 1);
      } else if (sl === "water" || sl === "waterway") {
        map.setPaintProperty(layer.id, "line-color", "#0a0a0a");
      } else if (sl === "boundary" || sl === "boundary_lvl4") {
        map.setPaintProperty(layer.id, "line-color", "#555555");
      } else {
        map.setPaintProperty(layer.id, "line-color", "#2a2a2a");
      }
      return;
    }
    if (type === "symbol") {
      // place / road / water labels → light text with black halo
      map.setPaintProperty(layer.id, "text-color", "#e8e8e8");
      map.setPaintProperty(layer.id, "text-halo-color", "#000000");
      map.setPaintProperty(layer.id, "text-halo-width", 1.2);
      return;
    }
    if (type === "circle") {
      map.setPaintProperty(layer.id, "circle-color", "#cccccc");
      return;
    }
  } catch (e) {
    // ignore layers we can't recolor
  }
}

function recolorAll(map: MapLibreMap) {
  try {
    const layers = map.getStyle().layers || [];
    for (const l of layers) recolorLayer(map, l);
  } catch (e) {
    // keep current style if override fails
  }
}

export default function NetworkMap({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let map: MapLibreMap | null = null;

    map = new maplibregl.Map({
      container: el,
      style: DARK_STYLE_URL,
      center: CENTER,
      zoom: ZOOM,
      pitch: 0,
      bearing: 0,
      maxPitch: 65,
      dragRotate: true,
      pitchWithRotate: true,
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
    });

    const mapReady = map;
    mapReady.on("load", () => {
      // 1) recolor existing style layers into black/gray/white
      recolorAll(mapReady);

      // 2) 3D relief (best-effort, optional)
      try {
        mapReady.addSource("terrain", {
          type: "raster-dem",
          tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
          encoding: "terrarium",
          tileSize: 256,
          maxzoom: 15,
          attribution: "Terrain &copy; Tilezen / Mapzen elevation tiles",
        });
        mapReady.setTerrain({ source: "terrain", exaggeration: 1.2 });
      } catch (e) {
        /* terrain optional */
      }

      // 3) real 3D buildings (dark monochrome silhouettes)
      try {
        if (!mapReady.getSource("3d-buildings-source")) {
          mapReady.addSource("3d-buildings-source", {
            type: "vector",
            url: "https://tiles.openfreemap.org/planet",
          });
        }
        mapReady.addLayer({
          id: "3d-buildings",
          source: "3d-buildings-source",
          "source-layer": "building",
          type: "fill-extrusion",
          minzoom: 15,
          filter: ["!=", ["get", "hide_3d"], true],
          layout: { visibility: "none" },
          paint: {
            "fill-extrusion-color": [
              "interpolate", ["linear"], ["get", "render_height"],
              0, "#2a2a2a", 90, "#222222", 200, "#1a1a1a", 350, "#141414",
            ],
            "fill-extrusion-opacity": 0.92,
            "fill-extrusion-height": [
              "interpolate", ["linear"], ["zoom"], 15, 0, 16, ["get", "render_height"],
            ],
            "fill-extrusion-base": [
              "case", [">=", ["get", "zoom"], 16], ["get", "render_min_height"], 0,
            ],
          },
        });
      } catch (e) {
        /* buildings optional */
      }
    });

    (el as any).__globeApi = {
      zoomIn: () => map?.zoomIn(),
      zoomOut: () => map?.zoomOut(),
      set3D: (on: boolean) => {
        if (!map) return;
        if (on) {
          const z = Math.max(map.getZoom(), 16);
          map.easeTo({ pitch: 55, bearing: -30, zoom: z, duration: 900 });
          if (map.getLayer("3d-buildings")) {
            map.setLayoutProperty("3d-buildings", "visibility", "visible");
          }
        } else {
          map.easeTo({ pitch: 0, bearing: 0, duration: 700 });
          if (map.getLayer("3d-buildings")) {
            map.setLayoutProperty("3d-buildings", "visibility", "none");
          }
        }
      },
    };

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
