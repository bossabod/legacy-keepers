"use client";
import dynamic from "next/dynamic";
import { RotateCw } from "lucide-react";
import { useApp } from "@/lib/store";

// MapLibre touches `window` and must only load in the browser (not SSR).
const NetworkMap = dynamic(() => import("@/components/sections/NetworkMap"), {
  ssr: false,
  loading: () => null,
});

/* ==================================================================
   Network — New York City interactive map (MapLibre GL).
   Satellite (Esri) base. Zoom locked close to buildings/streets, drag
   to pan only. Includes a linked mini/overview map.
   ================================================================== */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 66px)", background: "#0b0e12" }}>
      {/* header — العنوان في منتصف الأعلى */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center justify-start pt-5">
        <div className="text-center">
          <div className="text-[0.5rem] uppercase tracking-[0.3em] text-[#7c8794]" style={{ fontFamily: "var(--font-mono)" }}>
            {ar ? "محور العمليات · نيويورك" : "Operations Hub · New York"}
          </div>
          <div className="mt-1 text-[0.95rem] tracking-[0.12em] text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)", textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
            {ar ? "مدينة نيويورك" : "New York City"}
          </div>
        </div>
      </div>

      {/* the interactive map (original natural satellite) + high-contrast filter */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full map-high-contrast">
          <NetworkMap />
        </div>
      </div>

      {/* interaction hint — pan only */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 text-[0.48rem] uppercase tracking-[0.2em] text-[#4a515e]" style={{ fontFamily: "var(--font-mono)" }}>
        <RotateCw size={11} />
        <span>{ar ? "اسحب لتحريك الخريطة" : "Drag to pan"}</span>
      </div>

      {/* CSS-only warm architectural dark-tone filter — does NOT change the map */}
      <style>{`
        .map-high-contrast {
          filter: grayscale(1) sepia(0.42) brightness(0.72) contrast(1.18) saturate(1.1);
        }
        .map-high-contrast canvas {
          background: #191512;
        }
      `}</style>
    </div>
  );
}
