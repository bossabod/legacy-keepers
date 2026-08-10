"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, RotateCw, ZoomIn, ZoomOut, Box } from "lucide-react";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";

// MapLibre touches `window` and must only load in the browser (not SSR).
const NetworkMap = dynamic(() => import("@/components/sections/NetworkMap"), {
  ssr: false,
  loading: () => null,
});

/* ==================================================================
   Network — New York City interactive map (MapLibre GL).
   Satellite (Esri) is the base mode. "3D View" toggles to a tilted
   oblique 3D perspective with real-height buildings.
   ================================================================== */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [mode3D, setMode3D] = useState(false);

  const set3D = (on: boolean) => {
    setMode3D(on);
    const el = document.querySelector('[data-globe]');
    (el as any)?.__globeApi?.set3D?.(on);
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 66px)", background: "#0b0e12" }}>
      {/* header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5">
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.3em] text-[#7c8794]" style={{ fontFamily: "var(--font-mono)" }}>
            {ar ? "محور العمليات · نيويورك" : "Operations Hub · New York"}
          </div>
          <div className="mt-1 text-[0.8rem] tracking-[0.12em] text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>
            {ar ? "خريطة الأقمار الصناعية · مدينة نيويورك" : "Satellite Map · New York City"}
          </div>
        </div>

        {/* status chip */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/10 bg-[#05080d]/80 px-4 py-2.5 backdrop-blur-md">
          <MapPin size={14} className="text-[#5d96b8]" />
          <span className="text-[0.74rem] text-[#c3c9d3]">
            {mode3D
              ? (ar ? "3D · مبانٍ وتضاريس" : "3D · Buildings + Terrain")
              : (ar ? "قمر صناعي · Esri" : "Satellite · Esri")}
          </span>
        </div>
      </div>

      {/* the interactive map (original natural satellite) */}
      <div className="absolute inset-0 z-0">
        <NetworkMap />
      </div>

      {/* 3D View toggle */}
      <div className="pointer-events-auto absolute left-4 top-4 z-20">
        <button
          onClick={() => set3D(!mode3D)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[0.72rem] backdrop-blur-md shadow-sm transition ${
            mode3D
              ? "border-sky-300/60 bg-sky-400/20 text-sky-100"
              : "border-white/10 bg-[#05080d]/85 text-[#c3c9d3] hover:border-white/30 hover:text-white"
          }`}
        >
          <Box size={15} className={mode3D ? "text-sky-200" : "text-[#8a95a3]"} />
          {mode3D ? (ar ? "إيقاف 3D" : "Exit 3D") : (ar ? "عرض ثلاثي الأبعاد" : "3D View")}
        </button>
      </div>

      {/* zoom controls */}
      <div className="absolute right-4 bottom-6 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => { const el = document.querySelector('[data-globe]'); (el as any)?.__globeApi?.zoomIn(); play("click"); }}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#05080d]/80 text-[#c3c9d3] backdrop-blur-md transition hover:border-white/30 hover:text-white"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => { const el = document.querySelector('[data-globe]'); (el as any)?.__globeApi?.zoomOut(); play("click"); }}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#05080d]/80 text-[#c3c9d3] backdrop-blur-md transition hover:border-white/30 hover:text-white"
        >
          <ZoomOut size={15} />
        </button>
      </div>

      {/* interaction hints */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 flex items-center gap-5 text-[0.48rem] uppercase tracking-[0.2em] text-[#4a515e]" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="flex items-center gap-1.5"><RotateCw size={11} /> {ar ? "اسحب للتحريك · Ctrl+سحب للتدوير" : "Drag to pan · Ctrl+drag to rotate"}</span>
        <span className="flex items-center gap-1.5"><ZoomIn size={11} /> {ar ? "عجلة أو أزرار للتكبير" : "Scroll / buttons to zoom"}</span>
      </div>
    </div>
  );
}
