"use client";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";

/* ==================================================================
   Investments — realistic CANDLESTICK market charts (TradingView logic,
   Legacy Keepers dark identity). Deterministic daily OHLC dataset
   2013→present per asset, anchored to historical market cycles.
   Green=up / Red=down, Volume bars, Percentage axis (no prices),
   crosshair with OHLC tooltip, timeframes 1Y/6M/1M/1W/1D, zoom & pan.
   ================================================================== */

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";
const GREEN = "#34d399";
const RED = "#f87171";
const CYAN = "#7fb0ff";

/* ────────────── Deterministic OHLC generator (2013 → present) ────────────── */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
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

/* Annual targets per asset — realistic club performance (not all winners) */
const ASSETS: Record<string, {
  label: string; labelAr: string; perf: string; perfAr: string;
  vol: number; annual: Record<number, number>; base: number;
}> = {
  stocks: {
    label: "Stocks", labelAr: "الأسهم", perf: "Club Equity Performance", perfAr: "أداء أسهم النادي",
    vol: 0.013, base: 100, annual: {
      2013: 0.30, 2014: 0.13, 2015: 0.02, 2016: 0.11, 2017: 0.24, 2018: -0.04,
      2019: 0.31, 2020: 0.19, 2021: 0.30, 2022: -0.17, 2023: 0.27, 2024: 0.26, 2025: 0.14, 2026: 0.08,
    },
  },
  realestate: {
    label: "Real Estate", labelAr: "العقارات", perf: "Club Real Estate Performance", perfAr: "أداء عقارات النادي",
    vol: 0.004, base: 100, annual: {
      2013: 0.07, 2014: 0.06, 2015: 0.05, 2016: 0.05, 2017: 0.07, 2018: 0.03,
      2019: 0.04, 2020: 0.08, 2021: 0.12, 2022: 0.09, 2023: 0.03, 2024: 0.05, 2025: 0.06, 2026: 0.03,
    },
  },
  funds: {
    label: "Funds", labelAr: "الصناديق", perf: "Club Funds Performance", perfAr: "أداء صناديق النادي",
    vol: 0.008, base: 100, annual: {
      2013: 0.12, 2014: 0.07, 2015: 0.01, 2016: 0.06, 2017: 0.11, 2018: -0.02,
      2019: 0.16, 2020: 0.08, 2021: 0.12, 2022: -0.08, 2023: 0.15, 2024: 0.12, 2025: 0.07, 2026: 0.04,
    },
  },
  cars: {
    label: "Cars", labelAr: "السيارات", perf: "Club Car Investments", perfAr: "استثمارات سيارات النادي",
    vol: 0.006, base: 100, annual: {
      2013: 0.09, 2014: 0.08, 2015: 0.07, 2016: 0.06, 2017: 0.09, 2018: 0.05,
      2019: 0.07, 2020: 0.03, 2021: 0.18, 2022: 0.12, 2023: 0.09, 2024: 0.11, 2025: 0.08, 2026: 0.05,
    },
  },
  commodities: {
    label: "Commodities", labelAr: "السلع", perf: "Club Commodities Portfolio", perfAr: "محفظة سلع النادي",
    vol: 0.011, base: 100, annual: {
      2013: -0.06, 2014: -0.09, 2015: -0.12, 2016: 0.12, 2017: 0.08, 2018: -0.04,
      2019: 0.09, 2020: 0.15, 2021: 0.20, 2022: 0.08, 2023: 0.06, 2024: 0.14, 2025: 0.04, 2026: 0.05,
    },
  },
  crypto: {
    label: "Crypto", labelAr: "العملات الرقمية", perf: "Club Digital Assets", perfAr: "أصول النادي الرقمية",
    vol: 0.045, base: 100, annual: {
      2013: 2.5, 2014: -0.5, 2015: 0.4, 2016: 0.9, 2017: 3.0, 2018: -0.7,
      2019: 0.9, 2020: 2.5, 2021: 1.5, 2022: -0.65, 2023: 1.2, 2024: 0.6, 2025: 0.2, 2026: 0.15,
    },
  },
};

const TRADING_DAYS = 252;

interface Candle {
  t: number; // epoch ms
  o: number; h: number; l: number; c: number; // index level
  v: number; // volume
}

