"use client";
import { useEffect, useRef, useState } from "react";

/* ==================================================================
   CESIUM TEST PAGE (isolated diagnostic)
   Uses Cesium directly ONLY — no Three.js, no old map layers.
   Shows the base map, loads OSM Buildings, and prints any error
   visibly on the page so the real failure reason is readable.
   ================================================================== */

export default function CesiumTestPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const log = (m: string) => setLines((prev) => [...prev, m]);

    // surface global JS errors / rejections on the page
    const onErr = (e: ErrorEvent) => log("ERROR: " + (e.message || "unknown"));
    const onRej = (e: PromiseRejectionEvent) =>
      log("REJECTION: " + (e.reason?.message || e.reason || "unknown"));
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);

    let viewer: any = null;
    let disposed = false;
    let renderTimer = 0;

    const baseUrl = window.location.pathname.startsWith("/legacy-keepers")
      ? "/legacy-keepers/cesium/"
      : "/cesium/";
    (window as any).CESIUM_BASE_URL = baseUrl;
    log("1) CESIUM_BASE_URL = " + baseUrl);

    (async () => {
      try {
        log("2) importing cesium module…");
        const Cesium = await import("cesium");
        log("3) cesium module loaded. Viewer=" + (typeof (Cesium as any).Viewer));

        const imagery = new Cesium.UrlTemplateImageryProvider({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          maximumLevel: 19,
        });

        log("4) creating Viewer…");
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

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-74.019, 40.6912, 7000),
          orientation: {
            heading: Cesium.Math.toRadians(18),
            pitch: Cesium.Math.toRadians(-40),
            roll: 0,
          },
        });
        log("5) camera set to New York City (-74.019, 40.6912)");

        // health check — the renderer must draw a frame
        viewer.scene.postRender.addEventListener(() => {
          if (renderTimer) { clearTimeout(renderTimer); renderTimer = 0; }
          if (!disposed) log("6) Cesium is rendering frames (map should be visible)");
        });
        renderTimer = window.setTimeout(() => {
          log("ERROR: Cesium did NOT render a frame within 8s (WebGL / renderer problem?)");
        }, 8000);

        // OSM Buildings — official Cesium layer
        try {
          log("7) loading Cesium OSM Buildings…");
          const tileset = await Cesium.createOsmBuildingsAsync();
          viewer.scene.primitives.add(tileset);
          log("8) OSM Buildings added OK");
        } catch (e: any) {
          log("WARN: OSM Buildings failed -> " + (e?.message || String(e)));
          log("      base map stays visible");
        }
      } catch (e: any) {
        log("FATAL: " + (e?.message || String(e)));
        log("      " + (e?.stack?.split("\n")[1] || ""));
      }
    })();

    return () => {
      disposed = true;
      if (renderTimer) clearTimeout(renderTimer);
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      try { if (viewer && !viewer.isDestroyed()) viewer.destroy(); } catch { /* noop */ }
    };
  }, []);

  return (
    <div style={{ fontFamily: "monospace", position: "fixed", inset: 0, background: "#0f1720", color: "#d6e4ef" }}>
      <div style={{ padding: 10, borderBottom: "1px solid #2a3a48", maxHeight: "30vh", overflow: "auto" }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Cesium Test — diagnostic log</div>
        {lines.length === 0 && <div>waiting…</div>}
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.startsWith("ERROR") || l.startsWith("FATAL") ? "#ff6b6b" : l.startsWith("WARN") ? "#ffd166" : "#9fd0e6", whiteSpace: "pre-wrap" }}>{l}</div>
        ))}
      </div>
      <div ref={mountRef} style={{ position: "absolute", inset: 0, top: "30vh" }} />
    </div>
  );
}
