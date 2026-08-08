"use client";
import { useState } from "react";
import { MapPin, ChevronDown, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import NYC3D from "@/components/sections/NYC3D";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";

/* ==================================================================
   Network — a cinematic 3D model of New York City (Manhattan skyline).
   Dense procedural towers + iconic landmarks, drag to rotate, scroll
   / buttons to zoom, slow auto-orbit.
   ================================================================== */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [selectorOpen, setSelectorOpen] = useState(false);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 66px)", background: "radial-gradient(ellipse 80% 80% at 50% 50%, #0a1420 0%, #05080d 55%, #020304 100%)" }}>
      {/* header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: "var(--font-mono)" }}>
            {ar ? "محور العمليات · نيويورك" : "Operations Hub · New York"}
          </div>
          <div className="mt-1 text-[0.8rem] tracking-[0.12em] text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>
            {ar ? "مانهاتن · سكاي لاين" : "Manhattan · Skyline"}
          </div>
        </div>

        {/* status chip */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-white/10 bg-[#05080d]/80 px-4 py-2.5 backdrop-blur-md">
          <MapPin size={14} className="text-[#5d6675]" />
          <span className="text-[0.74rem] text-[#c3c9d3]">{ar ? "مدينة واحدة" : "Single City View"}</span>
        </div>
      </div>

      {/* the 3D city — dominates the whole screen */}
      <div className="absolute inset-0 z-0">
        <NYC3D />
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
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 flex items-center gap-5 text-[0.48rem] uppercase tracking-[0.2em] text-[#4a515e]" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="flex items-center gap-1.5"><RotateCw size={11} /> {ar ? "اسحب للتدوير" : "Drag to orbit"}</span>
        <span className="flex items-center gap-1.5"><ZoomIn size={11} /> {ar ? "عجلة أو أزرار للتكبير" : "Scroll / buttons to zoom"}</span>
      </div>
    </div>
  );
}

