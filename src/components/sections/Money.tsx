"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";

/* ==================================================================
   Investments — 6 large, independent Trading-Terminal screens.
   Each investment has its own big analysis screen: title heading above,
   then a large draggable chart (grid + candles + markers + axis values).
   Vertical layout. Personal empty state ⇄ Club (77 across 6 screens).
   No small cards, no tiny indicators.
   ================================================================== */

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

interface Category {
  id: string;
  title: string;
  available: number;
  sub: string[];
}

const CATEGORIES: Category[] = [
  { id: "stocks", title: "Stocks", available: 24, sub: ["US Equities", "Tech", "Semiconductors", "Energy", "Financials", "Healthcare"] },
  { id: "realestate", title: "Real Estate", available: 15, sub: ["Residential", "Commercial", "Land", "Development"] },
  { id: "funds", title: "Funds", available: 11, sub: ["Index Funds", "ETF", "Private Funds", "Bond Funds"] },
  { id: "cars", title: "Cars", available: 7, sub: ["Collector", "Luxury", "Performance", "Classic"] },
  { id: "commodities", title: "Commodities", available: 13, sub: ["Gold", "Silver", "Oil", "Energy", "Metals"] },
  { id: "crypto", title: "Crypto", available: 7, sub: ["BTC", "ETH", "Major Assets", "Digital Assets"] },
];

/* سلسلة شموع مولّدة لكل قسم (seed مختلف → شكل مختلف) */
function genCandles(seed: number, n = 90) {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: { o: number; h: number; l: number; c: number }[] = [];
  let p = 50 + rnd() * 40;
  for (let i = 0; i < n; i++) {
    let d = (rnd() - 0.5) * 4;
    if (rnd() < 0.1) d *= 3;
    const o = p;
    const c = Math.max(6, o + d);
    const w = (rnd() * 2 + 0.4) * (rnd() < 0.5 ? 1 : -1);
    out.push({
      o,
      h: Math.max(o, c) + Math.abs(w) * 0.6 + rnd() * 0.6,
      l: Math.max(1, Math.min(o, c) - Math.abs(w) * 0.6 - rnd() * 0.6),
      c,
    });
    p = c;
  }
  return out;
}

const TOTAL = 77;