/* Build deterministic daily OHLC, anchored so each year sums to target. */
function buildCandles(id: string): Candle[] {
  const cfg = ASSETS[id];
  const g = normGen(id.length * 97 + id.charCodeAt(0));
  const out: Candle[] = [];
  let level = cfg.base;
  for (let year = 2013; year <= 2026; year++) {
    const target = cfg.annual[year] ?? 0.03;
    const z: number[] = [];
    for (let i = 0; i < TRADING_DAYS; i++) z.push(g());
    const mean = z.reduce((s, v) => s + v, 0) / TRADING_DAYS;
    const desiredSum = Math.log(1 + target);
    for (let i = 0; i < TRADING_DAYS; i++) {
      const det = desiredSum / TRADING_DAYS;
      const shock = cfg.vol * (z[i] - mean);
      const move = det + shock;
      const o = level;
      const c = Math.max(1, o * Math.exp(move));
      // wick
      const wick = cfg.vol * 0.5 * (Math.abs(z[i]) + 0.4);
      const h = Math.max(o, c) * (1 + wick * 0.7);
      const l = Math.min(o, c) * (1 - wick * 0.7);
      // volume: high when |move| large
      const v = Math.round(40 + Math.abs(move) * 2600 + (0.3 + Math.abs(z[i]) * 0.3) * 60);
      const t = new Date(Date.UTC(year, 0, 1)).getTime() + i * 86400000;
      out.push({ t, o, h, l, c, v });
      level = c;
    }
  }
  return out;
}

const DATASETS: Record<string, Candle[]> = {
  stocks: buildCandles("stocks"),
  realestate: buildCandles("realestate"),
  funds: buildCandles("funds"),
  cars: buildCandles("cars"),
  commodities: buildCandles("commodities"),
  crypto: buildCandles("crypto"),
};

const ORDER = ["stocks", "realestate", "funds", "cars", "commodities", "crypto"] as const;
const AVAIL: Record<string, number> = { stocks: 24, realestate: 15, funds: 11, cars: 7, commodities: 13, crypto: 7 };
const TOTAL = 77;

/* help text */
const STR = {
  portfolio: ["Portfolio", "الاستثمارات"],
  personal: ["Personal", "شخصي"], club: ["Club", "النادي"],
  balance: ["Balance", "الرصيد"], activePos: ["Active Positions", "المراكز النشطة"],
  totalInv: ["Total Investments", "إجمالي الاستثمارات"],
  noInv: ["No Personal Investments", "لا توجد استثمارات شخصية"],
  empty: ["Your personal portfolio is currently empty.", "محفظتك الشخصية فارغة حالياً."],
  totalAvail: ["Total Available", "الإجمالي المتاح"], availCat: ["Available Categories", "الأقسام المتاحة"],
  screens: ["Investment Screens", "شاشات الاستثمار"], open: ["Open", "فتح"],
  back: ["All Investments", "كل الاستثمارات"],
  marketData: ["Market Data", "بيانات السوق"], currentReturn: ["Current Return", "العائد الحالي"],
  year: ["Year", "السنة"], openT: ["Open", "الافتتاح"], high: ["High", "الأعلى"],
  low: ["Low", "الأدنى"], close: ["Close", "الإغلاق"], ret: ["Return", "العائد"], chg: ["Change", "التغير"],
  dd: ["Drawdown", "التراجع"], volume: ["Volume", "حجم التداول"], opportunity: ["Opportunities", "فرص"],
} as const;
const S = (lang: "en" | "ar", k: keyof typeof STR) => (lang === "ar" ? STR[k][1] : STR[k][0]);

