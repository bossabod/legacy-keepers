"use client";
import { RotateCw } from "lucide-react";
import { useApp } from "@/lib/store";
import GlobalCommandGlobe from "@/components/GlobalCommandGlobe";

/* ==================================================================
   Network — responsive GLOBAL COMMAND NETWORK globe.
   Full rectangular container that scales with viewport; globe centered;
   drag-to-rotate only (no zoom).
   ================================================================== */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <div
      className="relative mx-auto w-full min-w-0"
      style={{
        /* Fill remaining viewport under sticky nav + status bar, with safe floor */
        height: "clamp(420px, calc(100dvh - 7.5rem), 920px)",
        maxHeight: "calc(100dvh - 6.5rem)",
      }}
    >
      <div
        className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-[#2a2a2a] sm:inset-1 md:inset-2 lg:inset-3"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, #0e0e0e 0%, #080808 55%, #050505 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.65)",
        }}
      >
        {/* Header */}
        <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#1a1a1a] px-3 py-2.5 sm:px-5 sm:py-3.5 md:px-7">
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[0.45rem] uppercase tracking-[0.18em] text-[#6e6e6e] sm:text-[0.5rem] sm:tracking-[0.24em]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {ar ? "محور العمليات · 5 عقد" : "Operations Hub · 5 Nodes"}
            </div>
            <div
              className="mt-1 truncate text-[0.75rem] uppercase tracking-[0.1em] text-[#e8e8e8] sm:text-[0.88rem] sm:tracking-[0.14em]"
              style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
            >
              {ar ? "شبكة القيادة العالمية" : "Global Command Network"}
            </div>
          </div>
          <div
            className="hidden items-center gap-2 text-[0.48rem] uppercase tracking-[0.18em] text-[#4a4a4a] sm:flex"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <RotateCw size={11} className="shrink-0 text-[#6e6e6e]" />
            <span className="whitespace-nowrap">{ar ? "اسحب للتدوير" : "Drag to rotate"}</span>
          </div>
        </div>

        {/* Globe stage */}
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <GlobalCommandGlobe className="absolute inset-0 h-full w-full" />
        </div>

        {/* Footer */}
        <div
          className="pointer-events-none relative z-10 flex shrink-0 items-center justify-center gap-2 border-t border-[#1a1a1a] px-3 py-2 text-center text-[0.42rem] uppercase tracking-[0.14em] text-[#4a4a4a] sm:px-4 sm:py-2.5 sm:text-[0.46rem] sm:tracking-[0.18em]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="max-w-full truncate">
            {ar ? "تدوير بالسحب · بدون تكبير" : "Drag to rotate · Zoom disabled"}
          </span>
        </div>
      </div>
    </div>
  );
}
