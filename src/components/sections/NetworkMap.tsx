"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ==================================================================
   NetworkMap — interactive dark monochrome map (MapLibre GL JS).
   Built from the SAME vector source already used in the project
   (OpenFreeMap planet tiles — the same one powering 3D buildings), no
   new external provider, no satellite imagery.
   A real dark vector road-map style:
     • background / water / unused land  → near-black
     • major roads                       → white / light gray
     • secondary streets                 → mid gray
     • small streets                     → dark gray
     • boundaries / buildings            → gray shades only
     • labels                            → white / light gray, black halo
   Strict black + gray + white palette (no blue/green/yellow/orange).
   Layers are added defensively (each in try/catch) so the map always
   renders a black base and never blanks. Functions preserved:
   rotate, tilt (3D), terrain, zoom, pan.
   Exposes: zoomIn / zoomOut / set3D(bool).
   ================================================================== */

const CENTER: [number, number] = [-74.006, 40.7128];
const ZOOM = 12;

const VEC_URL = "https://tiles.openfreemap.org/planet";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

/* Monochrome road color + width by OSM highway class. */
const ROAD_CLASS: Record<string, { c: string; w: number }> = {
  motorway: { c: "#e9e9e9", w: 2.6 },
  motorway_link: { c: "#dcdcdc", w: 1.8 },
  trunk: { c: "#e6e6e6", w: 2.4 },
  trunk_link: { c: "#d4d4d4", w: 1.6 },
  primary: { c: "#d0d0d0", w: 2.0 },
  primary_link: { c: "#c0c0c0", w: 1.4 },
  secondary: { c: "#a8a8a8", w: 1.5 },
  secondary_link: { c: "#989898", w: 1.1 },
  tertiary: { c: "#8a8a8a", w: 1.2 },
  tertiary_link: { c: "#7c7c7c", w: 0.9 },
  residential: { c: "#666666", w: 1.0 },
  unclassified: { c: "#5f5f5f", w: 1.0 },
  living_street: { c: "#5a5a5a", w: 0.9 },
  service: { c: "#444444", w: 0.6 },
  track: { c: "#3a3a3a", w: 0.5 },
  path: { c: "#333333", w: 0.4 },
  default: { c: "#4a4a4a", w: 0.9 },
};

function roadColor() {
  const expr: any = ["match", ["get", "class"]];
  for (const k in ROAD_CLASS) if (k !== "default") expr.push(k, ROAD_CLASS[k].c);
  expr.push(ROAD_CLASS.default.c);
  return expr;
}
function roadWidth() {
  const expr: any = ["match", ["get", "class"]];
  for (const k in ROAD_CLASS) if (k !== "default") expr.push(k, ROAD_CLASS[k].w);
  expr.push(ROAD_CLASS.default.w);
  return expr;
}

export default function NetworkMap({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let map: MapLibreMap | null = null;

    // Start with just a black background + the existing vector source.
    // Every visual layer is added defensively after load, so a failing
    // layer never blanks the map.
    map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        name: "Dark Monochrome",
        glyphs: GLYPHS,
        sources: {
          openfreemap: { type: "vector", url: VEC_URL },
          terrain: {
            type: "raster-dem",
            tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 15,
          },
        },
        layers: [{ id: "bg", type: "background", paint: { "background-color": "#040404" } }],
      },
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
      const add = (L: any) => { try { mapReady.addLayer(L); } catch (e) { /* skip */ } };

      // water → black
      add({ id: "water", source: "openfreemap", "source-layer": "water", type: "fill", paint: { "fill-color": "#000000" } });
      add({ id: "waterway", source: "openfreemap", "source-layer": "waterway", type: "line", paint: { "line-color": "#0a0a0a", "line-width": 0.6 } });
      // land → near black (parks/wood slightly distinct but still dark)
      add({ id: "landcover", source: "openfreemap", "source-layer": "landcover", type: "fill", paint: { "fill-color": "#060606" } });
      add({ id: "landuse", source: "openfreemap", "source-layer": "landuse", type: "fill", paint: { "fill-color": "#070707" } });
      // buildings → dark gray
      add({ id: "building", source: "openfreemap", "source-layer": "building", type: "fill", paint: { "fill-color": "#141414", "fill-opacity": 0.9 } });
      // boundaries → gray
      add({ id: "boundary", source: "openfreemap", "source-layer": "boundary", type: "line", paint: { "line-color": "#3f3f3f", "line-width": 0.8 } });

      // ROADS: soft glow under + bright core
      add({
        id: "road-glow", source: "openfreemap", "source-layer": "transportation", type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": ["+", roadWidth(), 1.6], "line-opacity": 0.18 },
      });
      add({
        id: "road-core", source: "openfreemap", "source-layer": "transportation", type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": roadColor(), "line-width": roadWidth(), "line-opacity": 0.95 },
      });

      // place labels → white / light gray with black halo
      add({
        id: "place", source: "openfreemap", "source-layer": "place", type: "symbol",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["case", ["==", ["get", "class"], "city"], 13, ["==", ["get", "class"], "town"], 10, 8],
          "text-anchor": "top",
          "text-letter-spacing": 0.06,
          "text-transform": "uppercase",
        },
        paint: { "text-color": "#ececec", "text-halo-color": "#000000", "text-halo-width": 1.4 },
      });
      // road labels → light gray
      add({
        id: "road-label", source: "openfreemap", "source-layer": "transportation_name", type: "symbol",
        minzoom: 14,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 9,
          "symbol-placement": "line",
          "symbol-spacing": 260,
          "text-letter-spacing": 0.03,
        },
        paint: { "text-color": "#b8b8b8", "text-halo-color": "#000000", "text-halo-width": 1.1 },
      });

      // Terrain (3D relief) — best-effort
      try { mapReady.setTerrain({ source: "terrain", exaggeration: 1.2 }); } catch (e) { /* optional */ }

      // Real 3D buildings (dark monochrome silhouettes) — same vector source
      add({
        id: "3d-buildings", source: "openfreemap", "source-layer": "building", type: "fill-extrusion",
        minzoom: 15, filter: ["!=", ["get", "hide_3d"], true], layout: { visibility: "none" },
        paint: {
          "fill-extrusion-color": ["interpolate", ["linear"], ["get", "render_height"], 0, "#2a2a2a", 90, "#222222", 200, "#1a1a1a", 350, "#141414"],
          "fill-extrusion-opacity": 0.92,
          "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 16, ["get", "render_height"]],
          "fill-extrusion-base": ["case", [">=", ["get", "zoom"], 16], ["get", "render_min_height"], 0],
        },
      });
    });

    (el as any).__globeApi = {
      zoomIn: () => map?.zoomIn(),
      zoomOut: () => map?.zoomOut(),
      set3D: (on: boolean) => {
        if (!map) return;
        if (on) {
          const z = Math.max(map.getZoom(), 16);
          map.easeTo({ pitch: 55, bearing: -30, zoom: z, duration: 900 });
          if (map.getLayer("3d-buildings")) map.setLayoutProperty("3d-buildings", "visibility", "visible");
        } else {
          map.easeTo({ pitch: 0, bearing: 0, duration: 700 });
          if (map.getLayer("3d-buildings")) map.setLayoutProperty("3d-buildings", "visibility", "none");
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
