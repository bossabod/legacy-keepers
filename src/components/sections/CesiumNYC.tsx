"use client";
import { useEffect, useRef, useState } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";

/* ==================================================================
   CesiumNYC — the REAL New York City as an interactive 3D map using
   CesiumJS + the official Cesium OSM Buildings layer.

   Robust loading order (never a white screen):
     1. Set window.CESIUM_BASE_URL BEFORE importing Cesium, so its
        workers/widgets load from the right path.
     2. `await import("cesium")` — client-side only (never SSR).
     3. Create the Viewer + a light Apple-Maps-style base imagery.
        This is the BASE MAP and it always renders once the viewer is up.
     4. Add OSM Buildings as a layer on top; if it fails, the base map
        stays visible (buildings simply don't appear).
     5. A "first rendered frame" health-check: if Cesium can't start
        rendering within a timeout, onFail() is called so the page
        switches to the offline base map. Nothing ever stays white.

   Camera starts on New York City (lower Manhattan).
   ================================================================== */

export default function CesiumNYC({
  className = "",
  onFail,
}: {
  className?: string;
  onFail?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;
  const [status, setStatus] = useState<"init" | "map" | "error">("init");

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let disposed = false;
    let viewer: any = null;
    let renderTimer = 0;
    let succeeded = false;

    // Must be set before Cesium module is evaluated.
    const baseUrl = window.location.pathname.startsWith("/legacy-keepers")
      ? "/legacy-keepers/cesium/"
      : "/cesium/";
    (window as any).CESIUM_BASE_URL = baseUrl;

    const cleanup = () => {
      if (renderTimer) { clearTimeout(renderTimer); renderTimer = 0; }
      try { if (viewer && !viewer.isDestroyed()) viewer.destroy(); } catch { /* noop */ }
      viewer = null;
    };
    const fail = (err?: unknown) => {
      if (succeeded || disposed) return;
      if (err) console.error("[CesiumNYC] init failed:", err);
      cleanup();
      if (!disposed) { setStatus("error"); onFailRef.current?.(); }
    };

    (async () => {
      try {
        const Cesium = await import("cesium");
        if (disposed) return;

        const imagery = new Cesium.UrlTemplateImageryProvider({
          url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          subdomains: ["a", "b", "c", "d"],
          maximumLevel: 19,
        });

        viewer = new Cesium.Viewer(el, {
          baseLayer: new Cesium.ImageryLayer(imagery),
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          shouldAnimate: false,
        });
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#dbe8f0");
        viewer.scene.highDynamicRange = false;
        viewer.screenSpaceEventHandler?.setInputAction(
          () => {},
          Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
        );

        // Start camera on New York City.
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-74.019, 40.6912, 7000),
          orientation: {
            heading: Cesium.Math.toRadians(18),
            pitch: Cesium.Math.toRadians(-40),
            roll: 0,
          },
        });

        // Zoom API used by the page's +/− buttons.
        (el as any).__globeApi = {
          zoomIn: () => {
            if (viewer && !viewer.isDestroyed()) viewer.camera.zoomIn(Math.max(80, viewer.camera.getMagnitude() * 0.45));
          },
          zoomOut: () => {
            if (viewer && !viewer.isDestroyed()) viewer.camera.zoomOut(viewer.camera.getMagnitude() * 0.5);
          },
        };

        // Health check: the base map counts as "working" once the first
        // frame renders. If Cesium can't render at all → fallback.
        viewer.scene.postRender.addEventListener(() => {
          succeeded = true;
          if (renderTimer) { clearTimeout(renderTimer); renderTimer = 0; }
          if (!disposed) setStatus("map");
        });
        renderTimer = window.setTimeout(() => fail(new Error("Cesium did not render within timeout")), 8000);

        // OSM Buildings — official Cesium layer (no Overpass). This is
        // additive: if it fails, the base map above stays visible.
        try {
          const tileset = await Cesium.createOsmBuildingsAsync();
          if (disposed) return;
          viewer.scene.primitives.add(tileset);
        } catch (e) {
          console.error("[CesiumNYC] OSM Buildings failed (base map stays):", e);
        }
      } catch (e) {
        fail(e);
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} data-globe className={className} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {status !== "map" && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/60 bg-white/75 px-4 py-1.5 text-[0.62rem] text-[#4a5a68] shadow-sm backdrop-blur-md">
          جارٍ تهيئة خريطة Cesium…
        </div>
      )}
    </div>
  );
}
