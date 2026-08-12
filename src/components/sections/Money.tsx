"use client";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";

/* ==================================================================
   Investments — Club investment-analysis platform.
   Deterministic historical dataset (2013 → present) per asset, built
   from realistic market-cycle calibrations (no random-on-load data).
   Percentage-Return axis (no raw prices). Timeframes 1Y/6M/1M/1W/1D.
   Full interaction: drag, zoom, movable crosshair with live tooltip
   (date / return / change / drawdown). OPEN opens a dedicated big
   analysis screen. Bilingual EN/AR.
   ================================================================== */

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";
const GREEN = "#34d399";
const RED = "#f87171";

/* ────────────── Deterministic dataset (2013 → present) ────────────── */

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* seeded normal (Box-Muller) */
function normGen(seed: number) {
  const r = mulberry(seed);
  let spare: number | null = null;
  return () => {
    if (spare != null) { const v = spare; spare = null; return v; }
    let u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    const m = Math.sqrt(-2 * Math.log(u));
    spare = m * Math.sin(2 * Math.PI * v);
    return m * Math.cos(2 * Math.PI * v);
  };
}

/* Annual returns (club performance — realistic, not all winners).
   Win rate per class ~65–78%. */
const ANNUAL: Record<string, { label: string; labelAr: string; win: number; returns: Record<number, number>; vol: number }> = {
  stocks: {
    label: "Stocks", labelAr: "الأسهم", win: 0.72, vol: 0.16,
    returns: { 2013: 0.31, 2014: 0.13, 2015: 0.02, 2016: 0.11, 2017: 0.24, 2018: -0.04, 2019: 0.32, 2020: 0.19, 2021: 0.30, 2022: -0.17, 2023: 0.27, 2024: 0.26, 2025: 0.14, 2026: 0.08 },
  },
  realestate: {
    label: "Real Estate", labelAr: "العقارات", win: 0.78, vol: 0.06,
    returns: { 2013: 0.07, 2014: 0.06, 2015: 0.05, 2016: 0.05, 2017: 0.07, 2018: 0.03, 2019: 0.04, 2020: 0.08, 2021: 0.12, 2022: 0.09, 2023: 0.03, 2024: 0.05, 2025: 0.06, 2026: 0.03 },
  },
  funds: {
    label: "Funds", labelAr: "الصناديق", win: 0.75, vol: 0.09,
    returns: { 2013: 0.12, 2014: 0.07, 2015: 0.01, 2016: 0.06, 2017: 0.11, 2018: -0.02, 2019: 0.16, 2020: 0.08, 2021: 0.12, 2022: -0.08, 2023: 0.15, 2024: 0.12, 2025: 0.07, 2026: 0.04 },
  },
  cars: {
    label: "Cars", labelAr: "السيارات", win: 0.7, vol: 0.1,
    returns: { 2013: 0.09, 2014: 0.08, 2015: 0.07, 2016: 0.06, 2017: 0.09, 2018: 0.05, 2019: 0.07, 2020: 0.03, 2021: 0.18, 2022: 0.12, 2023: 0.09, 2024: 0.11, 2025: 0.08, 2026: 0.05 },
  },
  commodities: {
    label: "Commodities", labelAr: "السلع", win: 0.65, vol: 0.13,
    returns: { 2013: -0.06, 2014: -0.09, 2015: -0.12, 2016: 0.12, 2017: 0.08, 2018: -0.04, 2019: 0.09, 2020: 0.15, 2021: 0.20, 2022: 0.08, 2023: 0.06, 2024: 0.14, 2025: 0.04, 2026: 0.05 },
  },
  crypto: {
    label: "Crypto", labelAr: "العملات الرقمية", win: 0.68, vol: 0.5,
    returns: { 2013: 2.5, 2014: -0.5, 2015: 0.4, 2016: 0.9, 2017: 3.0, 2018: -0.7, 2019: 0.9, 2020: 2.5, 2021: 1.5, 2022: -0.65, 2023: 1.2, 2024: 0.6, 2025: 0.2, 2026: 0.15 },
  },
};

const TRADING_DAYS = 252;
interface Point { t: number; r: number; } // t = epoch ms, r = cumulative return (fraction)

