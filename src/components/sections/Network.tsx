"use client";
import { RotateCw } from "lucide-react";
import { useApp } from "@/lib/store";
import GlobalCommandGlobe from "@/components/GlobalCommandGlobe";

/* ==================================================================
   Network — full-bleed GLOBAL COMMAND NETWORK globe.
   Complete rectangular container, globe centered & fixed-size,
   drag-to-rotate only (no zoom).
   ================================================================== */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 66px)" }}>
      {/* Full container with clear four edges — no crop / no overflow */}
      <div
        className="absolute inset-3 sm:inset-4 lg:inset-5 flex flex-col overflow-hidden rounded-xl border border-[#2a2a2a]"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, #0e0e0e 0%, #080808 55%, #050505 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.65)",
        }}
      >
        {/* Header inside the container */}
        <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-[#1a1a1a] px-5 py-3.5 sm:px-7">
          <div>
            <div
              className="text-[0.5rem] uppercase tracking-[0.3em] text-[#6e6e6e]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {ar ? "محور العمليات · 5 عقد" : "Operations Hub · 5 Nodes"}
            </div>
            <div
              className="mt-1 text-[0.88rem] uppercase tracking-[0.16em] text-[#e8e8e8]"
              style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
            >
              {ar ? "شبكة القيادة العالمية" : "Global Command Network"}
            </div>
          </div>
          <div
            className="hidden items-center gap-2 text-[0.48rem] uppercase tracking-[0.22em] text-[#4a4a4a] sm:flex"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <RotateCw size={11} className="text-[#6e6e6e]" />
            <span>{ar ? "اسحب للتدوير" : "Drag to rotate"}</span>
          </div>
        </div>

        {/* Globe stage — fills remaining container, never overflows */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <GlobalCommandGlobe className="absolute inset-0 h-full w-full" />
        </div>

        {/* Footer hint */}
        <div
          className="pointer-events-none relative z-10 flex shrink-0 items-center justify-center gap-2 border-t border-[#1a1a1a] px-4 py-2.5 text-[0.46rem] uppercase tracking-[0.22em] text-[#4a4a4a]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>{ar ? "تدوير بالسحب · بدون تكبير" : "Drag to rotate · Zoom disabled"}</span>
        </div>
      </div>
    </div>
  );
}