export default function InvestmentsSection({ data: _data }: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [scope, setScope] = useState<"personal" | "club">("club");
  const [active, setActive] = useState<string | null>(null);

  const switchScope = (s: "personal" | "club") => { setScope(s); setActive(null); play("click"); };
  const openAsset = (id: string) => { setActive(id); play("open"); };
  const goBack = () => { setActive(null); play("click"); };

  return (
    <div className="mx-auto max-w-6xl px-1" dir={ar ? "rtl" : "ltr"}>
      <header className="mb-8">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold uppercase tracking-[0.12em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>{S(lang, "portfolio")}</h1>
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
          <motion.div key="big" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <button onClick={goBack} className="mb-5 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-[#7fb0ff] hover:text-sky-200" style={{ fontFamily: MONO }}>← {S(lang, "back")}</button>
            <AnalysisScreen id={active} lang={lang} />
          </motion.div>
        ) : (
          <motion.div key="club" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "club")} Portfolio</div>
            <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-2">
              <Metric label={S(lang, "totalAvail")} value={String(TOTAL)} highlight />
              <Metric label={S(lang, "availCat")} value="6" />
            </div>
            <div className="mb-4 mt-8 text-[0.6rem] uppercase tracking-[0.3em] text-[#7b8494]" style={{ fontFamily: MONO }}>{S(lang, "screens")}</div>
            <div className="space-y-1 border-t border-white/[0.06] pt-1">
              {ORDER.map((id) => {
                const a = ASSETS[id];
                const ds = DATASETS[id];
                const last = ds[ds.length - 1];
                const ret = (last.c / ds[0].c - 1) * 100;
                const up = ret >= 0;
                return (
                  <div key={id} className="flex items-center gap-4 py-3">
                    <span className="w-3 text-[0.9rem]" style={{ color: up ? GREEN : RED }}>{up ? "▲" : "▼"}</span>
                    <span className="w-44 text-[0.9rem] uppercase tracking-[0.12em] text-[#eef2f7]" style={{ fontFamily: LUX }}>{ar ? a.labelAr : a.label}</span>
                    <span className="hidden flex-1 text-[0.55rem] uppercase tracking-[0.14em] text-[#5d6675] sm:block" style={{ fontFamily: MONO }}>
                      {(up ? "+" : "")}{ret.toFixed(1)}% · {S(lang, "ret")}
                    </span>
                    <span className="ml-auto text-[0.62rem] text-[#7fb0ff]" style={{ fontFamily: MONO }}>{AVAIL[id]} {S(lang, "opportunity")}</span>
                    <button onClick={() => openAsset(id)}
                      className="rounded border border-[#7fb0ff]/40 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.2em] text-[#7fb0ff] transition hover:border-[#7fb0ff] hover:text-white"
                      style={{ fontFamily: MONO }}>{S(lang, "open")} ↗</button>
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

/* timeframes (in candles) */
const TF: { id: string; label: string; labelAr: string; n: number; step: number }[] = [
  { id: "1Y", label: "1Y", labelAr: "1س", n: TRADING_DAYS, step: 4 },
  { id: "6M", label: "6M", labelAr: "6ش", n: Math.round(TRADING_DAYS / 2), step: 3 },
  { id: "1M", label: "1M", labelAr: "1ش", n: 22, step: 2 },
  { id: "1W", label: "1W", labelAr: "1أ", n: 5, step: 1 },
  { id: "1D", label: "1D", labelAr: "1ي", n: 3, step: 1 },
];

function AnalysisScreen({ id, lang }: { id: string; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  const a = ASSETS[id];
  const data = DATASETS[id];
  const [tf, setTf] = useState("1Y");
  const [zoom, setZoom] = useState(1); // 1..4 extra zoom-in
  const [off, setOff] = useState(0);
  const [cursor, setCursor] = useState<number | null>(null);
  const dragRef = useRef<{ x0: number; start: number } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const tfConf = TF.find((x) => x.id === tf)!;
  const visibleCount = Math.max(3, Math.round(tfConf.n / zoom));
  const maxOff = Math.max(0, data.length - visibleCount);
  const effOff = Math.min(off, maxOff);
  const vis = data.slice(effOff, effOff + visibleCount);

  /* current window return & drawdown */
  const win = useMemo(() => {
    if (!vis.length) return null;
    const base = vis[0].c;
    const ret = (vis[vis.length - 1].c / base - 1) * 100;
    let peak = vis[0].c;
    let maxDD = 0;
    for (const c of vis) { if (c.h > peak) peak = c.h; const dd = (c.c - peak) / peak * 100; if (dd < maxDD) maxDD = dd; }
    return { ret, maxDD, base };
  }, [vis]);

  /* %-axis range (dynamic) */
  const maxPct = useMemo(() => {
    if (!vis.length) return 100;
    let m = 0;
    for (const c of vis) {
      const p = Math.abs((c.h - vis[0].c) / vis[0].c * 100);
      const q = Math.abs((c.l - vis[0].c) / vis[0].c * 100);
      m = Math.max(m, p, q);
    }
    m = m * 1.2;
    const steps = [5, 10, 20, 40, 60, 80, 100, 150, 200, 300, 500, 800, 1200, 2000, 4000];
    for (const s of steps) if (m <= s) return s;
    return Math.ceil(m / 500) * 500;
  }, [vis]);

  const pct = (level: number) => (level / vis[0].c - 1) * 100;
  const fmt = (f: number) => `${f >= 0 ? "+" : ""}${f.toFixed(1)}%`;

  /* interaction */
  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x0: e.clientX, start: effOff };
    setCursorFrom(e);
  };
  const onMove = (e: React.PointerEvent) => {
    setCursorFrom(e);
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.x0;
      const perCandle = Math.max(1, boxRef.current ? boxRef.current.clientWidth / visibleCount : 6);
      setOff(Math.max(0, Math.min(maxOff, dragRef.current.start + Math.round(-dx / perCandle))));
    }
  };
  const onUp = () => { dragRef.current = null; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(6, z + (e.deltaY > 0 ? 1 : -1))));
  };
  const setCursorFrom = (e: React.PointerEvent) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rel = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setCursor(Math.round(rel * (vis.length - 1)));
  };

  const cursorC = cursor != null && cursor >= 0 && cursor < vis.length ? vis[cursor] : null;

  /* geometry */
  const W = 900, H = 320, PL = 62, PR = 18, PT = 18, PB = 26, VOLH = 54;
  const chartH = H - PT - PB - VOLH - 8;

  const xFor = (i: number) => PL + (i / Math.max(1, vis.length - 1)) * (W - PL - PR);
  const yFor = (level: number) => {
    const p = pct(level);
    return PT + (1 - (p + maxPct) / (2 * maxPct)) * chartH;
  };

  const lastClose = vis[vis.length - 1]?.c ?? 1;

  return (
    <div>
      {/* header */}
      <div className="mb-1">
        <div className="text-[0.62rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>{ar ? a.labelAr : a.label}</div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[clamp(1.4rem,3vw,2.2rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
              {ar ? a.perfAr : a.perf}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-[0.5rem] uppercase tracking-[0.2em] text-[#454d5a]" style={{ fontFamily: MONO }}>
              <span>{S(lang, "marketData")}</span><span>·</span><span>{ar ? "بيانات من 2013" : "Data since 2013"}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[1.7rem] leading-none" style={{ fontFamily: MONO, color: (win?.ret ?? 0) >= 0 ? GREEN : RED }}>
              {fmt(win?.ret ?? 0)}
            </div>
            <div className="text-[0.5rem] uppercase tracking-[0.2em] text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "currentReturn")}</div>
          </div>
        </div>
      </div>

      {/* timeframes */}
      <div className="mb-3 mt-4 flex items-center gap-1 border-b border-white/[0.06] pb-2">
        {TF.map((x) => (
          <button key={x.id} onClick={() => { setTf(x.id); setOff(0); setZoom(1); }}
            className="rounded px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] transition-colors"
            style={{ fontFamily: MONO, color: tf === x.id ? "#eef2f7" : "#5d6675", background: tf === x.id ? "rgba(127,176,255,0.12)" : "transparent" }}>
            {ar ? x.labelAr : x.label}
          </button>
        ))}
        <span className="ml-auto text-[0.5rem] uppercase tracking-[0.18em] text-[#454d5a]" style={{ fontFamily: MONO }}>
          {ar ? "اسحب · عجلة تكبير" : "Drag · Wheel zoom"}
        </span>
      </div>

      {/* chart */}
      <div
        ref={boxRef}
        className="relative select-none overflow-hidden border border-white/[0.08] bg-[#06070b]"
        style={{ cursor: "crosshair", touchAction: "none" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}
      >
        {/* grid + %-axis labels */}
        {Array.from({ length: 7 }).map((_, i) => {
          const p = -maxPct + (i / 6) * 2 * maxPct;
          const y = PT + (1 - (p + maxPct) / (2 * maxPct)) * chartH;
          const zero = Math.abs(p) < 0.5;
          return (
            <div key={i} className="pointer-events-none absolute inset-x-0 flex items-center" style={{ top: y }}>
              <span className="absolute left-0 top-0 h-px w-full" style={{ background: zero ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)" }} />
              <span className="absolute right-0 top-0 -translate-y-1/2 px-1 text-[0.5rem] text-[#7b8494]" style={{ fontFamily: MONO }}>
                {p === 0 ? "0%" : `${p > 0 ? "+" : ""}${Math.round(p)}%`}
              </span>
            </div>
          );
        })}

        <svg viewBox={`0 0 ${W} ${H}`} className="relative block w-full" preserveAspectRatio="none" aria-hidden="true">
          {vis.length > 0 && (
            <>
              {/* candles */}
              {vis.map((c, i) => {
                const cx = xFor(i);
                const iw = (W - PL - PR) / Math.max(1, vis.length - 1);
                const bw = Math.max(1.5, iw * 0.62 * (Math.min(1, 40 / vis.length)));
                const up = c.c >= c.o;
                const col = up ? GREEN : RED;
                const yO = yFor(c.o), yC = yFor(c.c), yH = yFor(c.h), yL = yFor(c.l);
                return (
                  <g key={i}>
                    <line x1={cx} y1={yH} x2={cx} y2={yL} stroke={col} strokeWidth="1" opacity="0.9" />
                    <rect x={cx - bw / 2} y={Math.min(yO, yC)} width={bw} height={Math.max(1.2, Math.abs(yC - yO))} fill={col} rx="0.3" />
                    {/* volume */}
                    <rect x={cx - bw / 2} y={H - PB - VOLH + (1 - c.v / 300) * VOLH} width={bw} height={Math.max(1, (c.v / 300) * VOLH)} fill={col} opacity="0.45" />
                  </g>
                );
              })}
              {/* x time labels */}
              {(() => {
                const n = Math.min(6, vis.length);
                const labels: { x: number; txt: string }[] = [];
                for (let k = 0; k < n; k++) {
                  const i = Math.round((k / (n - 1)) * (vis.length - 1));
                  const d = new Date(vis[i].t);
                  labels.push({ x: xFor(i), txt: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) });
                }
                return labels.map((lb, k) => (
                  <text key={k} x={lb.x} y={H - PB - VOLH - 6} textAnchor={k === 0 ? "start" : k === n - 1 ? "end" : "middle"}
                    fill="rgba(150,160,175,0.35)" fontSize="7.5" style={{ fontFamily: MONO }}>{lb.txt}</text>
                ));
              })()}
              {/* crosshair vertical */}
              {cursorC && cursor != null && (
                <>
                  <line x1={xFor(cursor)} y1={PT} x2={xFor(cursor)} y2={H - PB - VOLH} stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="3 2" />
                  <line x1={PL} y1={yFor(cursorC.c)} x2={W - PR} y2={yFor(cursorC.c)} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 2" />
                  <circle cx={xFor(cursor)} cy={yFor(cursorC.c)} r="3" fill={cursorC.c >= cursorC.o ? GREEN : RED} />
                </>
              )}
            </>
          )}
        </svg>

        {/* tooltip */}
        {cursorC && cursor != null && (
          <div className="pointer-events-none absolute z-10 w-48 rounded border border-white/15 bg-[#0a0c10]/95 px-3 py-2 shadow-xl" style={{ left: 8, top: 8, fontFamily: MONO }}>
            <div className="mb-1 text-[0.5rem] text-[#7fb0ff]">{new Date(cursorC.t).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
            <RowT label={S(lang, "openT")} val={fmt(pct(cursorC.o))} c="#cdd5e0" />
            <RowT label={S(lang, "high")} val={fmt(pct(cursorC.h))} c={GREEN} />
            <RowT label={S(lang, "low")} val={fmt(pct(cursorC.l))} c={RED} />
            <RowT label={S(lang, "close")} val={fmt(pct(cursorC.c))} c={cursorC.c >= cursorC.o ? GREEN : RED} />
            <div className="my-1 h-px bg-white/[0.08]" />
            <RowT label={S(lang, "ret")} val={fmt(pct(cursorC.c))} c={cursorC.c >= cursorC.o ? GREEN : RED} />
            <RowT label={S(lang, "chg")} val={fmt((cursorC.c - cursorC.o) / cursorC.o * 100)} c={cursorC.c >= cursorC.o ? GREEN : RED} />
          </div>
        )}

        {/* volume label */}
        <div className="pointer-events-none absolute right-3 bottom-1 text-[0.45rem] uppercase tracking-[0.16em] text-[#454d5a]" style={{ fontFamily: MONO }}>
          {S(lang, "volume")}
        </div>
      </div>
    </div>
  );
}

function RowT({ label, val, c }: { label: string; val: string; c: string }) {
  return (
    <div className="flex justify-between text-[0.58rem]">
      <span className="text-[#6d7685]">{label}</span>
      <span style={{ color: c }}>{val}</span>
    </div>
  );
}
