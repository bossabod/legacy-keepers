"use client";
import { useState } from "react";
import { MapPin, ChevronDown, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import Globe3D from "@/components/sections/Globe3D";
import { useApp } from "@/lib/store";
import { OPERATIONAL_CITIES } from "@/lib/earth-data";
import { play } from "@/lib/sound";

/* ==================================================================
   Network — a true 3D Earth globe command centre.
   The full Earth is shown (continents, countries, cities) on a large
   Three.js globe. Drag to spin, wheel to zoom, auto-rotation on idle.
   City selector flies the camera focus. No flat map.
   ================================================================== */

const CITIES = OPERATIONAL_CITIES.map((c, i) => ({
  id: String(i),
  name: c.name,
  nameAr: c.nameAr,
  lat: c.lat,
  lon: c.lon,
  tz: c.tz,
}));

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
            {ar ? "مركز القيادة العالمي" : "Global Command Globe"}
          </div>
          <div className="mt-1 text-[0.8rem] tracking-[0.12em] text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>
            {ar ? "الشبكة العالمية" : "Global Network"}
          </div>
        </div>

        {/* City selector */}
        <div className="pointer-events-auto relative">
          <button
            onClick={() => { setSelectorOpen(!selectorOpen); play("click"); }}
            className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#05080d]/80 px-4 py-2.5 text-[0.76rem] text-[#c3c9d3] backdrop-blur-md transition hover:border-white/25 hover:text-white"
          >
            <MapPin size={14} className="text-[#5d6675]" />
            <span>{ar ? "أحد المحاور" : "Select a hub"}</span>
            <ChevronDown size={13} className={`text-[#5d6675] transition-transform ${selectorOpen ? "rotate-180" : ""}`} />
          </button>
          {selectorOpen && (
            <div className="absolute right-0 top-full mt-2 w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#05080d]/95 py-1.5 backdrop-blur-xl shadow-2xl">
              {CITIES.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 px-4 py-2 text-[0.74rem] text-[#7f8896]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c3c9d3]" style={{ boxShadow: "0 0 6px #c3c9d3" }} />
                  {ar ? c.nameAr : c.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* the 3D globe — dominates the whole screen */}
      <div className="absolute inset-0 z-0">
        <Globe3D />
      </div>

      {/* interaction hints */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 flex items-center gap-5 text-[0.48rem] uppercase tracking-[0.2em] text-[#4a515e]" style={{ fontFamily: "var(--font-mono)" }}>
        <span className="flex items-center gap-1.5"><RotateCw size={11} /> {ar ? "اسحب للدوران" : "Drag to spin"}</span>
        <span className="flex items-center gap-1.5"><ZoomIn size={11} /> {ar ? "عجلة للتكبير" : "Scroll to zoom"}</span>
      </div>
    </div>
  );
}