/* Build daily cumulative-return series anchored to annual targets. */
function buildSeries(id: string): Point[] {
  const conf = ANNUAL[id];
  const g = normGen(id.length * 97 + id.charCodeAt(0));
  const pts: Point[] = [];
  let cumLog = 0;
  for (let year = 2013; year <= 2026; year++) {
    const target = conf.returns[year] ?? 0.03;
    const n = TRADING_DAYS;
    // generate raw normal draws
    const z: number[] = [];
    for (let i = 0; i < n; i++) z.push(g());
    const mean = z.reduce((s, v) => s + v, 0) / n;
    const desiredSum = Math.log(1 + target);
    // daily log ret anchored so sum == desiredSum, volatility ~ conf.vol
    for (let i = 0; i < n; i++) {
      const det = desiredSum / n;
      const vol = conf.vol * (z[i] - mean);
      cumLog += det + vol;
      // epoch: start of year + i days
      const d = new Date(Date.UTC(year, 0, 1));
      const t = d.getTime() + i * 86400000;
      pts.push({ t, r: Math.exp(cumLog) - 1 });
    }
  }
  return pts;
}

const DATASETS: Record<string, Point[]> = {
  stocks: buildSeries("stocks"),
  realestate: buildSeries("realestate"),
  funds: buildSeries("funds"),
  cars: buildSeries("cars"),
  commodities: buildSeries("commodities"),
  crypto: buildSeries("crypto"),
};

const TOTAL = 77;
const ORDER = ["stocks", "realestate", "funds", "cars", "commodities", "crypto"] as const;
const AVAIL: Record<string, number> = { stocks: 24, realestate: 15, funds: 11, cars: 7, commodities: 13, crypto: 7 };

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
  back: ["All Investments", "كل الاستثمارات"],
  year: ["Year", "السنة"],
  return: ["Return", "العائد"],
  change: ["Change", "التغير"],
  drawdown: ["Drawdown", "التراجع"],
  per: ["Performance", "الأداء"],
  opportunity: ["Opportunities", "فرص"],
} as const;
const S = (lang: "en" | "ar", k: keyof typeof STR) => (lang === "ar" ? STR[k][1] : STR[k][0]);

export default function InvestmentsSection({ data: _data }: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [scope, setScope] = useState<"personal" | "club">("club");
  const [active, setActive] = useState<keyof typeof ANNUAL | null>(null);

  const switchScope = (s: "personal" | "club") => { setScope(s); setActive(null); play("click"); };
  const openAsset = (id: keyof typeof ANNUAL) => { setActive(id); play("open"); };
  const goBack = () => { setActive(null); play("click"); };

  return (
    <div className="mx-auto max-w-6xl px-1" dir={ar ? "rtl" : "ltr"}>
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
        ) : active ? (
          /* ═══ BIG ANALYSIS SCREEN for one asset ═══ */
          <motion.div key="big" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <button onClick={goBack} className="mb-5 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-[#7fb0ff] hover:text-sky-200" style={{ fontFamily: MONO }}>
              ← {S(lang, "back")}
            </button>
            <AnalysisScreen id={active} lang={lang} />
          </motion.div>
        ) : (
          /* ═══ CLUB — indicator list + OPEN buttons ═══ */
          <motion.div key="club" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "club")} Portfolio</div>
            <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-2">
              <Metric label={S(lang, "totalAvail")} value={String(TOTAL)} highlight />
              <Metric label={S(lang, "availCat")} value="6" />
            </div>

            <div className="mb-4 mt-8 text-[0.6rem] uppercase tracking-[0.3em] text-[#7b8494]" style={{ fontFamily: MONO }}>
              {S(lang, "screens")}
            </div>

            <div className="space-y-1 border-t border-white/[0.06] pt-1">
              {ORDER.map((id) => {
                const a = ANNUAL[id];
                const lastR = DATASETS[id][DATASETS[id].length - 1].r;
                const up = lastR >= 0;
                return (
                  <div key={id} className="flex items-center gap-4 py-3">
                    <span className="w-3 text-[0.9rem]" style={{ color: up ? GREEN : RED }}>{up ? "▲" : "▼"}</span>
                    <span className="w-44 text-[0.9rem] uppercase tracking-[0.12em] text-[#eef2f7]" style={{ fontFamily: LUX }}>
                      {ar ? a.labelAr : a.label}
                    </span>
                    <span className="hidden flex-1 text-[0.55rem] uppercase tracking-[0.14em] text-[#5d6675] sm:block" style={{ fontFamily: MONO }}>
                      {(up ? "+" : "")}{lastR.toFixed(1)}% · {S(lang, "return")}
                    </span>
                    <span className="ml-auto text-[0.62rem] text-[#7fb0ff]" style={{ fontFamily: MONO }}>{AVAIL[id]} {S(lang, "opportunity")}</span>
                    <button onClick={() => openAsset(id)}
                      className="rounded border border-[#7fb0ff]/40 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.2em] text-[#7fb0ff] transition hover:border-[#7fb0ff] hover:text-white"
                      style={{ fontFamily: MONO }}>
                      {S(lang, "open")} ↗
                    </button>
                  </div>
                );
              })}
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

