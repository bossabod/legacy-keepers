"use client";
import { useApp } from "@/lib/store";
import GlobalCommandGlobe from "@/components/GlobalCommandGlobe";

/* Network section hosts the same interactive Global Command Network globe. */

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <div
      className="relative mx-auto w-full min-w-0 overflow-hidden rounded-xl border border-[#2a2a2a]"
      style={{
        height: "clamp(520px, calc(100dvh - 7.5rem), 780px)",
        background:
          "radial-gradient(120% 90% at 50% 30%, #0e0e0e 0%, #080808 55%, #050505 100%)",
        boxShadow:
          "inset 0 0 160px 40px rgba(170,170,170,0.04), inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      <GlobalCommandGlobe className="absolute inset-0 z-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-4 pt-5 sm:px-7 sm:pt-6">
        <div className="min-w-0">
          <div
            className="truncate text-[0.45rem] uppercase tracking-[0.2em] text-[#6e6e6e] sm:text-[0.5rem]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {ar ? "محور العمليات · 5 عقد" : "Operations Hub · 5 Nodes"}
          </div>
          <div
            className="mt-1 truncate text-[0.75rem] uppercase tracking-[0.14em] text-[#e8e8e8] sm:text-[0.88rem]"
            style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
          >
            {ar ? "شبكة القيادة العالمية" : "Global Command Network"}
          </div>
        </div>
        <span
          className="hidden text-[0.48rem] uppercase tracking-[0.18em] text-[#4a4a4a] sm:inline"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {ar ? "اسحب للتدوير · عجلة للتكبير" : "Drag to rotate · Scroll to zoom"}
        </span>
      </div>
    </div>
  );
}
