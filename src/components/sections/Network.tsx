"use client";
import { useState } from "react";
import { MapPin, ChevronDown, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import CesiumNYC from "@/components/sections/CesiumNYC";
import NYC3D from "@/components/sections/NYC3D";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";

/* ==================================================================
   Network — the REAL New York City as an interactive 3D map.
   Uses the official Cesium OSM Buildings layer (real 3D buildings that
   stream in as you zoom) over a light Apple-Maps-style base map.
   Drag to look around, scroll / buttons to zoom.
   If Cesium cannot start rendering (offline / blocked / no WebGL), it
   falls back to the local base map — the page never stays white.
   ================================================================== */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [cesiumFailed, setCesiumFailed] = useState(false);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 66px)", background: "radial-gradient(ellipse 80% 80% at 50% 50%, #e6eef4 0%, #d4e3ec 55%, #c2d8e6 100%)" }}>
      {/* header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.3em] text-[#6b7a88]" style={{ fontFamily: "var(--font-mono)" }}>
            {ar ? "محور العمليات · نيويورك" : "Operations Hub · New York"}
          </div>
          <div className="mt-1 text-[0.8rem] tracking-[0.12em] text-[#3c4a58]" style={{ fontFamily: "var(--font-luxury)" }}>
            {ar ? "مانهاتن · سكاي لاين" : "Manhattan · Skyline"}
          </div>
        </div>

        {/* status chip */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-4 py-2.5 backdrop-blur-md shadow-sm">
          <MapPin size={14} className="text-[#5d96b8]" />
          <span className="text-[0.74rem] text-[#4a5a68]">{ar ? "مدينة واحدة · ثابتة" : "Single City · Stationary"}</span>
        </div>
      </div>

      {/* the real 3D city — Cesium OSM Buildings, with local fallback */}
      <div className="absolute inset-0 z-0">
        {cesiumFailed ? <NYC3D /> : <CesiumNYC onFail={() => setCesiumFailed(true)} />}
      </div>

      {/* zoom controls */}
      <div className="absolute right-4 bottom-6 z-20 flex flex-col gap-1.5">
        <button
          onClick={() => { const el = document.querySelector('[data-globe]'); (el as any)?.__globeApi?.zoomIn(); play("click"); }}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/70 bg-white/70 text-[#4a5a68] shadow-sm backdrop-blur-md transition hover:border-white hover:bg-white hover:text-[#2c3946]"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => { const el = document.querySelector('[data-globe]'); (el as any)?.__globeApi?.zoomOut(); play("click"); }}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/70 bg-white/70 text-[#4a5a68] shadow-sm backdrop-blur-md transition hover:border-white hover:bg-white hover:text-[#2c3946]"
        >
          <ZoomOut size={15} />
        </button>
      </div>

      {/* interaction hints */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 flex items-center gap-5 text-[0.48rem] uppercase tracking-[0.2em] text-[#5c7184]" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="flex items-center gap-1.5"><RotateCw size={11} /> {ar ? "اسحب للتحريك (لا تدور تلقائيًا)" : "Drag to look around · no auto-spin"}</span>
        <span className="flex items-center gap-1.5"><ZoomIn size={11} /> {ar ? "اقترب لرؤية المباني ثلاثية الأبعاد" : "Zoom in to see 3D buildings"}</span>
      </div>
    </div>
  );
}
