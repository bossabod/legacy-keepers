"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";

// Leaflet touches `window` and must only load in the browser (not SSR).
const NetworkMap = dynamic(() => import("@/components/sections/NetworkMap"), {
  ssr: false,
  loading: () => null,
});

/* ==================================================================
   Network — a flat 2D map of New York City (Leaflet + OSM tiles).
   Instant render, drag to pan, scroll / buttons to zoom. Dark styling
   matches the site. No 3D buildings, no loading screen.
   ================================================================== */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 66px)", background: "#0b0e12" }}>
      {/* header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5">
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.3em] text-[#7c8794]" style={{ fontFamily: "var(--font-mono)" }}>
            {ar ? "محور العمليات · نيويورك" : "Operations Hub · New York"}
          </div>
          <div className="mt-1 text-[0.8rem] tracking-[0.12em] text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>
            {ar ? "خريطة 2D · مدينة نيويورك" : "2D Map · New York City"}
          </div>
        </div>

        {/* status chip */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/10 bg-[#05080d]/80 px-4 py-2.5 backdrop-blur-md">
          <MapPin size={14} className="text-[#5d96b8]" />
          <span className="text-[0.74rem] text-[#c3c9d3]">{ar ? "خريطة حية · OpenStreetMap" : "Live Map · OpenStreetMap"}</span>
        </div>
      </div>

      {/* the flat 2D map */}
      <div className="absolute inset-0 z-0">
        <NetworkMap />
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
        <span className="flex items-center gap-1.5"><RotateCw size={11} /> {ar ? "اسحب لتحريك الخريطة" : "Drag to pan"}</span>
        <span className="flex items-center gap-1.5"><ZoomIn size={11} /> {ar ? "عجلة أو أزرار للتكبير" : "Scroll / buttons to zoom"}</span>
      </div>

      {/* leaflet tiles dark filter for visual consistency */}
      <style>{`
        .leaflet-tile { filter: brightness(0.85) contrast(1.05) saturate(0.6); }
        .leaflet-container { background: #0b0e12; font: inherit; }
        .leaflet-control-zoom a {
          background: #0a0d12; color: #c3c9d3; border: 1px solid #1f2831;
        }
        .leaflet-control-zoom a:hover { background: #151a21; color: #fff; }
        .leaflet-bar { border: 1px solid #1f2831; }
        .leaflet-control-attribution {
          background: rgba(10,13,18,0.7) !important; color: #6b7684; font-size: 9px;
        }
        .leaflet-control-attribution a { color: #8aa0b3; }
      `}</style>
    </div>
  );
}
