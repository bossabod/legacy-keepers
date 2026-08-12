"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { RotateCw, Box, Network as NetworkIcon } from "lucide-react";
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
  const [showNet, setShowNet] = useState(true);

  const set3D = (on: boolean) => {
    setMode3D(on);
    const el = document.querySelector('[data-globe]');
    (el as any)?.__globeApi?.set3D?.(on);
  };

  const toggleNet = () => {
    const next = !showNet;
    setShowNet(next);
    const el = document.querySelector('[data-globe]');
    (el as any)?.__globeApi?.setNetwork?.(next);
    play("click");
  };

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

      {/* the interactive map (original natural satellite) */}
      <div className="absolute inset-0 z-0">
        <NetworkMap />
      </div>

      {/* Network overlay toggle */}
      <div className="pointer-events-auto absolute left-4 top-16 z-20">
        <button
          onClick={toggleNet}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[0.72rem] backdrop-blur-md shadow-sm transition ${
            showNet
              ? "border-sky-300/60 bg-sky-400/20 text-sky-100"
              : "border-white/10 bg-[#05080d]/85 text-[#c3c9d3] hover:border-white/30 hover:text-white"
          }`}
        >
          <NetworkIcon size={15} className={showNet ? "text-sky-200" : "text-[#8a95a3]"} />
          {showNet ? (ar ? "إخفاء الشبكة" : "Hide Network") : (ar ? "إظهار الشبكة" : "Show Network")}
        </button>
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

      {/* interaction hint — pan only */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2 text-[0.48rem] uppercase tracking-[0.2em] text-[#4a515e]" style={{ fontFamily: "var(--font-mono)" }}>
        <RotateCw size={11} />
        <span>{ar ? "اسحب لتحريك الخريطة" : "Drag to pan"}</span>
      </div>
    </div>
  );
}