export default function InvestmentsSection({ data: _data }: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [scope, setScope] = useState<"personal" | "club">("club");
  const [openCat, setOpenCat] = useState<string | null>(null);

  const t = (en: string, arText?: string) => (ar ? (arText ?? en) : en);
  const switchScope = (s: "personal" | "club") => { setScope(s); setOpenCat(null); play("click"); };
  const openCategory = (id: string) => { setOpenCat(id); play("open"); };
  const goBack = () => { setOpenCat(null); play("click"); };

  return (
    <div className="mx-auto max-w-6xl px-1" dir={ar ? "rtl" : "ltr"}>
      {/* ═══ HEADER / SWITCHER ═══ */}
      <header className="mb-8">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold uppercase tracking-[0.12em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
          {t("Portfolio")}
        </h1>
        <div className="mt-5 flex items-center gap-7 border-b border-white/[0.07]">
          {(["personal", "club"] as const).map((s) => {
            const on = scope === s;
            return (
              <button key={s} onClick={() => switchScope(s)}
                className="relative pb-2.5 text-[0.78rem] uppercase tracking-[0.25em] transition-colors duration-300"
                style={{ fontFamily: MONO, color: on ? "#eef2f7" : "#5d6675" }}>
                {t(s === "personal" ? "Personal" : "Club")}
                {on && <motion.span layoutId="scope-underline" className="absolute inset-x-0 bottom-0 h-px bg-[#7fb0ff]" style={{ boxShadow: "0 0 8px #7fb0ff" }} />}
              </button>
            );
          })}
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {scope === "personal" ? (
          <motion.div key="personal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>Personal Portfolio</div>
            <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-3">
              <Metric label="Balance" value="$0" />
              <Metric label="Active Positions" value="0" />
              <Metric label="Total Investments" value="0" />
            </div>
            <div className="mt-10 flex flex-col items-center border-t border-white/[0.06] pt-10 text-center">
              <div className="text-[0.95rem] uppercase tracking-[0.3em] text-[#9aa5b3]" style={{ fontFamily: MONO }}>No Personal Investments</div>
              <p className="mt-2 max-w-[46ch] text-[0.72rem] leading-relaxed text-[#5d6675]" style={{ fontFamily: MONO }}>Your personal portfolio is currently empty.</p>
            </div>
          </motion.div>
        ) : openCat ? (
          /* ═══ DETAIL OF ONE INVESTMENT ═══ */
          <motion.div key="cat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <button onClick={goBack} className="mb-6 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-[#7fb0ff] hover:text-sky-200" style={{ fontFamily: MONO }}>
              ← {t("All Investments")}
            </button>
            {CATEGORIES.filter((c) => c.id === openCat).map((c) => (
              <div key={c.id}>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>{c.title}</h2>
                <div className="mt-1 mb-4 flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.2em] text-[#7fb0ff]" style={{ fontFamily: MONO }}>
                  <span>{c.available} Available</span>
                </div>
                {/* big chart screen */}
                <LargeScreen title={c.title} sub={c.sub} available={c.available} seed={c.id.charCodeAt(0) * 7 + c.id.length} onClick={() => play("open")} />
              </div>
            ))}
          </motion.div>
        ) : (
          /* ═══ CLUB — 6 vertical large trading screens ═══ */
          <motion.div key="club" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>Club Portfolio</div>
            <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-2">
              <Metric label="Total Available" value={String(TOTAL)} highlight />
              <Metric label="Available Categories" value="6" />
            </div>

            <div className="mb-6 mt-8 text-[0.6rem] uppercase tracking-[0.3em] text-[#7b8494]" style={{ fontFamily: MONO }}>
              Investment Screens
            </div>

            {/* كل قسم: عنوان فوق + شاشة كبيرة تحته */}
            <div className="space-y-10">
              {CATEGORIES.map((c) => (
                <section key={c.id} className="cursor-pointer" onClick={() => openCategory(c.id)}>
                  {/* العنوان — مستقلاً فوق الشاشة، بدون مربع */}
                  <div className="flex items-end justify-between border-b border-white/[0.08] pb-2">
                    <h2 className="text-[clamp(1.2rem,2.4vw,1.8rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8] hover:text-white" style={{ fontFamily: LUX }}>{c.title}</h2>
                    <span className="text-[0.6rem] uppercase tracking-[0.18em] text-[#7fb0ff]" style={{ fontFamily: MONO }}>{c.available} · Open →</span>
                  </div>
                  {/* الشاشة الكبيرة */}
                  <LargeScreen title={c.title} sub={c.sub} available={c.available} seed={c.id.charCodeAt(0) * 7 + c.id.length} onClick={(e) => { e.stopPropagation(); openCategory(c.id); }} />
                </section>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── components ─────────── */

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#07080a] px-4 py-5">
      <div className="text-[0.52rem] uppercase tracking-[0.24em] text-[#5d6675]" style={{ fontFamily: MONO }}>{label}</div>
      <div className="mt-1.5 text-[1.5rem] leading-none" style={{ fontFamily: MONO, color: highlight ? "#7fb0ff" : "#eef2f7" }}>{value}</div>
    </div>
  );
}

/* شاشة تحليل كبيرة قابلة للسحب — Trading Terminal */
function LargeScreen({ title, sub, available, seed, onClick }: { title: string; sub: string[]; available: number; seed: number; onClick: (e: React.MouseEvent) => void }) {
  const W = 900, H = 260, PL = 46, PR = 14, PT = 20, PB = 26;
  const candles = useMemo(() => genCandles(seed, 110), [seed]);
  const maxVis = 70;
  const [off, setOff] = useState(0);
  const [drag, setDrag] = useState<{ x0: number; start: number } | null>(null);
  const maxOff = Math.max(0, candles.length - maxVis);
  const vis = candles.slice(off, off + maxVis);

  const geo = useMemo(() => {
    if (!vis.length) return null;
    let lo = Infinity, hi = -Infinity;
    for (const k of vis) { if (k.l < lo) lo = k.l; if (k.h > hi) hi = k.h; }
    const pad = (hi - lo) * 0.14 || 1;
    lo -= pad; hi += pad;
    return { lo, hi, iw: (W - PL - PR) / maxVis };
  }, [vis]);

  const onDown = (e: React.PointerEvent) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDrag({ x0: e.clientX, start: off }); };
  const onMove = (e: React.PointerEvent) => { if (drag) { const dx = e.clientX - drag.x0; setOff(Math.max(0, Math.min(maxOff, drag.start + Math.round(-dx / 8)))); } };
  const up = () => setDrag(null);

  return (
    <div
      onClick={onClick}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={up}
      onPointerCancel={up}
      className="relative select-none overflow-hidden border border-white/[0.08] bg-[#06070b]"
      style={{ cursor: "grab", touchAction: "none" }}
    >
      {/* header strip داخل الشاشة */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="text-[0.55rem] uppercase tracking-[0.25em] text-[#7b8494]" style={{ fontFamily: MONO }}>{title} · MARKET DATA</span>
        <span className="flex items-center gap-3 text-[0.5rem] uppercase tracking-[0.14em] text-[#454d5a]" style={{ fontFamily: MONO }}>
          <span className="text-[#7fb0ff]">{available} OPP</span>
          <span>DRAG</span>
        </span>
      </div>

      {/* grid خفيف */}
      {geo && [0.2, 0.4, 0.6, 0.8].map((f) => (
        <span key={f} className="pointer-events-none absolute inset-x-0 h-px" style={{ top: PT + f * (H - PT - PB), background: "rgba(255,255,255,0.04)" }} />
      ))}

      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
        {geo && (
          <>
            <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {vis.map((k, i) => {
              const cx = PL + i * geo.iw + geo.iw / 2;
              const bw = Math.max(2, geo.iw * 0.5);
              const yO = PT + (1 - (k.o - geo.lo) / (geo.hi - geo.lo)) * (H - PT - PB);
              const yC = PT + (1 - (k.c - geo.lo) / (geo.hi - geo.lo)) * (H - PT - PB);
              const yH = PT + (1 - (k.h - geo.lo) / (geo.hi - geo.lo)) * (H - PT - PB);
              const yL = PT + (1 - (k.l - geo.lo) / (geo.hi - geo.lo)) * (H - PT - PB);
              const upC = k.c >= k.o;
              return (
                <g key={i}>
                  <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={upC ? "#7fb0ff" : "#8ba0c8"} strokeWidth="1" opacity="0.85" />
                  <rect x={cx - bw / 2} y={Math.min(yO, yC)} width={bw} height={Math.max(1.4, Math.abs(yC - yO))} fill={upC ? "#7fb0ff" : "#8ba0c8"} rx="0.4" opacity="0.9" />
                </g>
              );
            })}
            {/* أرقام المحاور */}
            {[0, 0.5, 1].map((f, i) => (
              <text key={i} x={PL - 5} y={PT + f * (H - PT - PB) + 3} textAnchor="end" fill="rgba(150,160,175,0.4)" fontSize="7.5" style={{ fontFamily: MONO }}>
                {Math.round(geo.lo + f * (geo.hi - geo.lo))}
              </text>
            ))}
            {[0, 0.33, 0.66, 1].map((f, i) => (
              <text key={i} x={PL + f * (W - PL - PR)} y={H - 7} textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"} fill="rgba(150,160,175,0.3)" fontSize="7" style={{ fontFamily: MONO }}>
                {Math.round(f * (candles.length / maxVis) * 4)}m
              </text>
            ))}
          </>
        )}
      </svg>

      {/* مؤشرات تحليلية: آخر قيمة + تغير */}
      <div className="pointer-events-none absolute bottom-1 right-3 flex items-center gap-3 text-[0.5rem] tracking-[0.12em] text-[#6d7685]" style={{ fontFamily: MONO }}>
        <span>LAST {candles[candles.length - 1]?.c.toFixed(1) ?? "—"}</span>
        <span className="text-[#7fb0ff]">MA20 · RSI</span>
      </div>
    </div>
  );
}
