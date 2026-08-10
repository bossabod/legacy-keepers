"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, RotateCw, ZoomIn, ZoomOut, Box, ChevronDown, Globe2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import { NETWORK_CITIES, DEFAULT_CITY, type NetworkCity } from "@/lib/network-cities";

// MapLibre touches `window` and must only load in the browser (not SSR).
const NetworkMap = dynamic(() => import("@/components/sections/NetworkMap"), {
  ssr: false,
  loading: () => null,
});

/* Group cities by country for the selector. */
function groupByCountry(cities: NetworkCity[]): { country: string; cities: NetworkCity[] }[] {
  const map = new Map<string, NetworkCity[]>();
  for (const c of cities) {
    if (!map.has(c.country)) map.set(c.country, []);
    map.get(c.country)!.push(c);
  }
  return Array.from(map.entries()).map(([country, cities]) => ({ country, cities }));
}

const GROUPS = groupByCountry(NETWORK_CITIES);

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [mode3D, setMode3D] = useState(false);
  const [city, setCity] = useState<NetworkCity>(() => NETWORK_CITIES.find((c) => c.id === DEFAULT_CITY) || NETWORK_CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);

  const set3D = (on: boolean) => {
    setMode3D(on);
    const el = document.querySelector('[data-globe]');
    (el as any)?.__globeApi?.set3D?.(on);
  };

  const pickCity = (c: NetworkCity) => {
    setCity(c);
    setCityOpen(false);
    const el = document.querySelector('[data-globe]');
    (el as any)?.__globeApi?.jumpToCity?.(c.id);
    play("select");
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh - 66px)", background: "#0b0e12" }}>
      {/* header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5">
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.3em] text-[#7c8794]" style={{ fontFamily: "var(--font-mono)" }}>
            {ar ? "محور العمليات · الشبكة العالمية" : "Operations Hub · Global Network"}
          </div>
          <div className="mt-1 text-[0.8rem] tracking-[0.12em] text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>
            {city.arName || city.name}
            <span className="ml-2 text-[#7c8794]">{city.country}</span>
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

      {/* the interactive city-restricted map */}
      <div className="absolute inset-0 z-0">
        <NetworkMap initialCity={city.id} />
      </div>

      {/* city selector */}
      <div className="pointer-events-auto absolute left-4 top-4 z-20 w-56">
        <button
          onClick={() => { setCityOpen((v) => !v); play("click"); }}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#05080d]/90 px-4 py-2.5 text-[0.72rem] text-[#c3c9d3] backdrop-blur-md shadow-sm transition hover:border-white/30 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Globe2 size={14} className="text-[#8a95a3]" />
            {city.arName || city.name}
          </span>
          <ChevronDown size={14} className={`transition-transform ${cityOpen ? "rotate-180" : ""}`} />
        </button>

        {cityOpen && (
          <div className="mt-2 max-h-[55vh] overflow-y-auto rounded-xl border border-white/10 bg-[#05080d]/95 p-2 backdrop-blur-md shadow-lg">
            {GROUPS.map((g) => (
              <div key={g.country} className="mb-1">
                <div className="px-2 py-1 text-[0.55rem] uppercase tracking-[0.2em] text-[#7c8794]">
                  {g.country}
                </div>
                {g.cities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => pickCity(c)}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[0.7rem] transition ${
                      c.id === city.id ? "bg-white/15 text-white" : "text-[#c3c9d3] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{c.arName || c.name}</span>
                    <span className="text-[0.55rem] text-[#7c8794]">{c.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3D View toggle */}
      <div className="pointer-events-auto absolute left-[15.5rem] top-4 z-20 hidden sm:block">
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