/* Timeframe windows (in points) */
const TF: { id: string; label: string; labelAr: string; n: number }[] = [
  { id: "1Y", label: "1Y", labelAr: "1س", n: TRADING_DAYS },
  { id: "6M", label: "6M", labelAr: "6ش", n: Math.round(TRADING_DAYS / 2) },
  { id: "1M", label: "1M", labelAr: "1ش", n: 22 },
  { id: "1W", label: "1W", labelAr: "1أ", n: 5 },
  { id: "1D", label: "1D", labelAr: "1ي", n: 2 },
];

function AnalysisScreen({ id, lang }: { id: keyof typeof ANNUAL; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  const a = ANNUAL[id];
  const data = DATASETS[id];
  const [tf, setTf] = useState("1Y");
  const [off, setOff] = useState(0);
  const [cursor, setCursor] = useState<number | null>(null); // index in visible
  const dragRef = useRef<{ x0: number; start: number } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const tfN = TF.find((x) => x.id === tf)!.n;
  const maxOff = Math.max(0, data.length - tfN);
  const effOff = Math.min(off, maxOff);
  const vis = data.slice(effOff, effOff + tfN);

  /* cumulative return of visible window + max drawdown + change */
  const win = useMemo(() => {
    if (!vis.length) return null;
    const base = vis[0].r;
    const ret = vis[vis.length - 1].r - base;
    let peak = vis[0].r;
    let maxDD = 0;
    for (const p of vis) {
      if (p.r > peak) peak = p.r;
      const dd = (p.r - peak) / (1 + Math.abs(peak));
      if (dd < maxDD) maxDD = dd;
    }
    return { ret, maxDD, base };
  }, [vis]);

  /* percentage-return axis: nice max */
  const maxPct = useMemo(() => {
    if (!vis.length) return 100;
    let m = 0;
    for (const p of vis) m = Math.max(m, Math.abs((p.r - vis[0].r) / 1));
    m = m * 1.2;
    // nice ceiling
    const steps = [5, 10, 25, 50, 100, 200, 300, 500, 1000, 2000, 5000];
    for (const s of steps) if (m <= s) return s;
    return Math.ceil(m / 500) * 500;
  }, [vis]);

  const fmtPct = (f: number) => `${f >= 0 ? "+" : ""}${f.toFixed(1)}%`;

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x0: e.clientX, start: effOff };
    setCursorFrom(e);
  };
  const onMove = (e: React.PointerEvent) => {
    setCursorFrom(e);
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.x0;
      setOff(Math.max(0, Math.min(maxOff, dragRef.current.start + Math.round(-dx / 4))));
    }
  };
  const onUp = () => { dragRef.current = null; setCursor(null); };
  const onWheel = (e: React.WheelEvent) => { e.preventDefault(); setTf(TF[Math.max(0, Math.min(TF.length - 1, TF.findIndex((x) => x.id === tf) + (e.deltaY > 0 ? 1 : -1)))].id); };

  const setCursorFrom = (e: React.PointerEvent) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rel = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setCursor(Math.round(rel * (vis.length - 1)));
  };

  const cursorPt = cursor != null && cursor >= 0 && cursor < vis.length ? vis[cursor] : null;

  /* chart geometry */
  const W = 900, H = 300, PL = 64, PR = 20, PT = 24, PB = 30;

  return (
    <div>
      {/* header */}
      <div className="mb-1">
        <div className="text-[0.62rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>{ar ? a.labelAr : a.label}</div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[clamp(1.4rem,3vw,2.2rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
              {ar ? "أداء أسهم النادي" : "Club Equity Performance"}
            </h2>
            <div className="mt-1 text-[0.5rem] uppercase tracking-[0.2em] text-[#454d5a]" style={{ fontFamily: MONO }}>
              {S(lang, "screens")} · {a.win * 100}% {S(lang, "opportunity")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[1.6rem] leading-none" style={{ fontFamily: MONO, color: (win?.ret ?? 0) >= 0 ? GREEN : RED }}>
              {fmtPct((win?.ret ?? 0) * 100)}
            </div>
            <div className="text-[0.5rem] uppercase tracking-[0.2em] text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "return")}</div>
          </div>
        </div>
      </div>

      {/* timeframe buttons */}
      <div className="mb-3 mt-4 flex items-center gap-1 border-b border-white/[0.06] pb-2">
        {TF.map((x) => (
          <button key={x.id} onClick={() => { setTf(x.id); setOff(0); }}
            className="rounded px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] transition-colors"
            style={{ fontFamily: MONO, color: tf === x.id ? "#eef2f7" : "#5d6675", background: tf === x.id ? "rgba(127,176,255,0.12)" : "transparent" }}>
            {ar ? x.labelAr : x.label}
          </button>
        ))}
        <span className="ml-auto text-[0.5rem] uppercase tracking-[0.18em] text-[#454d5a]" style={{ fontFamily: MONO }}>
          {ar ? "اسحب · عجلة للفريم" : "Drag · Wheel = frame"}
        </span>
      </div>

      {/* chart */}
      <div
        ref={boxRef}
        className="relative select-none overflow-hidden border border-white/[0.08] bg-[#06070b]"
        style={{ cursor: "crosshair", touchAction: "none" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={onWheel}
      >
        {/* grid + axis labels */}
        {Array.from({ length: 9 }).map((_, i) => {
          const f = (i / 8) * 2 - 1; // -1..1
          const pct = f * maxPct;
          const y = PT + (1 - (pct + maxPct) / (2 * maxPct)) * (H - PT - PB);
          const isZero = pct === 0;
          return (
            <div key={i} className="pointer-events-none absolute inset-x-0 flex items-center" style={{ top: y }}>
              <span className="absolute left-0 top-0 h-px w-full" style={{ background: isZero ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.05)" }} />
              <span className="absolute right-0 top-0 -translate-y-1/2 px-1 text-[0.52rem] text-[#7b8494]" style={{ fontFamily: MONO }}>
                {pct === 0 ? "0%" : `${pct > 0 ? "+" : ""}${pct}%`}
              </span>
            </div>
          );
        })}

        <svg viewBox={`0 0 ${W} ${H}`} className="relative block w-full" preserveAspectRatio="none" aria-hidden="true">
          {/* line */}
          {(() => {
            if (!vis.length) return null;
            const d = vis.map((p, i) => {
              const x = PL + (i / (vis.length - 1)) * (W - PL - PR);
              const f = (p.r - vis[0].r) / 1;
              const pct = f * 100;
              const y = PT + (1 - (pct + maxPct) / (2 * maxPct)) * (H - PT - PB);
              return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }).join(" ");
            return (
              <>
                <path d={d} fill="none" stroke={(win?.ret ?? 0) >= 0 ? GREEN : RED} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
                {/* zero reference */}
                <line x1={PL} x2={W - PR} y1={PT + (1 - maxPct / (2 * maxPct)) * (H - PT - PB)} y2={PT + (1 - maxPct / (2 * maxPct)) * (H - PT - PB)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                {/* cursor */}
                {cursorPt && cursor != null && (
                  <line x1={PL + (cursor / (vis.length - 1)) * (W - PL - PR)} y1={PT} x2={PL + (cursor / (vis.length - 1)) * (W - PL - PR)} y2={H - PB} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                )}
              </>
            );
          })()}
        </svg>

        {/* tooltip */}
        {cursorPt && cursor != null && (
          <div
            className="pointer-events-none absolute z-10 w-44 rounded border border-white/15 bg-[#0a0c10]/95 px-2.5 py-2 shadow-xl"
            style={{ left: Math.min(90, (cursor / Math.max(1, vis.length - 1)) * 96), top: 8, fontFamily: MONO }}
          >
            <div className="mb-1 flex justify-between text-[0.5rem] text-[#5d6675]">
              <span>{new Date(cursorPt.t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <RowT label={S(lang, "return")} val={fmtPct((cursorPt.r - (vis[0].r ?? 0)) * 100)} color={(cursorPt.r - (vis[0].r ?? 0)) >= 0 ? GREEN : RED} />
            <RowT label={S(lang, "change")} val={fmtPct((cursorPt.r - (vis[Math.max(0, cursor - 1)].r ?? cursorPt.r)) * 100)} color={(cursorPt.r - (vis[Math.max(0, cursor - 1)].r ?? cursorPt.r)) >= 0 ? GREEN : RED} />
            <RowT label={S(lang, "drawdown")} val={fmtPct((win?.maxDD ?? 0) * 100)} color={RED} />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[0.5rem] uppercase tracking-[0.16em] text-[#454d5a]" style={{ fontFamily: MONO }}>
        <span>{ar ? "النسب المئوية — بلا أسعار" : "Percentage return — no prices"}</span>
        <span>{win ? `${fmtPct(win.ret * 100)}` : ""}</span>
      </div>
    </div>
  );
}

function RowT({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div className="flex justify-between text-[0.58rem]">
      <span className="text-[#6d7685]">{label}</span>
      <span style={{ color }}>{val}</span>
    </div>
  );
}
