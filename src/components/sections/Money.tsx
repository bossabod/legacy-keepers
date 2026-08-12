"use client";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";

/* ==================================================================
   Investments — 6 large, independent Trading-Terminal screens.
   • Green = up, Red = down candles.
   • Full interactivity: drag to pan, wheel/pinch to zoom, movable
     crosshair cursor synced to data, and a percentage ruler.
   • Bilingual (EN/AR).
   ================================================================== */

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

const GREEN = "#34d399"; // صعود
const RED = "#f87171";   // هبوط

interface Category {
  id: string;
  title: string;
  titleAr: string;
  available: number;
  sub: string[];
}

const CATEGORIES: Category[] = [
  { id: "stocks", title: "Stocks", titleAr: "الأسهم", available: 24, sub: ["US Equities", "Tech", "Semiconductors", "Energy", "Financials", "Healthcare"] },
  { id: "realestate", title: "Real Estate", titleAr: "العقارات", available: 15, sub: ["Residential", "Commercial", "Land", "Development"] },
  { id: "funds", title: "Funds", titleAr: "الصناديق", available: 11, sub: ["Index Funds", "ETF", "Private Funds", "Bond Funds"] },
  { id: "cars", title: "Cars", titleAr: "السيارات", available: 7, sub: ["Collector", "Luxury", "Performance", "Classic"] },
  { id: "commodities", title: "Commodities", titleAr: "السلع", available: 13, sub: ["Gold", "Silver", "Oil", "Energy", "Metals"] },
  { id: "crypto", title: "Crypto", titleAr: "العملات الرقمية", available: 7, sub: ["BTC", "ETH", "Major Assets", "Digital Assets"] },
];

