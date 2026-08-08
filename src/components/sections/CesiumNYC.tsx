"use client";
import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Color,
  EllipsoidTerrainProvider,
  ImageryLayer,
  Math as CesiumMath,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  Viewer,
  createOsmBuildingsAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

/* ==================================================================
   CesiumNYC — the REAL New York City as an interactive 3D map.

   Uses the official Cesium OSM Buildings layer (createOsmBuildingsAsync)
   as a real 3D Tiles layer over a light, Apple-Maps-style base map
   (Carto "light_all" imagery). Everything is one georeferenced Cesium
   scene, so the buildings are truly part of the 3D globe — they appear
   as you zoom in, and move/scale in sync with the camera.

   • Camera starts on New York City (lower Manhattan).
   • Zoom in → real 3D buildings stream in per camera position.
   • Fail-safe: if the tileset fails to load within a timeout, onFail()
     is called so the page switches to the offline base map — it never
     shows an endless loading screen.
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

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    let disposed = false;
    let viewer: Viewer | null = null;
    let success = false;
    let timer = 0;

    // point Cesium at its static assets (workers/widgets) on this server
    const baseUrl = window.location.pathname.startsWith("/legacy-keepers")
      ? "/legacy-keepers/cesium/"
      : "/cesium/";
    (window as any).CESIUM_BASE_URL = baseUrl;

    const cleanup = () => {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewer = null;
    };

    const fail = () => {
      if (success || disposed) return;
      cleanup();
      onFailRef.current?.();
    };

    try {
      const imagery = new UrlTemplateImageryProvider({
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        subdomains: ["a", "b", "c", "d"],
        maximumLevel: 19,
      });

      viewer = new Viewer(el, {
        baseLayer: new ImageryLayer(imagery),
        terrainProvider: new EllipsoidTerrainProvider(),
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
      viewer.scene.globe.baseColor = Color.fromCssColorString("#e8e4d8");
      viewer.scene.highDynamicRange = false;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      // disable Cesium's own double-click zoom widget etc.
      viewer.screenSpaceEventHandler?.setInputAction(() => {}, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

      // start the camera on New York City
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(-74.019, 40.6912, 7000),
        orientation: {
          heading: CesiumMath.toRadians(18),
          pitch: CesiumMath.toRadians(-40),
          roll: 0,
        },
      });

      // zoom API used by the page's +/− buttons
      (el as any).__globeApi = {
        zoomIn: () => {
          if (viewer && !viewer.isDestroyed()) viewer.camera.zoomIn(Math.max(80, viewer.camera.getMagnitude() * 0.45));
        },
        zoomOut: () => {
          if (viewer && !viewer.isDestroyed()) viewer.camera.zoomOut(viewer.camera.getMagnitude() * 0.5);
        },
      };

      // Real OSM Buildings — official Cesium layer (no Overpass).
      timer = window.setTimeout(fail, 14000);
      createOsmBuildingsAsync()
        .then((tileset) => {
          if (disposed) return;
          viewer?.scene.primitives.add(tileset);
          success = true;
          if (timer) { clearTimeout(timer); timer = 0; }
        })
        .catch(() => fail());
    } catch {
      fail();
    }

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={mountRef} data-globe className={className} style={{ width: "100%", height: "100%" }} />
  );
}
