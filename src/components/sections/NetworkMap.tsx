"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ==================================================================
   NetworkMap — interactive New York City map (MapLibre GL JS), NIGHT.
   • Base layer: NASA GIBS "Black Marble" / Earth at Night (Suomi NPP
     VIIRS) — REAL nighttime satellite imagery showing actual city
     lights, dark oceans and dark land. No daytime colours.
   • 3D View: tilted oblique perspective + real-height buildings from
     OpenFreeMap vector tiles (free, no key, streams by camera position).
   • No globe, no Cesium, no huge data, no endless loading.
   Exposes: zoomIn / zoomOut / set3D(bool).
   ================================================================== */

const CENTER: [number, number] = [-74.006, 40.7128];
const ZOOM = 11;

export default function NetworkMap({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let map: MapLibreMap | null = null;

    // NASA Earth at Night (Black Marble) — real nighttime satellite imagery.
    // Tile matrix "GoogleMapsCompatible_Level8" tops out at native zoom 8.
    const style: any = {
      version: 8,
      sources: {
        night: {
          type: "raster",
          tiles: [
            "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
          ],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 8,
          attribution:
            "Imagery &copy; NASA GIBS / Black Marble (Suomi NPP VIIRS)",
        },
      },
      layers: [{ id: "night", type: "raster", source: "night" }],
    };

    map = new maplibregl.Map({
      container: el,
      style,
      center: CENTER,
      zoom: ZOOM,
      pitch: 0,
      bearing: 0,
      maxPitch: 60,
      dragRotate: true,
      pitchWithRotate: true,
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
    });

    // Add real 3D buildings (OpenFreeMap) when the map loads.
    const mapReady = map;
    mapReady?.on("load", () => {
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
              0, "#8a8578", 90, "#6e695e", 200, "#57534b", 350, "#3f3c37",
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
        // buildings optional — night map still works
      }
    });

    (el as any).__globeApi = {
      zoomIn: () => map?.zoomIn(),
      zoomOut: () => map?.zoomOut(),
      set3D: (on: boolean) => {
        if (!map) return;
        if (on) {
          const z = Math.max(map.getZoom(), 15.5);
          map.easeTo({ pitch: 52, bearing: -28, zoom: z, duration: 900 });
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
