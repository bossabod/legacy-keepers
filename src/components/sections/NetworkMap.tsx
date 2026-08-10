"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { NETWORK_CITIES, getCity, DEFAULT_CITY, type NetworkCity } from "@/lib/network-cities";

/* ==================================================================
   NetworkMap — interactive city-restricted satellite map (MapLibre GL).
   The map is confined to the currently selected city's bounding box:
   the user can pan / zoom / rotate / tilt within a large area around
   the city, but cannot drag outside it or roam the world. Cities are
   switched via jumpToCity().
     • Satellite base — Esri World Imagery (free, no key).
     • 3D Buildings — OpenFreeMap vector tiles (free, no key).
     • Terrain — free public terrarium DEM tiles (no key).
   Map source / colors / functions are unchanged.
   Exposes: zoomIn / zoomOut / set3D(bool) / jumpToCity(id).
   ================================================================== */

export default function NetworkMap({
  className = "",
  initialCity = DEFAULT_CITY,
}: {
  className?: string;
  initialCity?: string;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cityRef = useRef<NetworkCity>(getCity(initialCity) || getCity(DEFAULT_CITY)!);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let map: MapLibreMap | null = null;
    const city = cityRef.current;

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
      center: city.center,
      zoom: city.zoom,
      pitch: 0,
      bearing: 0,
      maxPitch: 65,
      maxBounds: city.bounds, // keep the map inside this city's area
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
      jumpToCity: (id: string) => {
        const c = getCity(id);
        if (!c || !map) return;
        cityRef.current = c;
        map.easeTo({ center: c.center, zoom: c.zoom, duration: 900 });
        map.setMaxBounds(c.bounds);
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
