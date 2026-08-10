"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { NETWORK_TARGETS, type NetworkTarget } from "@/lib/network-targets";

/* ==================================================================
   NetworkMap — interactive satellite map (MapLibre GL) with subtle red
   target-region highlights.
     • Satellite base — Esri World Imagery (free, no key).
     • 3D Buildings — OpenFreeMap vector tiles.
     • Terrain — free public terrarium DEM tiles.
     • Red highlights — a faint elegant red region circle around each
       target city (visible from far when zoomed out). Only the target
       cities' surrounding regions are highlighted, not whole countries.
   Map source / colors / functions are unchanged; this only ADDS the
   highlight layer.
   Exposes: zoomIn / zoomOut / set3D(bool).
   ================================================================== */

const kmToDeg = (km: number) => km / 111;

/* Build a GeoJSON polygon (approx circle) around a city center. */
function circleFeature(t: NetworkTarget): any {
  const [lon, lat] = t.center;
  const rLat = kmToDeg(t.radiusKm);
  const rLon = kmToDeg(t.radiusKm) / Math.max(0.4, Math.cos((lat * Math.PI) / 180));
  const coords: [number, number][] = [];
  const steps = 48;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    coords.push([lon + Math.cos(a) * rLon, lat + Math.sin(a) * rLat]);
  }
  return {
    type: "Feature",
    properties: { name: t.name, country: t.country },
    geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] },
  };
}

const TARGET_FEATURES = {
  type: "FeatureCollection",
  features: NETWORK_TARGETS.map(circleFeature),
};

/* Fit the map to show all target regions. */
function fitTargets(map: MapLibreMap) {
  const pts: [number, number][] = NETWORK_TARGETS.map((t) => t.center);
  try {
    map.fitBounds(
      [
        [Math.min(...pts.map((p) => p[0])) - 3, Math.min(...pts.map((p) => p[1])) - 3],
        [Math.max(...pts.map((p) => p[0])) + 3, Math.max(...pts.map((p) => p[1])) + 3],
      ],
      { padding: 60, duration: 0 }
    );
  } catch (e) {
    /* keep default view */
  }
}

const CENTER: [number, number] = [-74.006, 40.7128];
const ZOOM = 14;

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

      // ---- United Arab Emirates — highlighted RED (guaranteed GeoJSON) ----
      try {
        mapReady.addSource("uae", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[
                [51.5, 25.3], [51.2, 24.5], [51.8, 23.5], [53.2, 22.6],
                [54.8, 22.5], [55.7, 22.7], [56.0, 23.5], [56.4, 24.2],
                [56.3, 25.2], [56.0, 25.9], [55.3, 26.0], [54.2, 25.9],
                [53.4, 25.7], [52.6, 25.6], [51.8, 25.5], [51.5, 25.3],
              ]],
            },
          },
        });
        // red border
        mapReady.addLayer({
          id: "uae-border",
          source: "uae",
          type: "line",
          paint: { "line-color": "#ff1414", "line-width": 3, "line-opacity": 0.95 },
        });
        // faint red fill over the UAE region so it stands out
        mapReady.addLayer({
          id: "uae-fill",
          source: "uae",
          type: "fill",
          paint: { "fill-color": "#ff1414", "fill-opacity": 0.15 },
        });
      } catch (e) {
        // UAE highlight optional — map still works
      }

      // ---- subtle red target-region highlights (faint, elegant) ----
      try {
        mapReady.addSource("targets", { type: "geojson", data: TARGET_FEATURES as any });
        // soft red fill inside each region
        mapReady.addLayer({
          id: "target-fill",
          source: "targets",
          type: "fill",
          paint: { "fill-color": "#e02424", "fill-opacity": 0.16 },
        });
        // elegant red outline — visible from a distance
        mapReady.addLayer({
          id: "target-outline",
          source: "targets",
          type: "line",
          paint: { "line-color": "#ff4d4d", "line-width": 1.4, "line-opacity": 0.5 },
        });
      } catch (e) {
        // highlights optional — map still works
      }

      // fit initial view to show all target regions
      try {
        fitTargets(mapReady);
      } catch (e) {
        /* keep default */
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
