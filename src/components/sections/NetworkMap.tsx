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
  const miniRef = useRef<HTMLDivElement | null>(null);
  const miniMapRef = useRef<MapLibreMap | null>(null);
  const mainMapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let map: MapLibreMap | null = null;
    const miniCleanups: (() => void)[] = [];

    const style: any = {
      version: 8,
      sources: {
        satellite: {
          type: "raster",
          tiles: [
            "https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 22,
          attribution:
            "Tiles &copy; Esri (Clarity) &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
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
    mainMapRef.current = map;

    // تحديث مستطيل الـ viewport من الخريطة الرئيسية (عند التحرك)
    const updateViewport = () => {
      const mm = mainMapRef.current;
      const mn = miniMapRef.current;
      if (!mm || !mn) return;
      const src = mn.getSource("viewport") as any;
      if (!src) return;
      const b = mm.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      const ring: [number, number][] = [
        [sw.lng, sw.lat], [ne.lng, sw.lat], [ne.lng, ne.lat], [sw.lng, ne.lat], [sw.lng, sw.lat],
      ];
      src.setData({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } });
    };

    // ---- Mini Map / Overview Map ----
    const miniEl = miniRef.current;
    if (miniEl) {
      const mini = new maplibregl.Map({
        container: miniEl,
        style,
        center: [-74.05, 40.72],
        zoom: 10,
        minZoom: 10,
        maxZoom: 10,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        scrollZoom: false,
        boxZoom: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        keyboard: false,
        dragPan: false, // سنحرّك الـ viewport يدويًا، لا الخريطة نفسها
        interactive: true,
      });
      miniMapRef.current = mini;

      // إضافة الطبقة والـ viewport indicator داخل mini map
      mini.on("load", () => {
        // حدود نيويورك في mini map
        try {
          mini.addSource("mini-bounds", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[
              [-74.3, 40.48], [-73.7, 40.48], [-73.7, 40.93], [-74.3, 40.93], [-74.3, 40.48],
            ]] } },
          });
          mini.addLayer({ id: "mini-bounds-fill", source: "mini-bounds", type: "fill", paint: { "fill-color": "#7fb0ff", "fill-opacity": 0.05 } });
          mini.addLayer({ id: "mini-bounds-line", source: "mini-bounds", type: "line", paint: { "line-color": "#7fb0ff", "line-width": 1, "line-opacity": 0.4 } });
        } catch (e) { /* optional */ }

        // viewport indicator — مستطيل يمثل ما تعرضه الخريطة الرئيسية
        try {
          mini.addSource("viewport", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[]] } },
          });
          mini.addLayer({ id: "viewport-fill", source: "viewport", type: "fill", paint: { "fill-color": "#7fb0ff", "fill-opacity": 0.18 } });
          mini.addLayer({ id: "viewport-line", source: "viewport", type: "line", paint: { "line-color": "#ffffff", "line-width": 1.5, "line-opacity": 0.9 } });
        } catch (e) { /* optional */ }

        updateViewport();
      });

      map.on("move", updateViewport);
      map.on("moveend", updateViewport);

      // سحب الـ viewport داخل mini map → تحريك الخريطة الرئيسية
      let dragActive = false;
      const onPointerDown = (e: MouseEvent) => {
        dragActive = true;
        e.preventDefault();
        handleDrag(e);
      };
      const onPointerMove = (e: MouseEvent) => {
        if (dragActive) handleDrag(e);
      };
      const onPointerUp = () => { dragActive = false; };
      const handleDrag = (e: MouseEvent) => {
        const mn = miniMapRef.current;
        const mm = mainMapRef.current;
        if (!mn || !mm) return;
        const rect = miniEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ll = mn.unproject([x, y]);
        // حرّك الخريطة الرئيسية إلى ذلك الموقع مع ثبات الزوم
        mm.easeTo({ center: [ll.lng, ll.lat], zoom: ZOOM, duration: 250 });
      };
      miniEl.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);

      // احتفظ بمرجع التنظيف
      miniCleanups.push(() => {
        miniEl.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        mini.remove();
      });
    }

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
      miniCleanups.forEach((c) => { try { c(); } catch (e) { /* noop */ } });
      map?.remove();
    };
  }, []);

  return (
    <div className="relative h-full w-full" data-globe>
      {/* الخريطة الرئيسية */}
      <div ref={mountRef} className={className} style={{ width: "100%", height: "100%" }} />

      {/* الخريطة المصغرة / نظرة عامة — أعلى الخريطة الرئيسية */}
      <div
        className="pointer-events-auto absolute left-4 top-4 z-20 overflow-hidden rounded-xl border border-[#3a5a86]/50 shadow-[0_10px_30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(127,176,255,0.15)]"
        style={{ width: 180, height: 180 }}
      >
        <div ref={miniRef} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-1">
          <span className="font-mono text-[0.5rem] tracking-[0.25em] uppercase text-[#9db4d8]/80">
            NYC · Overview
          </span>
        </div>
      </div>
    </div>
  );
}