/* سلسلة شموع مولّدة لكل قسم */
function genCandles(seed: number, n = 120) {
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

/* ترجمة */
const STR = {
  portfolio: ["Portfolio", "الاستثمارات"],
  personal: ["Personal", "شخصي"],
  club: ["Club", "النادي"],
  balance: ["Balance", "الرصيد"],
  activePos: ["Active Positions", "المراكز النشطة"],
  totalInv: ["Total Investments", "إجمالي الاستثمارات"],
  noInv: ["No Personal Investments", "لا توجد استثمارات شخصية"],
  empty: ["Your personal portfolio is currently empty.", "محفظتك الشخصية فارغة حالياً."],
  totalAvail: ["Total Available", "الإجمالي المتاح"],
  availCat: ["Available Categories", "الأقسام المتاحة"],
  screens: ["Investment Screens", "شاشات الاستثمار"],
  open: ["Open", "فتح"],
  marketData: ["Market Data", "بيانات السوق"],
  percentage: ["Percentage", "النسبة المئوية"],
  allInv: ["All Investments", "كل الاستثمارات"],
  drag: ["Drag", "اسحب"],
  zoom: ["Zoom", "تكبير"],
  pct: ["Pct", "٪"],
} as const;
const S = (lang: "en" | "ar", k: keyof typeof STR) => (lang === "ar" ? STR[k][1] : STR[k][0]);

export default function InvestmentsSection({ data: _data }: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [scope, setScope] = useState<"personal" | "club">("club");
  const [openCat, setOpenCat] = useState<string | null>(null);

  const switchScope = (s: "personal" | "club") => { setScope(s); setOpenCat(null); play("click"); };
  const openCategory = (id: string) => { setOpenCat(id); play("open"); };
  const goBack = () => { setOpenCat(null); play("click"); };

  return (
    <div className="mx-auto max-w-6xl px-1" dir={ar ? "rtl" : "ltr"}>
      {/* HEADER / SWITCHER */}
      <header className="mb-8">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold uppercase tracking-[0.12em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
          {S(lang, "portfolio")}
        </h1>
        <div className="mt-5 flex items-center gap-7 border-b border-white/[0.07]">
          {(["personal", "club"] as const).map((s) => {
            const on = scope === s;
            return (
              <button key={s} onClick={() => switchScope(s)}
                className="relative pb-2.5 text-[0.78rem] uppercase tracking-[0.25em] transition-colors duration-300"
                style={{ fontFamily: MONO, color: on ? "#eef2f7" : "#5d6675" }}>
                {S(lang, s)}
                {on && <motion.span layoutId="scope-underline" className="absolute inset-x-0 bottom-0 h-px" style={{ background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />}
              </button>
            );
          })}
        </div>
      </header>

      {/* CONTENT */}
      <AnimatePresence mode="wait">
        {scope === "personal" ? (
          <motion.div key="personal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "personal")} Portfolio</div>
            <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-3">
              <Metric label={S(lang, "balance")} value="$0" />
              <Metric label={S(lang, "activePos")} value="0" />
              <Metric label={S(lang, "totalInv")} value="0" />
            </div>
            <div className="mt-10 flex flex-col items-center border-t border-white/[0.06] pt-10 text-center">
              <div className="text-[0.95rem] uppercase tracking-[0.3em] text-[#9aa5b3]" style={{ fontFamily: MONO }}>{S(lang, "noInv")}</div>
              <p className="mt-2 max-w-[46ch] text-[0.72rem] leading-relaxed text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "empty")}</p>
            </div>
          </motion.div>
        ) : openCat ? (
          <motion.div key="cat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <button onClick={goBack} className="mb-6 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-[#7fb0ff] hover:text-sky-200" style={{ fontFamily: MONO }}>
              ← {S(lang, "allInv")}
            </button>
            {CATEGORIES.filter((c) => c.id === openCat).map((c) => (
              <div key={c.id}>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
                  {ar ? c.titleAr : c.title}
                </h2>
                <div className="mt-1 mb-4 flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.2em] text-[#7fb0ff]" style={{ fontFamily: MONO }}>
                  <span>{c.available} {S(lang, "open") === "Open" ? "Available" : "متاح"}</span>
                </div>
                <LargeScreen lang={lang} title={ar ? c.titleAr : c.title} sub={c.sub} available={c.available} seed={c.id.charCodeAt(0) * 7 + c.id.length} />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="club" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "club")} Portfolio</div>
            <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-2">
              <Metric label={S(lang, "totalAvail")} value={String(TOTAL)} highlight />
              <Metric label={S(lang, "availCat")} value="6" />
            </div>

            <div className="mb-6 mt-8 text-[0.6rem] uppercase tracking-[0.3em] text-[#7b8494]" style={{ fontFamily: MONO }}>
              {S(lang, "screens")}
            </div>

            <div className="space-y-10">
              {CATEGORIES.map((c) => (
                <section key={c.id} className="cursor-pointer" onClick={() => openCategory(c.id)}>
                  <div className="flex items-end justify-between border-b border-white/[0.08] pb-2">
                    <h2 className="text-[clamp(1.2rem,2.4vw,1.8rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8] hover:text-white" style={{ fontFamily: LUX }}>
                      {ar ? c.titleAr : c.title}
                    </h2>
                    <span className="text-[0.6rem] uppercase tracking-[0.18em] text-[#7fb0ff]" style={{ fontFamily: MONO }}>
                      {c.available} · {S(lang, "open")} →
                    </span>
                  </div>
                  <LargeScreen lang={lang} title={ar ? c.titleAr : c.title} sub={c.sub} available={c.available} seed={c.id.charCodeAt(0) * 7 + c.id.length} />
                </section>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#07080a] px-4 py-5">
      <div className="text-[0.52rem] uppercase tracking-[0.24em] text-[#5d6675]" style={{ fontFamily: MONO }}>{label}</div>
      <div className="mt-1.5 text-[1.5rem] leading-none" style={{ fontFamily: MONO, color: highlight ? GREEN : "#eef2f7" }}>{value}</div>
    </div>
  );
}

/* شاشة تحليل كبيرة تفاعلية — Trading Terminal */
function LargeScreen({ lang, title, sub, available, seed }: { lang: string; title: string; sub: string[]; available: number; seed: number }) {
  const ar = lang === "ar";
  const W = 900, H = 250, PL = 46, PR = 16, PT = 20, PB = 26;
  const candles = useMemo(() => genCandles(seed, 140), [seed]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [off, setOff] = useState(0);           // إزاحة السحب
  const [maxVis, setMaxVis] = useState(80);    // تكبير: عدد الشموع الظاهرة
  const [cursorX, setCursorX] = useState<number | null>(null); // مؤشر حر

  const maxOff = Math.max(0, candles.length - maxVis);
  const vis = candles.slice(off, off + maxVis);

  const geo = useMemo(() => {
    if (!vis.length) return null;
    let lo = Infinity, hi = -Infinity;
    for (const k of vis) { if (k.l < lo) lo = k.l; if (k.h > hi) hi = k.h; }
    const pad = (hi - lo) * 0.14 || 1;
    lo -= pad; hi += pad;
    return { lo, hi, iw: (W - PL - PR) / maxVis };
  }, [vis, maxVis]);

  /* interaction */
  const dragRef = useRef<{ x0: number; start: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x0: e.clientX, start: off };
    updateCursor(e);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    updateCursor(e);
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.x0;
      setOff(Math.max(0, Math.min(maxOff, dragRef.current.start + Math.round(-dx / 6))));
    }
  };
  const up = () => { dragRef.current = null; setCursorX(null); };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setMaxVis((m) => Math.max(20, Math.min(candles.length, m + (e.deltaY > 0 ? 12 : -12))));
  };

  const updateCursor = (e: React.PointerEvent) => {
    const el = svgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    setCursorX(x);
  };

  /* مؤشر النسبة: قيمة النسبة عند موضع المؤشر (نسبة لآخر سعر ظاهر) */
  const lastClose = candles[candles.length - 1]?.c ?? 1;
  const cursorPct = (() => {
    if (cursorX == null || !geo) return null;
    const rel = Math.max(0, Math.min(1, (cursorX - PL) / (W - PL - PR)));
    const idx = Math.round(rel * (vis.length - 1));
    const c = vis[Math.max(0, Math.min(vis.length - 1, idx))];
    return c ? ((c.c / lastClose) - 1) * 100 : 0;
  })();

  const pctColor = (cursorPct ?? 0) >= 0 ? GREEN : RED;

  return (
    <div className="relative select-none overflow-hidden border border-white/[0.08] bg-[#06070b]"
      style={{ cursor: "crosshair", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={up}
      onPointerCancel={up}
      onWheel={onWheel}
    >
      {/* header strip */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="text-[0.55rem] uppercase tracking-[0.25em] text-[#7b8494]" style={{ fontFamily: MONO }}>{title} · {ar ? "بيانات السوق" : "Market Data"}</span>
        <span className="flex items-center gap-3 text-[0.5rem] uppercase tracking-[0.14em] text-[#454d5a]" style={{ fontFamily: MONO }}>
          <span style={{ color: GREEN }}>{available} {ar ? "فرصة" : "OPP"}</span>
          <span>{ar ? "اسحب" : "Drag"} · {ar ? "عجلة للتكبير" : "Wheel zoom"}</span>
        </span>
      </div>

      {/* grid */}
      {geo && [0.2, 0.4, 0.6, 0.8].map((f) => (
        <span key={f} className="pointer-events-none absolute inset-x-0 h-px" style={{ top: PT + f * (H - PT - PB), background: "rgba(255,255,255,0.04)" }} />
      ))}

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block w-full" preserveAspectRatio="none" aria-hidden="true">
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
                  <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={upC ? GREEN : RED} strokeWidth="1" opacity="0.9" />
                  <rect x={cx - bw / 2} y={Math.min(yO, yC)} width={bw} height={Math.max(1.4, Math.abs(yC - yO))} fill={upC ? GREEN : RED} rx="0.4" opacity="0.92" />
                </g>
              );
            })}
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
            {/* cursor line متحرك */}
            {cursorX != null && (
              <line x1={cursorX} y1={PT} x2={cursorX} y2={H - PB} stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="2 2" />
            )}
          </>
        )}
      </svg>

      {/* نسبة المؤشر (تعلّق أعلى الشاشة) */}
      {cursorX != null && cursorPct != null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded border border-white/15 bg-[#0a0c10] px-2 py-1 text-[0.6rem]"
          style={{ left: `${(cursorX / W) * 100}%`, top: PT, fontFamily: MONO, color: pctColor }}
        >
          {(cursorPct >= 0 ? "+" : "")}{cursorPct.toFixed(2)}%
        </div>
      )}

      {/* شريط نسبة مئوية أسفل — قابل للتحريك مع الرسم */}
      <div className="border-t border-white/[0.06] px-3 py-2">
        <div className="mb-1 flex items-center justify-between text-[0.5rem] uppercase tracking-[0.18em] text-[#5d6675]" style={{ fontFamily: MONO }}>
          <span>{ar ? "النسبة المئوية" : "Percentage"}</span>
          <span style={{ color: pctColor }}>{cursorPct == null ? "—" : `${(cursorPct >= 0 ? "+" : "")}${cursorPct.toFixed(2)}%`}</span>
        </div>
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#11151c]">
          <div className="absolute inset-y-0 left-0 h-full rounded-full" style={{ width: "50%", background: GREEN, opacity: 0.8 }} />
          {cursorPct != null && cursorX != null && (
            <div className="absolute inset-y-0 h-full w-px bg-white" style={{ left: `${Math.max(0, Math.min(100, ((cursorPct + 6) / 12) * 100))}%` }} />
          )}
        </div>
        <div className="mt-1 flex justify-between text-[0.42rem] text-[#454d5a]" style={{ fontFamily: MONO }}>
          <span>-6%</span><span>0%</span><span>+6%</span>
        </div>
      </div>
    </div>
  );
}
