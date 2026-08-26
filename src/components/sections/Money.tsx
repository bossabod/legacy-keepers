"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart, CandlestickSeries, HistogramSeries, ColorType, PriceScaleMode, type IChartApi, type ISeriesApi, type UTCTimestamp, type CandlestickData, type HistogramData, type MouseEventParams } from "lightweight-charts";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";

/* ==================================================================
   Investments — professional financial charts via TradingView
   Lightweight Charts (Apache-2.0). Real Time Scale, crosshair bound to
   chart coordinates, Percentage price scale, Volume, zoom/pan,
   timeframes, fullscreen. Legacy Keepers dark identity. Deterministic
   2013→present daily dataset per asset.
   ================================================================== */

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";
const GREEN = "#5fae83";
const RED = "#c05c52";
const CYAN = "#6b9ac8";
const BG = "#060a12";

/* ───────── Deterministic OHLC (2013 → present) ───────── */
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

interface Candle { t: number; o: number; h: number; l: number; c: number; v: number; }

function buildCandles(id: string): Candle[] {
  const cfg = ASSETS[id];
  const g = normGen(id.length * 97 + id.charCodeAt(0));
  const out: Candle[] = [];
  let level = cfg.base;
  for (let year = 2013; year <= 2026; year++) {
    const target = cfg.annual[year] ?? 0.03;
    const z: number[] = [];
    for (let i = 0; i < 252; i++) z.push(g());
    const mean = z.reduce((s, v) => s + v, 0) / 252;
    const desiredSum = Math.log(1 + target);
    for (let i = 0; i < 252; i++) {
      const det = desiredSum / 252;
      const shock = cfg.vol * (z[i] - mean);
      const move = det + shock;
      const o = level;
      const c = Math.max(1, o * Math.exp(move));
      const wick = cfg.vol * 0.5 * (Math.abs(z[i]) + 0.4);
      const h = Math.max(o, c) * (1 + wick * 0.7);
      const l = Math.min(o, c) * (1 - wick * 0.7);
      const v = Math.round(40 + Math.abs(move) * 2600 + (0.3 + Math.abs(z[i]) * 0.3) * 60);
      const t = new Date(Date.UTC(year, 0, 1)).getTime() / 1000 + i * 86400;
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
/* نسبة التحقيق السنوي المطلوبة (الترتيب: أسهم 38 > عقار 26 > سيارات 19 > صناديق 15 > سلع 12 > عملات رقمية 8) */
const PERF: Record<string, number> = { stocks: 38, realestate: 26, cars: 19, funds: 15, commodities: 12, crypto: 8 };

const STR = {
  portfolio: ["Portfolio", "الاستثمارات"], personal: ["Personal", "شخصي"], club: ["Club", "النادي"],
  balance: ["Balance", "الرصيد"], activePos: ["Active Positions", "المراكز النشطة"],
  totalInv: ["Total Investments", "إجمالي الاستثمارات"],
  noInv: ["No Personal Investments", "لا توجد استثمارات شخصية"],
  empty: ["Your personal portfolio is currently empty.", "محفظتك الشخصية فارغة حالياً."],
  totalAvail: ["Total Available", "الإجمالي المتاح"], availCat: ["Available Categories", "الأقسام المتاحة"],
  screens: ["Investment Screens", "شاشات الاستثمار"], open: ["Open", "فتح"], back: ["All Investments", "كل الاستثمارات"],
  marketData: ["Market Data", "بيانات السوق"], currentReturn: ["Current Return", "العائد الحالي"],
  openT: ["Open", "الافتتاح"], high: ["High", "الأعلى"], low: ["Low", "الأدنى"],
  close: ["Close", "الإغلاق"], ret: ["Return", "العائد"], chg: ["Change", "التغير"],
  volume: ["Volume", "حجم التداول"], opportunity: ["Opportunities", "فرص"],
  expand: ["Expand", "تكبير"], closeT: ["Close", "إغلاق"], reset: ["Reset", "إعادة"],
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
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-light uppercase tracking-[0.14em] text-[#e6eef8]" style={{ fontFamily: LUX }}>{S(lang, "portfolio")}</h1>
        <div className="mt-5 flex items-center gap-7 border-b border-[#6b9ac8]/[0.10]">
          {(["personal", "club"] as const).map((s) => {
            const on = scope === s;
            return (
              <button key={s} onClick={() => switchScope(s)}
                className="relative pb-2.5 text-[0.78rem] uppercase tracking-[0.25em] transition-colors duration-300"
                style={{ fontFamily: MONO, color: on ? "#a8cfe8" : "#4a5566" }}>
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
            <button onClick={goBack} className="mb-5 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-[#6b9ac8] hover:text-[#a8cfe8]" style={{ fontFamily: MONO }}>← {S(lang, "back")}</button>
            <AssetChart id={active} lang={lang} />
          </motion.div>
        ) : (
          <motion.div key="club" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "club")} Portfolio</div>
            <div className="mb-5 mt-1 grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-2">
              <Metric label={S(lang, "totalAvail")} value={String(TOTAL)} highlight />
              <Metric label={S(lang, "screens")} value="6" />
            </div>
            {/* 6 investment cards — 2×3 grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {ORDER.map((id) => (
                <MiniCard key={id} id={id} lang={lang} onOpen={() => openAsset(id)} />
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
    <div className="bg-[#060a12] px-4 py-5">
      <div className="text-[0.52rem] uppercase tracking-[0.24em] text-[#5d6675]" style={{ fontFamily: MONO }}>{label}</div>
      <div className="mt-1.5 text-[1.5rem] leading-none" style={{ fontFamily: MONO, color: highlight ? GREEN : "#e6eef8" }}>{value}</div>
    </div>
  );
}

/* ─────────── Mini investment card with a live sparkline chart ─────────── */
function MiniCard({ id, lang, onOpen }: { id: string; lang: "en" | "ar"; onOpen: () => void }) {
  const ar = lang === "ar";
  const a = ASSETS[id];
  const ds = DATASETS[id];
  const mountRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    let chart: IChartApi | null = null;
    try {
      chart = createChart(mountRef.current, {
        autoSize: true,
        layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "transparent", fontFamily: "'IBM Plex Mono', monospace", fontSize: 8 },
        grid: { vertLines: { visible: false }, horzLines: { visible: false } },
        rightPriceScale: { visible: false },
        timeScale: { visible: false },
        crosshair: { mode: 1, vertLine: { color: "rgba(126,176,216,0.5)" }, horzLine: { color: "rgba(126,176,216,0.5)" } },
        handleScroll: false,
        handleScale: false,
      });
      const series = chart.addSeries(CandlestickSeries, {
        upColor: GREEN, downColor: RED, borderUpColor: GREEN, borderDownColor: RED, wickUpColor: GREEN, wickDownColor: RED,
      });
      series.setData(ds.map((d) => ({ time: d.t as UTCTimestamp, open: d.o, high: d.h, low: d.l, close: d.c })));
      chart.timeScale().setVisibleLogicalRange({ from: ds.length - 90, to: ds.length + 2 });
      chartRef.current = chart;
    } catch (e) { /* noop */ }
    return () => { try { chart?.remove(); } catch (e) { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden border border-[#6b9ac8]/[0.10] bg-[#060a12] text-left transition-all duration-300 hover:border-[#6b9ac8]/45 hover:bg-[#0d0b06]"
    >
      {/* header: name + annual performance */}
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <span className="text-[0.8rem] uppercase tracking-[0.12em] text-[#e6eef8]" style={{ fontFamily: LUX }}>{ar ? a.labelAr : a.label}</span>
        <span className="text-[0.72rem]" style={{ fontFamily: MONO, color: GREEN }}>
          +{PERF[id]}%
        </span>
      </div>

      {/* mini chart */}
      <div ref={mountRef} className="h-24 w-full" />

      {/* footer: opportunities only (arrow removed) */}
      <div className="flex items-center justify-between px-4 pb-3 pt-2">
        <span className="text-[0.55rem] uppercase tracking-[0.16em] text-[#5d6675]" style={{ fontFamily: MONO }}>
          {AVAIL[id]} {S(lang, "opportunity")}
        </span>
      </div>
    </button>
  );
}

/* ─────────── Lightweight Charts asset screen ─────────── */
function AssetChart({ id, lang }: { id: string; lang: "en" | "ar" }) {
  const ar = lang === "ar";
  const a = ASSETS[id];
  const data = DATASETS[id];
  const mountRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [tf, setTf] = useState("1Y");
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  /* map to lightweight-charts series */
  const candleData: CandlestickData[] = data.map((d) => ({
    time: d.t as UTCTimestamp, open: d.o, high: d.h, low: d.l, close: d.c,
  }));
  const volData: HistogramData[] = data.map((d) => ({
    time: d.t as UTCTimestamp, value: d.v, color: d.c >= d.o ? "rgba(95,174,131,0.35)" : "rgba(192,92,82,0.35)",
  }));

  /* last return % */
  const last = data[data.length - 1];
  const baseIdx = Math.max(0, data.length - 252);
  const base = data[baseIdx].c;
  const currentRet = (last.c / base - 1) * 100;

  const tfDays: Record<string, number> = { "1Y": 252, "6M": 126, "1M": 22, "1W": 5, "1D": 2 };

  const init = (container: HTMLElement) => {
    const chart = createChart(container, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: BG }, textColor: "#8b95a5", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 },
      grid: { vertLines: { color: "rgba(126,176,216,0.05)" }, horzLines: { color: "rgba(126,176,216,0.05)" } },
      rightPriceScale: { borderColor: "rgba(126,176,216,0.12)", mode: PriceScaleMode.Percentage },
      timeScale: { borderColor: "rgba(126,176,216,0.12)", timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(126,176,216,0.6)", labelBackgroundColor: "#2a2313" },
        horzLine: { color: "rgba(126,176,216,0.6)", labelBackgroundColor: "#2a2313" },
      },
    });
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: GREEN, downColor: RED, borderUpColor: GREEN, borderDownColor: RED, wickUpColor: GREEN, wickDownColor: RED,
    });
    candle.setData(candleData);
    const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    vol.setData(volData);
    chartRef.current = chart;
    candleRef.current = candle;
    volRef.current = vol;

    /* live crosshair tooltip — O · H · L · C · Δ% for the hovered candle */
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      const tip = tipRef.current;
      if (!tip) return;
      const cd = param.seriesData.get(candle) as CandlestickData<UTCTimestamp> | undefined;
      if (!param.time || !cd) { tip.style.opacity = "0"; return; }
      const t = (param.time as unknown) as number;
      const date = new Date(t * 1000).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const prev = candleData.findIndex((c) => c.time === param.time);
      const prevClose = prev > 0 ? (candleData[prev - 1] as CandlestickData).close : cd.open;
      const pct = ((cd.close / prevClose - 1) * 100);
      const chg = cd.close >= prevClose;
      tip.innerHTML =
        `<div style="font-family:var(--font-ibm-mono);color:#3d6a94;letter-spacing:.12em;font-size:9px;text-transform:uppercase;margin-bottom:4px">${date}</div>` +
        `<div style="display:grid;grid-template-columns:auto auto;gap:3px 14px;font-family:var(--font-ibm-mono);font-size:10px;line-height:1.5">` +
        `  <span style="color:#4a5566">O</span><span style="color:#e6eef8;text-align:right">${cd.open.toFixed(2)}</span>` +
        `  <span style="color:#4a5566">H</span><span style="color:#e6eef8;text-align:right">${cd.high.toFixed(2)}</span>` +
        `  <span style="color:#4a5566">L</span><span style="color:#e6eef8;text-align:right">${cd.low.toFixed(2)}</span>` +
        `  <span style="color:#4a5566">C</span><span style="color:${chg ? GREEN : RED};text-align:right">${cd.close.toFixed(2)}</span>` +
        `  <span style="color:#4a5566">Δ</span><span style="color:${chg ? GREEN : RED};text-align:right">${(pct >= 0 ? "+" : "")}${pct.toFixed(2)}%</span>` +
        `</div>`;
      tip.style.opacity = "1";
    });

    applyTimeframe(chart, tf);
    return chart;
  };

  const applyTimeframe = (chart: IChartApi, frame: string) => {
    const n = tfDays[frame] ?? 252;
    chart.timeScale().setVisibleLogicalRange({ from: data.length - n, to: data.length + 4 });
  };

  const zoomIn = () => {
    const c = chartRef.current;
    if (!c) return;
    const r = c.timeScale().getVisibleLogicalRange();
    if (!r) return;
    const mid = (r.from + r.to) / 2;
    c.timeScale().setVisibleLogicalRange({ from: mid - (mid - r.from) * 0.6, to: mid + (r.to - mid) * 0.6 });
  };
  const zoomOut = () => {
    const c = chartRef.current;
    if (!c) return;
    const r = c.timeScale().getVisibleLogicalRange();
    if (!r) return;
    const mid = (r.from + r.to) / 2;
    c.timeScale().setVisibleLogicalRange({ from: mid - (mid - r.from) * 1.7, to: mid + (r.to - mid) * 1.7 });
  };
  const panLeft = () => {
    const c = chartRef.current;
    if (!c) return;
    const r = c.timeScale().getVisibleLogicalRange();
    if (!r) return;
    const span = r.to - r.from;
    c.timeScale().setVisibleLogicalRange({ from: r.from + span * 0.2, to: r.to + span * 0.2 });
  };
  const panRight = () => {
    const c = chartRef.current;
    if (!c) return;
    const r = c.timeScale().getVisibleLogicalRange();
    if (!r) return;
    const span = r.to - r.from;
    c.timeScale().setVisibleLogicalRange({ from: r.from - span * 0.2, to: r.to - span * 0.2 });
  };
  const resetView = () => {
    const c = chartRef.current;
    if (!c) return;
    applyTimeframe(c, tf);
  };

  /* mount effect */
  useEffect(() => {
    if (!mountRef.current) return;
    let chart: IChartApi | null = null;
    try {
      chart = init(mountRef.current);
    } catch (e) { /* noop */ }
    const ro = new ResizeObserver(() => { try { chart?.timeScale().fitContent(); } catch (e) { /* noop */ } });
    if (mountRef.current) ro.observe(mountRef.current);
    return () => { ro.disconnect(); try { chart?.remove(); } catch (e) { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const ch = chartRef.current;
    if (!ch) return;
    applyTimeframe(ch, tf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tf]);

  return (
    <div>
      <div className="mb-1">
        <div className="text-[0.62rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>{ar ? a.labelAr : a.label}</div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[clamp(1.4rem,3vw,2.2rem)] font-light uppercase tracking-[0.12em] text-[#e6eef8]" style={{ fontFamily: LUX }}>
              {ar ? a.perfAr : a.perf}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-[0.5rem] uppercase tracking-[0.2em] text-[#454d5a]" style={{ fontFamily: MONO }}>
              <span>{S(lang, "marketData")}</span><span>·</span><span>{ar ? "من 2013" : "Since 2013"}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[1.7rem] leading-none" style={{ fontFamily: MONO, color: currentRet >= 0 ? GREEN : RED }}>
              {(currentRet >= 0 ? "+" : "")}{currentRet.toFixed(1)}%
            </div>
            <div className="text-[0.5rem] uppercase tracking-[0.2em] text-[#5d6675]" style={{ fontFamily: MONO }}>{S(lang, "currentReturn")}</div>
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div className="mb-3 mt-4 flex flex-wrap items-center gap-1 border-b border-[#6b9ac8]/[0.10] pb-2">
        {["1Y", "6M", "1M", "1W", "1D"].map((x) => (
          <button key={x} onClick={() => setTf(x)}
            className="rounded px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] transition-colors"
            style={{ fontFamily: MONO, color: tf === x ? "#a8cfe8" : "#4a5566", background: tf === x ? "rgba(126,176,216,0.12)" : "transparent" }}>
            {x}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <ToolBtn label="−" onClick={zoomOut} />
          <ToolBtn label="+" onClick={zoomIn} />
          <ToolBtn label="←" onClick={panLeft} />
          <ToolBtn label="→" onClick={panRight} />
          <ToolBtn label="RESET" onClick={resetView} />
          <ToolBtn label="⛶" onClick={() => setExpanded(true)} title={S(lang, "expand")} />
        </div>
      </div>

      {/* chart (or fullscreen) */}
      <div
        className={`relative w-full overflow-hidden border border-[#6b9ac8]/[0.10] bg-[#060a12] ${expanded ? "fixed inset-0 z-50" : ""}`}
        style={{ height: expanded ? "100vh" : "420px" }}
      >
        <div ref={mountRef} className="h-full w-full" />
        {/* crosshair tooltip */}
        <div
          ref={tipRef}
          className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-[#6b9ac8]/20 bg-[#080c14]/92 px-3 py-2 opacity-0 backdrop-blur-sm transition-opacity duration-150"
        />
        {expanded && (
          <button onClick={() => setExpanded(false)}
            className="absolute right-3 top-3 z-10 rounded border border-[#6b9ac8]/40 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-[#6b9ac8] hover:text-[#a8cfe8]"
            style={{ fontFamily: MONO }}>
            × {S(lang, "closeT")}
          </button>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ label, onClick, title }: { label: string; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title}
      className="rounded border border-[#6b9ac8]/[0.16] px-2 py-1 text-[0.62rem] text-[#8a97a8] transition hover:border-[#6b9ac8]/50 hover:text-[#a8cfe8]"
      style={{ fontFamily: MONO }}>
      {label}
    </button>
  );
}
