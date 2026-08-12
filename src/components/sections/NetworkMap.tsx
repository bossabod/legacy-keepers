"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildNodesGeoJSON, buildLinksGeoJSON } from "@/lib/network-links";
import { NAV_COUNTRIES, findCity, DEFAULT_CITY_ID, type NavCity } from "@/lib/network-cities";

/* ==================================================================
   NetworkMap — interactive city-navigable satellite map (MapLibre GL).
   • Main map: close zoom (buildings/streets), drag to pan only within
     the current city bounds, zoom locked after arrival.
   • Mini/overview map: whole city region from afar with a live
     Viewport Rectangle synced to the main camera (both directions).
   • Cinematic travel between cities: zoom-out steps → fade-to-black →
     zoom-in steps → lock at the city's detail zoom.
   Satellite (Esri), filter, layers, and design stay unchanged.
   Exposes: flyToCity(id), zoomIn/zoomOut (no-op), setNetwork(bool).
   ================================================================== */

export default function NetworkMap({ className = "" }: { className?: string }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const miniRef = useRef<HTMLDivElement | null>(null);
  const miniMapRef = useRef<MapLibreMap | null>(null);
  const mainMapRef = useRef<MapLibreMap | null>(null);
  const currentCityRef = useRef<NavCity>(findCity(DEFAULT_CITY_ID)!);
  const [blur, setBlur] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let map: MapLibreMap | null = null;
    const miniCleanups: (() => void)[] = [];
    let locked = false;

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
      center: currentCityRef.current.center,
      zoom: currentCityRef.current.zoom,
      pitch: 0,
      bearing: 0,
      maxPitch: 65,
      maxBounds: currentCityRef.current.bounds,
      dragRotate: true,
      pitchWithRotate: true,
      attributionControl: false,
      scrollZoom: false,
      boxZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      keyboard: false,
      dragPan: true,
      canvasContextAttributes: { antialias: true },
    });
    mainMapRef.current = map;

    // ---- قفل / فتح الزوم ----
    const lockZoom = (city: NavCity) => {
      locked = true;
      if (!map) return;
      map.setMinZoom(city.zoom);
      map.setMaxZoom(city.zoom);
      map.setMaxBounds(city.bounds);
      if (map.getZoom() !== city.zoom) map.setZoom(city.zoom);
    };
    const unlockZoom = () => {
      locked = false;
      if (!map) return;
      map.setMinZoom(1);
      map.setMaxZoom(22);
    };
    map.on("zoom", () => {
      if (locked && map) map.setZoom(currentCityRef.current.zoom);
    });

    // ---- تحديث مستطيل الـ viewport في الخريطة المصغرة ----
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

    // ---- إنشاء الخريطة المصغرة ----
    const miniEl = miniRef.current;
    if (miniEl) {
      const mini = new maplibregl.Map({
        container: miniEl,
        style,
        center: currentCityRef.current.center,
        zoom: 9,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        scrollZoom: false,
        boxZoom: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        keyboard: false,
        dragPan: false,
        interactive: true,
      });
      miniMapRef.current = mini;

      mini.on("load", () => {
        try {
          mini.addSource("mini-bounds", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[]] } },
          });
          mini.addLayer({ id: "mini-bounds-fill", source: "mini-bounds", type: "fill", paint: { "fill-color": "#7fb0ff", "fill-opacity": 0.05 } });
          mini.addLayer({ id: "mini-bounds-line", source: "mini-bounds", type: "line", paint: { "line-color": "#7fb0ff", "line-width": 1, "line-opacity": 0.4 } });
        } catch (e) { /* optional */ }
        try {
          mini.addSource("viewport", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[]] } },
          });
          mini.addLayer({ id: "viewport-fill", source: "viewport", type: "fill", paint: { "fill-color": "#7fb0ff", "fill-opacity": 0.18 } });
          mini.addLayer({ id: "viewport-line", source: "viewport", type: "line", paint: { "line-color": "#ffffff", "line-width": 1.5, "line-opacity": 0.9 } });
        } catch (e) { /* optional */ }
        updateMiniForCity(currentCityRef.current);
        updateViewport();
      });

      // تحديث الخريطة المصغرة حسب المدينة
      const updateMiniForCity = (city: NavCity) => {
        const mn = miniMapRef.current;
        if (!mn) return;
        // حدود المدينة في المصغرة
        const src = mn.getSource("mini-bounds") as any;
        if (src) {
          src.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[
                [city.bounds[0][0], city.bounds[0][1]],
                [city.bounds[1][0], city.bounds[0][1]],
                [city.bounds[1][0], city.bounds[1][1]],
                [city.bounds[0][0], city.bounds[1][1]],
                [city.bounds[0][0], city.bounds[0][1]],
              ]],
            },
          });
        }
        try { mn.fitBounds(city.bounds, { padding: 6, duration: 0 }); } catch (e) { /* optional */ }
      };

      map.on("move", updateViewport);
      map.on("moveend", updateViewport);

      // سحب الـ viewport في المصغرة → تحريك الرئيسية
      let dragActive = false;
      const onPointerDown = (e: MouseEvent) => { dragActive = true; e.preventDefault(); handleDrag(e); };
      const onPointerMove = (e: MouseEvent) => { if (dragActive) handleDrag(e); };
      const onPointerUp = () => { dragActive = false; };
      const handleDrag = (e: MouseEvent) => {
        const mn = miniMapRef.current;
        const mm = mainMapRef.current;
        if (!mn || !mm) return;
        const rect = miniEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ll = mn.unproject([x, y]);
        mm.easeTo({ center: [ll.lng, ll.lat], zoom: currentCityRef.current.zoom, duration: 250 });
      };
      miniEl.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      miniCleanups.push(() => {
        miniEl.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        mini.remove();
      });
    }

    // ---- بناء مدينة (تثبيت الحدود والزوم) ----
    const applyCity = (city: NavCity) => {
      currentCityRef.current = city;
      const mn = miniMapRef.current;
      if (mn) {
        const src = mn.getSource("mini-bounds") as any;
        if (src) {
          src.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[
                [city.bounds[0][0], city.bounds[0][1]],
                [city.bounds[1][0], city.bounds[0][1]],
                [city.bounds[1][0], city.bounds[1][1]],
                [city.bounds[0][0], city.bounds[1][1]],
                [city.bounds[0][0], city.bounds[0][1]],
              ]],
            },
          });
        }
        try { mn.fitBounds(city.bounds, { padding: 6, duration: 0 }); } catch (e) { /* optional */ }
      }
      lockZoom(city);
    };

    // ---- الانتقال السينمائي: 3 سحبات Zoom Out → ظلام/Blur → 3 سحبات Zoom In ----
    const flyToCity = (id: string) => {
      const city = findCity(id);
      if (!city || !map) return;
      unlockZoom();
      // سحبات منفصلة سريعة (duration ~450ms) مع توقفات قصيرة (~500ms < ثانية)
      // Zoom Out 1
      map.easeTo({ zoom: 9, duration: 450 });
      // Zoom Out 2 (أبعد)
      setTimeout(() => { map?.easeTo({ zoom: 5, duration: 450 }); }, 950);
      // Zoom Out 3 (مستوى العالم)
      setTimeout(() => { map?.easeTo({ zoom: 2, duration: 450 }); }, 1900);
      // بعد السحبة الثالثة: لحظة قصيرة ثم ظلام + Blur
      setTimeout(() => { setBlur(true); }, 2500);
      // أثناء الظلام: انقل المركز إلى المدينة الجديدة بالضبط
      setTimeout(() => {
        map?.jumpTo({ center: city.center, zoom: 2 });
        map?.setMaxBounds(city.bounds);
      }, 3000);
      // اكشف المشهد الجديد من فوق المدينة وابدأ الدخول
      setTimeout(() => {
        setBlur(false);
        map?.easeTo({ zoom: 6, duration: 450 }); // Zoom In 1
      }, 3500);
      // Zoom In 2
      setTimeout(() => { map?.easeTo({ zoom: 11, duration: 450 }); }, 4400);
      // Zoom In 3 الأخير حتى مستوى المدينة
      setTimeout(() => { map?.easeTo({ zoom: city.zoom, duration: 550 }); }, 5300);
      setTimeout(() => { applyCity(city); }, 6000);
    };

    // تحميل الرئيسية (تثبيت الحدود + المصغرة)
    map.on("load", () => {
      try { map?.setTerrain({ source: "terrain", exaggeration: 1.2 }); } catch (e) { /* optional */ }
      try {
        map?.addSource("openfreemap", { type: "vector", url: "https://tiles.openfreemap.org/planet" });
        map?.addLayer({
          id: "3d-buildings", source: "openfreemap", "source-layer": "building", type: "fill-extrusion",
          minzoom: 15, filter: ["!=", ["get", "hide_3d"], true], layout: { visibility: "none" },
          paint: {
            "fill-extrusion-color": ["interpolate", ["linear"], ["get", "render_height"], 0, "#c9c4b8", 90, "#9e998e", 200, "#8b867b", 350, "#7d7870"],
            "fill-extrusion-opacity": 0.9,
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 16, ["get", "render_height"]],
            "fill-extrusion-base": ["case", [">=", ["get", "zoom"], 16], ["get", "render_min_height"], 0],
          },
        });
      } catch (e) { /* optional */ }
      // الشبكة
      try {
        map?.addSource("net-nodes", { type: "geojson", data: buildNodesGeoJSON() as any });
        map?.addSource("net-links", { type: "geojson", data: buildLinksGeoJSON() as any });
        map?.addLayer({ id: "net-link-glow", source: "net-links", type: "line", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#2a7fff", "line-width": 2.2, "line-opacity": 0.18 } });
        map?.addLayer({ id: "net-link", source: "net-links", type: "line", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#3d8bff", "line-width": 1, "line-opacity": 0.7 } });
        map?.addLayer({ id: "net-node-halo", source: "net-nodes", type: "circle", paint: { "circle-radius": ["case", ["get", "hub"], 7, 5], "circle-color": "#ffffff", "circle-opacity": 0.25, "circle-blur": 0.9 } });
        map?.addLayer({ id: "net-node", source: "net-nodes", type: "circle", paint: { "circle-radius": ["case", ["get", "hub"], 3.2, 2.4], "circle-color": "#ffffff", "circle-opacity": 0.95, "circle-stroke-color": "#9cc4ff", "circle-stroke-width": 0.8 } });
      } catch (e) { /* optional */ }
      lockZoom(currentCityRef.current);
    });

    const api = {
      zoomIn: () => { if (map && locked) map.setZoom(currentCityRef.current.zoom); },
      zoomOut: () => { if (map && locked) map.setZoom(currentCityRef.current.zoom); },
      flyToCity: (id: string) => flyToCity(id),
      setNetwork: (on: boolean) => {
        if (!map) return;
        const ids = ["net-link-glow", "net-link", "net-node-halo", "net-node"];
        for (const id of ids) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
      },
    };
    (el as any).__globeApi = api;
    // عيّن الـ api أيضًا على الحاوية الخارجية (الأب) ليصل إليه querySelector('[data-globe]')
    if (el.parentElement) (el.parentElement as any).__globeApi = api;

    const ro = new ResizeObserver(() => map?.resize());
    ro.observe(el);

    return () => {
      ro.disconnect();
      miniCleanups.forEach((c) => { try { c(); } catch (e) { /* noop */ } });
      map?.remove();
    };
  }, []);

  return (
    <div className="relative h-full w-full" data-globe ref={outerRef}>
      {/* الخريطة الرئيسية */}
      <div ref={mountRef} className={className} style={{ width: "100%", height: "100%" }} />

      {/* الخريطة المصغرة / نظرة عامة */}
      <div
        className="pointer-events-auto absolute left-4 top-4 z-20 overflow-hidden rounded-xl border border-[#3a5a86]/50 shadow-[0_10px_30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(127,176,255,0.15)]"
        style={{ width: 170, height: 170 }}
      >
        <div ref={miniRef} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-1">
          <span className="font-mono text-[0.5rem] tracking-[0.25em] uppercase text-[#9db4d8]/80">Overview</span>
        </div>
      </div>

      {/* ظلام + Blur أثناء الانتقال */}
      {blur && (
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", transition: "opacity 0.35s ease" }}
        />
      )}
    </div>
  );
}

export { NAV_COUNTRIES };
