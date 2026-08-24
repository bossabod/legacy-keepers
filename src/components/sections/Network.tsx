"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { RotateCw, ChevronDown, MapPin, Navigation, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { NAV_COUNTRIES } from "@/lib/network-cities";

// MapLibre touches `window` and must only load in the browser (not SSR).
const NetworkMap = dynamic(() => import("@/components/sections/NetworkMap"), {
  ssr: false,
  loading: () => null,
});

/* ==================================================================
   Network — New York City interactive map (MapLibre GL).
   Satellite (Esri) base + architectural dark filter. A top navigation
   button opens a small elegant countries→cities dropdown. Cinematic
   travel (zoom out ×3 → blur → zoom in ×3) on pick.
   ================================================================== */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [panelOpen, setPanelOpen] = useState(false);
  const [openCountry, setOpenCountry] = useState<string | null>(null);

  const travelTo = (cityId: string) => {
    setPanelOpen(false);
    setOpenCountry(null);
    const el = document.querySelector('[data-globe]');
    (el as any)?.__globeApi?.flyToCity?.(cityId);
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 66px)", background: "#0b0e12" }}>
      {/* header — العنوان في منتصف الأعلى */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center justify-start pt-5">
        <div className="text-center">
          <div className="text-[0.5rem] uppercase tracking-[0.3em] text-[#7c8794]" style={{ fontFamily: "var(--font-mono)" }}>
            {ar ? "محور العمليات · شبكة المدن" : "Operations Hub · City Network"}
          </div>
          <div className="mt-1 text-[0.95rem] tracking-[0.12em] text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)", textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
            {ar ? "التنقل بين المدن" : "City Navigation"}
          </div>
        </div>
      </div>

      {/* the interactive map */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full map-high-contrast">
          <NetworkMap />
        </div>
      </div>

      {/* زر التنقل — أعلى الخريطة */}
      <div className="pointer-events-auto absolute left-1/2 top-3 z-20 -translate-x-1/2">
        <button
          onClick={() => { setPanelOpen((v) => !v); setOpenCountry(null); }}
          className="flex items-center gap-2 rounded-xl border border-[#3a5a86]/50 bg-[#0a0c12]/85 px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.2em] text-[#c3c9d3] backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(127,176,255,0.12)] transition hover:border-[#7fb0ff]/60 hover:text-white"
        >
          <Navigation size={14} className="text-[#7fb0ff]" />
          {ar ? "تنقل المدن" : "City Navigation"}
          {panelOpen ? <X size={13} className="text-[#7fb0ff]/70" /> : <ChevronDown size={13} className="text-[#7fb0ff]/70" />}
        </button>

        {/* القائمة المنسدلة */}
        {panelOpen && (
          <div className="absolute left-1/2 top-full mt-2 w-60 -translate-x-1/2 overflow-hidden rounded-xl border border-[#3a5a86]/40 bg-[#0a0c12]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(127,176,255,0.12)]">
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {NAV_COUNTRIES.map((country) => {
                const open = openCountry === country.id;
                return (
                  <div key={country.id} className="mb-0.5">
                    <button
                      onClick={() => setOpenCountry(open ? null : country.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[0.78rem] tracking-[0.05em] text-[#c3c9d3] transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={12} className="text-[#7fb0ff]/70" />
                        {country.name}
                      </span>
                      <ChevronDown size={13} className={`text-[#7fb0ff]/70 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                    </button>

                    {open && (
                      <div className="ml-4 border-l border-[#3a5a86]/30 pl-2">
                        {country.cities.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => travelTo(c.id)}
                            className="block w-full rounded-md px-3 py-1.5 text-left text-[0.72rem] text-[#8b95a5] transition-colors hover:bg-sky-400/10 hover:text-sky-100"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
