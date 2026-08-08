"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ==================================================================
   NetworkMap — interactive NIGHT map of New York City (MapLibre GL JS).

   Visual style: a true "Earth at night" city-lights map, built from
   OpenFreeMap vector tiles (global coverage — the same night look
   everywhere you pan/zoom), NOT an orange filter over a satellite:
     • Background / seas / unlit land  → near-black.
     • Water almost black, very subtle coastline.
     • Roads & streets render as glowing orange/gold/white lines, the
       primary visual element (glow = wider translucent line underneath
       a bright core line). Density/intensity scales by road class.
     • Dense urban land use gets a faint warm glow; buildings dark.
     • City / town / road labels kept, softly lit in warm white.

   Functions preserved: Satellite look is now the night lights; drag to
   pan, scroll / buttons to zoom, Ctrl/right-drag to rotate, two-finger
   / pitch to tilt, 3D View (real-height dark buildings), Terrain.
   No globe, no Cesium, no huge data, no endless loading.
   Exposes: zoomIn / zoomOut / set3D(bool).
   ================================================================== */

const CENTER: [number, number] = [-74.006, 40.7128];
const ZOOM = 12;

const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const OFM = { type: "vector", url: "https://tiles.openfreemap.org/planet" };

/* Road classes → glow/core colours & widths (city-lights look). */
const ROADS: { cls: string[]; core: string; width: number; glow: string; gop: number; maxz?: number }[] = [
  { cls: ["motorway", "motorway_link", "trunk", "trunk_link"], core: "#ffd68a", width: 2.6, glow: "#ffa02e", gop: 0.55 },
  { cls: ["primary", "primary_link"], core: "#ffc86a", width: 2.0, glow: "#ff9020", gop: 0.5 },
  { cls: ["secondary", "secondary_link", "tertiary", "tertiary_link"], core: "#ffb14a", width: 1.5, glow: "#ff7a14", gop: 0.45 },
  { cls: ["residential", "unclassified", "living_street"], core: "#c97e2c", width: 1.0, glow: "#8a4f14", gop: 0.4 },
  { cls: ["service", "track", "path"], core: "#6e4715", width: 0.6, glow: "#3a260c", gop: 0.3 },
];

function nightStyle(): any {
  const layers: any[] = [
    // near-black global background
    { id: "bg", type: "background", paint: { "background-color": "#030407" } },

    // land use → faint warm urban glow
    {
      id: "urban-glow", type: "fill", source: "openfreemap", "source-layer": "landuse",
      filter: ["==", ["get", "class"], "residential"],
      paint: { "fill-color": "#ff8a1e", "fill-opacity": 0.07 },
    },
    {
      id: "urban-glow-com", type: "fill", source: "openfreemap", "source-layer": "landuse",
      filter: ["==", ["get", "class"], "commercial"],
      paint: { "fill-color": "#ffb347", "fill-opacity": 0.1 },
    },
    {
      id: "land-dark", type: "fill", source: "openfreemap", "source-layer": "landcover",
      filter: ["==", ["get", "class"], "wood"],
      paint: { "fill-color": "#05070a" },
    },

    // water → almost black + subtle coastline
    {
      id: "water", type: "fill", source: "openfreemap", "source-layer": "water",
      paint: { "fill-color": "#010203" },
    },
    {
      id: "waterway", type: "line", source: "openfreemap", "source-layer": "waterway",
      paint: { "line-color": "#041018", "line-width": 0.6 },
    },
    {
      id: "coastline", type: "line", source: "openfreemap", "source-layer": "water",
      filter: ["==", ["get", "class"], "ocean"],
      paint: { "line-color": "#123040", "line-width": 0.7, "line-opacity": 0.5 },
    },

    // faint boundary lines
    {
      id: "boundary", type: "line", source: "openfreemap", "source-layer": "boundary",
      filter: ["==", ["get", "admin_level"], 2],
      paint: { "line-color": "#2a3540", "line-width": 0.8, "line-opacity": 0.5 },
    },

    // buildings — dark flat masses in 2D (visible city blocks)
    {
      id: "building-dark", type: "fill", source: "openfreemap", "source-layer": "building",
      paint: { "fill-color": "#0b0f14", "fill-opacity": 0.85 },
    },

    // ROADS: glow line underneath + bright core line
    ...ROADS.flatMap((r, i) => {
      const match: any = ["match", ["get", "class"], ...r.cls, true, false];
      const glow = {
        id: `road-glow-${i}`, type: "line", source: "openfreemap", "source-layer": "transportation",
        filter: match,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": r.glow,
          "line-width": r.width + 1.8,
          "line-opacity": r.gop * 0.7,
          ...(r.maxz ? { "line-width-transition": { duration: 0 } } : {}),
        },
      };
      const core = {
        id: `road-core-${i}`, type: "line", source: "openfreemap", "source-layer": "transportation",
        filter: match,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": r.core,
          "line-width": r.width,
          "line-opacity": 0.95,
        },
      };
      return [glow, core];
    }),

    // building labels & place labels (softly lit)
    {
      id: "place-city", type: "symbol", source: "openfreemap", "source-layer": "place",
      filter: ["in", ["get", "class"], ["literal", ["city", "town", "village"]]],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": ["case", ["==", ["get", "class"], "city"], 13, ["==", ["get", "class"], "town"], 10, 8],
        "text-anchor": "top",
        "text-transform": "uppercase",
        "text-letter-spacing": 0.08,
      },
      paint: {
        "text-color": "#ffe9c2",
        "text-halo-color": "#000000",
        "text-halo-width": 1.4,
      },
    },
  ];

  // road name labels (only above a zoom level to avoid clutter)
  ROADS.forEach((r, i) => {
    layers.push({
      id: `road-label-${i}`, type: "symbol", source: "openfreemap", "source-layer": "transportation",
      filter: ["match", ["get", "class"], ...r.cls, true, false],
      minzoom: 14,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular"],
        "text-size": 9,
        "text-justify": "center",
        "symbol-placement": "line",
        "symbol-spacing": 260,
        "text-letter-spacing": 0.04,
      },
      paint: {
        "text-color": "#e8c48a",
        "text-halo-color": "#000000",
        "text-halo-width": 1.1,
      },
    });
  });

  return {
    version: 8,
    name: "Night City Lights",
    glyphs: GLYPHS,
    sources: {
      openfreemap: OFM,
      terrain: {
        type: "raster-dem",
        tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
        attribution: "Terrain &copy; Tilezen / Mapzen elevation tiles",
      },
    },
    layers,
  };
}

export default function NetworkMap({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let map: MapLibreMap | null = null;

    map = new maplibregl.Map({
      container: el,
      style: nightStyle(),
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
      // Terrain (3D relief) — best-effort; map still works if it fails.
      try {
        mapReady.setTerrain({ source: "terrain", exaggeration: 1.2 });
      } catch (e) {
        /* terrain optional */
      }

      // Real 3D buildings (OpenFreeMap) — dark night silhouettes.
      try {
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
              0, "#1c1f26", 90, "#15181e", 200, "#101318", 350, "#0c0e12",
            ],
            "fill-extrusion-opacity": 0.95,
            "fill-extrusion-height": [
              "interpolate", ["linear"], ["zoom"], 15, 0, 16, ["get", "render_height"],
            ],
            "fill-extrusion-base": [
              "case", [">=", ["get", "zoom"], 16], ["get", "render_min_height"], 0,
            ],
          },
        });
      } catch (e) {
        /* buildings optional — night map still works */
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
