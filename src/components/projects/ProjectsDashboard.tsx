"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useApp } from "@/lib/store";
import type { AppData } from "@/lib/types";
import {
  MONTHS,
  CURRENT_MONTH,
  snapshot,
  tally,
} from "@/lib/projects-registry";
import { buildSeries, sliceRange, TARGET, type Point } from "@/lib/performance-series";

/* ------------------------------------------------------------------ */
/*  ProjectsDashboard — internal operating-system overview for the     */
/*  Projects landing page. Thin white typography, precise grid, custom */
/*  self-drawing graphs, live metrics and micro system details.        */
/*  Numbers count up; every module fades in separately, once.          */
/* ------------------------------------------------------------------ */

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

function useCountUp(target: number, run: boolean, ms = 1900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return n;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/* Bilingual micro-labels for this module. */
const D = {
  subtitle: { en: "Private Internal Project Management System", ar: "نظام إدارة مشاريع داخلي خاص" },
  active: { en: "Active Projects", ar: "مشاريع نشطة" },
  completed: { en: "Completed Projects", ar: "مشاريع مكتملة" },
  archived: { en: "Archived Projects", ar: "مشاريع مؤرشفة" },
  pending: { en: "Pending Applications", ar: "طلبات قيد الانتظار" },
  capacity: { en: "Project Capacity", ar: "سعة المشاريع" },
  growth: { en: "Annual Growth", ar: "النمو السنوي" },
  perf: { en: "Annual Performance", ar: "الأداء السنوي" },
  departments: { en: "Departments", ar: "الأقسام" },
  members: { en: "Members", ar: "الأعضاء" },
  reviews: { en: "Pending Reviews", ar: "مراجعات قيد الانتظار" },
  completion: { en: "Internal Completion", ar: "الاكتمال الداخلي" },
  sysStatus: { en: "SYSTEM STATUS", ar: "حالة النظام" },
  pIndex: { en: "PROJECT INDEX", ar: "مؤشر المشاريع" },
  netStatus: { en: "NETWORK STATUS", ar: "حالة الشبكة" },
  memberAccess: { en: "MEMBER ACCESS", ar: "وصول الأعضاء" },
  activeSession: { en: "ACTIVE SESSION", ar: "جلسة نشطة" },
  currentYear: { en: "CURRENT YEAR", ar: "السنة الحالية" },
  evolution: { en: "Project Evolution", ar: "تطور المشاريع" },
  growth2: { en: "Monthly Growth", ar: "النمو الشهري" },
  index: { en: "Internal Index", ar: "المؤشر الداخلي" },
  activity: { en: "Project Activity", ar: "نشاط المشاريع" },
  timeline: { en: "Timeline", ar: "الخط الزمني" },
  digital: { en: "Digital Projects", ar: "المشاريع الرقمية" },
  physical: { en: "Physical Projects", ar: "المشاريع الواقعية" },
  open: { en: "OPEN ARCHIVE", ar: "فتح الأرشيف" },
};

export default function ProjectsDashboard({
  data,
  onOpenTrack,
}: {
  data: AppData;
  onOpenTrack: (track: "digital" | "physical") => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const t = (k: keyof typeof D) => (ar ? D[k].ar : D[k].en);

  const [endDate] = useState<Date>(() => new Date());

  const hostRef = useRef<HTMLDivElement>(null);
  const inView = useInView(hostRef, { once: true, amount: 0.2 });

  /* Aggregate from the project registry. */
  const agg = useMemo(() => {
    const dig = tally("digital", CURRENT_MONTH);
    const phy = tally("physical", CURRENT_MONTH);
    const active = dig.active + phy.active;
    const completed = dig.completed + phy.completed;
    const archived = dig.archived + phy.archived;
    const members = data.members.length;
    const avgComplete = Math.round(
      ([...snapshot("digital", CURRENT_MONTH), ...snapshot("physical", CURRENT_MONTH)]
        .reduce((s, r) => s + r.completion, 0) /
        Math.max(1, [...snapshot("digital", CURRENT_MONTH), ...snapshot("physical", CURRENT_MONTH)].length))
    );
    return { active, completed, archived, members, avgComplete };
  }, [data]);

  /* Performance series for the large graph. */
  const series: Point[] = useMemo(() => (endDate ? buildSeries(endDate) : []), [endDate]);
  const chartData: Point[] = useMemo(() => sliceRange(series, "1Y"), [series]);

  /* Monthly activity (sum of completion across both tracks per month). */
  const monthly = useMemo(() => {
    return MONTHS.map((m) => {
      const d = snapshot("digital", m);
      const p = snapshot("physical", m);
      const sum = [...d, ...p].reduce((s, r) => s + r.completion, 0);
      const count = Math.max(1, d.length + p.length);
      return { m, avg: Math.round(sum / count) };
    });
  }, []);

  const membersCount = useCountUp(agg.members, inView);
  const activeCount = useCountUp(agg.active, inView);
  const completedCount = useCountUp(agg.completed, inView);
  const archivedCount = useCountUp(agg.archived, inView);
  const completionCount = useCountUp(Math.max(agg.avgComplete, 0), inView);
  const growthCount = useCountUp(TARGET, inView);

  return (
    <div className="w-full" dir={ar ? "rtl" : "ltr"} ref={hostRef}>
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-12">
        {/* ══════════ LEFT — PROJECT OPERATIONS ══════════ */}
        <motion.aside
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-6 bg-white/25" />
              <span className="text-[0.5rem] tracking-[0.3em] text-[#4d5662]" style={{ fontFamily: MONO }}>OOI·OPS</span>
            </div>
            <h2
              className="text-[clamp(1.4rem,2.6vw,2.1rem)] font-semibold leading-tight tracking-[0.04em] text-[#eef2f7]"
              style={{ fontFamily: LUX }}
            >
              {ar ? "عمليات المشاريع" : "PROJECT OPERATIONS"}
            </h2>
            <p className="mt-2 max-w-[22ch] text-[0.62rem] leading-relaxed tracking-[0.05em] text-[#5d6675]" style={{ fontFamily: MONO }}>
              {t("subtitle")}
            </p>
          </div>

          <div className="space-y-0.5 border-t border-white/[0.06] pt-3">
            <Row label={t("active")} value={fmt(activeCount)} live="A-1" />
            <Row label={t("completed")} value={fmt(completedCount)} live="A-2" />
            <Row label={t("archived")} value={fmt(archivedCount)} live="A-3" />
            <Row label={t("pending")} value="21" live="B-1" />
            <Row label={t("capacity")} value="12" live="B-2" />
            <Row label={t("growth")} value={`${fmt(growthCount)}%`} live="B-3" up />
          </div>

          <div className="mt-6 space-y-3">
            <EntryButton label={t("digital")} sub="DIG-01" onClick={() => onOpenTrack("digital")} />
            <EntryButton label={t("physical")} sub="GRD-01" onClick={() => onOpenTrack("physical")} />
          </div>
        </motion.aside>

        {/* ══════════ CENTER — DASHBOARD ══════════ */}
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Large performance graph */}
          <section className="mb-8">
            <ModuleHead label={t("perf")} id="PRF-2609" right={`${fmt(growthCount)}%`} />
            <PerformanceGraph series={chartData} run={inView} />
          </section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <section>
              <ModuleHead label={t("growth2")} id="MO-7" right="AVG" />
              <MonthlyBars data={monthly} run={inView} />
            </section>
            <section>
              <ModuleHead label={t("index")} id="IDX-4" right="CORE" />
              <IndexGauge value={completionCount} run={inView} />
            </section>
            <section className="sm:col-span-2">
              <ModuleHead label={t("timeline")} id="TL-26" right="OPEN YEAR 2026" />
              <Timeline rows={[...snapshot("digital", CURRENT_MONTH), ...snapshot("physical", CURRENT_MONTH)]} run={inView} />
            </section>
          </div>
        </motion.div>

        {/* ══════════ RIGHT — COMMAND PANEL ══════════ */}
        <motion.aside
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="border border-white/[0.06]" style={{ background: "#07080a" }}>
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
              <span className="text-[0.52rem] tracking-[0.26em] text-[#8b95a5]" style={{ fontFamily: MONO }}>{t("sysStatus")}</span>
              <span className="flex items-center gap-1.5 text-[0.5rem] text-[#6d7685]" style={{ fontFamily: MONO }}>
                <i className="block h-1 w-1 rounded-full bg-[#c3cdd9]" style={{ boxShadow: "0 0 6px #c3cdd9" }} />
                ONLINE
              </span>
            </div>
            <CommandRow label={t("pIndex")} value="128.4" sub="+3.2%" />
            <CommandRow label={t("netStatus")} value="SECURE" sub="TLS·AES" />
            <CommandRow label={t("memberAccess")} value={fmt(agg.members)} sub="VERIFIED" />
            <CommandRow label={t("activeSession")} value="OPS-01" sub="AUTH" />
            <CommandRow label={t("currentYear")} value="2026" sub="OPEN" />
            <div className="border-t border-white/[0.05] px-4 py-3 text-[0.48rem] leading-relaxed tracking-[0.08em] text-[#4a515e]" style={{ fontFamily: MONO }}>
              <div>HOST 46.19.7.88</div>
              <div>NODE 09 / SECTOR G</div>
              <div>SIG 0x2A4F·C9D1·88</div>
            </div>
          </div>

          {/* Scattered live metrics */}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <LiveMetric label={`${fmt(growthCount)}%`} sub={t("perf")} />
            <LiveMetric label={fmt(activeCount)} sub={t("active")} />
            <LiveMetric label="3" sub={t("departments")} />
            <LiveMetric label={fmt(membersCount)} sub={t("members")} />
            <LiveMetric label="21" sub={t("reviews")} />
            <LiveMetric label={`${fmt(completionCount)}%`} sub={t("completion")} />
          </div>

          <div className="mt-6 text-[0.46rem] leading-relaxed tracking-[0.06em] text-[#3f4752]" style={{ fontFamily: MONO }}>
            <div className="flex justify-between"><span>GRID 41.0082°N</span><span>19.0°E</span></div>
            <div className="flex justify-between"><span>VER 2.6.0</span><span>BUILD 8841</span></div>
          </div>
        </motion.aside>
      </div>

      {/* Bottom data strip */}
      <motion.div
        className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-white/[0.05] pt-3 text-[0.46rem] tracking-[0.12em] text-[#3f4752]"
        style={{ fontFamily: MONO }}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <span>OOI / PROJECTS / OPS-1 / CLEARANCE T1</span>
        <span>SESSION {new Date().toISOString().slice(0, 10)}</span>
        <span>SYNC 100% · LEDGER CONSISTENT</span>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function Row({ label, value, live, up }: { label: string; value: string; live: string; up?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.04] py-2.5">
      <div>
        <span className="block text-[0.58rem] tracking-[0.12em] text-[#6d7685]" style={{ fontFamily: MONO }}>{label}</span>
        <span className="mt-0.5 block text-[0.45rem] tracking-[0.1em] text-[#454d5a]" style={{ fontFamily: MONO }}>{live}</span>
      </div>
      <span className="text-[0.9rem] text-[#e2e8f0]" style={{ fontFamily: MONO }}>{value}{up && <i className="ms-1 inline-block text-[0.55rem] not-italic text-[#9aa5b3]">▲</i>}</span>
    </div>
  );
}

function EntryButton({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between border border-white/[0.07] px-4 py-3 text-start transition-colors duration-300 hover:border-white/20"
      style={{ background: "#08090c" }}
    >
      <span>
        <span className="block text-[0.72rem] tracking-[0.14em] text-[#cdd5e0]" style={{ fontFamily: LUX }}>{label}</span>
        <span className="block text-[0.45rem] tracking-[0.12em] text-[#4a515e]" style={{ fontFamily: MONO }}>{sub}</span>
      </span>
      <span className="text-[#5d6675] transition-transform duration-300 group-hover:translate-x-0.5">→</span>
    </button>
  );
}

function ModuleHead({ label, id, right }: { label: string; id: string; right?: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="text-[0.55rem] tracking-[0.22em] text-[#7b8494]" style={{ fontFamily: MONO }}>{label}</span>
      <span className="flex items-center gap-3 text-[0.44rem] tracking-[0.1em] text-[#454d5a]" style={{ fontFamily: MONO }}>
        <span>{id}</span>
        {right && <span className="text-[#6d7685]">{right}</span>}
      </span>
    </div>
  );
}

/* Large self-drawing performance graph with axes, grid, data points,
   hover tooltip, and high/low markers. */
function PerformanceGraph({ series, run }: { series: Point[]; run: boolean }) {
  const W = 640, H = 230, PL = 30, PR = 12, PT = 18, PB = 26;
  const pathRef = useRef<SVGPathElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    if (!series.length) return null;
    const vs = series.map((p) => p.v);
    let lo = Math.min(...vs), hi = Math.max(...vs);
    const pad = (hi - lo) * 0.16 || 1;
    lo -= pad; hi += pad;
    const w = W - PL - PR, h = H - PT - PB;
    const pts = series.map((p, i) => {
      const x = PL + (i / (series.length - 1)) * w;
      const y = PT + (1 - (p.v - lo) / (hi - lo)) * h;
      return [x, y];
    });
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const mx = (x0 + x1) / 2;
      d += ` C ${mx.toFixed(1)} ${y0.toFixed(1)}, ${mx.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    // nearest index for high/low markers
    let hiI = 0, loI = 0;
    vs.forEach((v, i) => { if (v > vs[hiI]) hiI = i; if (v < vs[loI]) loI = i; });
    return { d, pts, lo, hi, hiI, loI, vs };
  }, [series]);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      pathRef.current.style.strokeDasharray = `${len}`;
      pathRef.current.style.strokeDashoffset = `${len}`;
    }
  }, [geo]);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const draw = run && inView;

  const last = series.length ? series[series.length - 1].v : 0;
  const first = series.length ? series[0].v : 0;
  const pct = first ? ((last - first) / first) * 100 : 0;
  const hiP = geo && series[geo.hiI] ? series[geo.hiI].v : 0;
  const loP = geo && series[geo.loI] ? series[geo.loI].v : 0;

  const onMove = (e: React.MouseEvent) => {
    if (!geo || !series.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (series.length - 1));
    setHover(idx);
  };

  const hoverPt = hover !== null && geo ? geo.pts[hover] : null;

  return (
    <div ref={ref} className="relative overflow-hidden border border-white/[0.06]" style={{ background: "#07080a" }}>
      {/* faint horizontal gridlines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <span key={f} className="pointer-events-none absolute inset-x-0 h-px"
          style={{ top: `${PT + f * (H - PT - PB)}px`, background: "rgba(255,255,255,0.05)" }} />
      ))}
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" preserveAspectRatio="none" aria-hidden="true"
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="pgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dfe8f2" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#dfe8f2" stopOpacity="0" />
          </linearGradient>
        </defs>
        {geo && (
          <>
            {/* axis lines */}
            <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <path d={`${geo.d} L ${geo.pts[geo.pts.length - 1][0].toFixed(1)} ${H - PB} L ${geo.pts[0][0].toFixed(1)} ${H - PB} Z`} fill="url(#pgrad)" opacity="0.5" />
            <path ref={pathRef} d={geo.d} fill="none" stroke="#dfe8f2" strokeWidth="1.4" strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-[2200ms] ease-out"
              style={{ strokeDashoffset: draw ? "0" : undefined, transitionDuration: draw ? "2200ms" : "0ms" }} />
            {/* data points */}
            {geo.pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={hover === i ? 3.4 : 2}
                fill={hover === i ? "#ffffff" : "#dfe8f2"}
                opacity={draw ? 1 : 0} style={{ transition: "r 0.2s, fill 0.2s" }} />
            ))}
            {/* high marker */}
            <circle cx={geo.pts[geo.hiI][0]} cy={geo.pts[geo.hiI][1]} r="4" fill="none" stroke="#9aa5b3" strokeWidth="1" opacity="0.8" />
            <text x={geo.pts[geo.hiI][0] + 6} y={geo.pts[geo.hiI][1] - 4} fill="#9aa5b3" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>▲ {fmt(hiP)}%</text>
            {/* low marker */}
            <circle cx={geo.pts[geo.loI][0]} cy={geo.pts[geo.loI][1]} r="4" fill="none" stroke="#7f8896" strokeWidth="1" opacity="0.8" />
            <text x={geo.pts[geo.loI][0] + 6} y={geo.pts[geo.loI][1] + 12} fill="#7f8896" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>▼ {fmt(loP)}%</text>
            {/* x labels (month-ish ticks) */}
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <text key={i} x={PL + f * (W - PL - PR)} y={H - 8} textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"}
                fill="rgba(150,160,175,0.5)" fontSize="7.5" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(f * 12)}m</text>
            ))}
            {/* y labels */}
            {[0, 0.5, 1].map((f, i) => (
              <text key={i} x={PL - 6} y={PT + f * (H - PT - PB) + 3} textAnchor="end" fill="rgba(150,160,175,0.45)" fontSize="7.5" style={{ fontFamily: "var(--font-mono)" }}>
                {Math.round(geo.lo + f * (geo.hi - geo.lo))}%
              </text>
            ))}
          </>
        )}
      </svg>

      {/* hover tooltip */}
      {hoverPt && hover !== null && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded border border-white/15 bg-[#0a0c10] px-2.5 py-1.5 text-[0.6rem] text-[#eaeef5] shadow-xl" style={{ fontFamily: "var(--font-mono)", left: hoverPt[0], top: hoverPt[1] - 34 }}>
          {series[hover] ? series[hover].v.toFixed(1) : "0"}%
        </div>
      )}

      {/* footer summary */}
      <div className="pointer-events-none absolute bottom-1 right-3 flex items-center gap-3 text-[0.5rem] tracking-[0.12em] text-[#6d7685]" style={{ fontFamily: MONO }}>
        <span>YTD {fmt(last)}%</span>
        <span className={pct >= 0 ? "text-[#7a9a7a]" : "text-[#9a6a6a]"}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

/* Monthly growth bars. */
function MonthlyBars({ data, run }: { data: { m: string; avg: number }[]; run: boolean }) {
  const max = Math.max(...data.map((d) => d.avg), 1);
  return (
    <div className="flex h-[120px] items-end gap-1.5 border-b border-white/[0.06] px-1 pb-5" style={{ background: "#07080a" }}>
      {data.map((d, i) => (
        <div key={d.m} className="flex flex-1 flex-col items-center gap-1">
          <motion.div
            className="w-full bg-gradient-to-t from-[#2a3038] to-[#8b95a5]/70"
            initial={{ height: 0 }}
            animate={run ? { height: `${(d.avg / max) * 100}%` } : {}}
            transition={{ duration: 0.9, delay: 0.25 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      ))}
    </div>
  );
}

/* Internal index gauge. */
function IndexGauge({ value, run }: { value: number; run: boolean }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4 p-3" style={{ background: "#07080a" }}>
      <div className="relative h-[92px] w-[92px] shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
          <motion.circle
            cx="50" cy="50" r={r} fill="none" stroke="#dfe8f2" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={run ? { strokeDashoffset: c - (c * Math.min(value, 100)) / 100 } : {}}
            transition={{ duration: 1.6, ease: "easeOut" }}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[1.15rem] text-[#eef2f7]" style={{ fontFamily: MONO }}>{Math.round(value)}<span className="text-[0.6rem] text-[#7b8494]">%</span></span>
        </div>
      </div>
      <div>
        <div className="text-[0.5rem] tracking-[0.14em] text-[#4a515e]" style={{ fontFamily: MONO }}>CORE INDEX / 0–100</div>
        <div className="mt-1.5 space-y-1 text-[0.5rem] text-[#565d68]" style={{ fontFamily: MONO }}>
          <div className="flex justify-between gap-3"><span>TARGET</span><span className="text-[#8b95a5]">100</span></div>
          <div className="flex justify-between gap-3"><span>CURRENT</span><span className="text-[#eef2f7]">{Math.round(value)}</span></div>
        </div>
      </div>
    </div>
  );
}

/* Timeline rows from the current snapshot. */
function Timeline({ rows, run }: { rows: { nameEn: string; categoryEn: string; completion: number; status: string }[]; run: boolean }) {
  return (
    <div className="space-y-1.5 p-3" style={{ background: "#07080a" }}>
      {rows.map((r, i) => (
        <div key={r.nameEn} className="flex items-center gap-3">
          <span className="w-6 shrink-0 text-[0.44rem] tracking-widest text-[#4a515e]" style={{ fontFamily: MONO }}>{String(i + 1).padStart(2, "0")}</span>
          <span className="w-1 h-1 shrink-0 rounded-full bg-[#9aa5b3]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[0.62rem] tracking-[0.08em] text-[#cfd7e1]" style={{ fontFamily: MONO }}>{r.nameEn}</span>
              <span className="shrink-0 text-[0.5rem] text-[#6d7685]" style={{ fontFamily: MONO }}>{r.completion}%</span>
            </div>
            <div className="mt-1 h-px w-full bg-white/[0.05]">
              <motion.div
                className="h-px bg-[#dfe8f2]/70"
                initial={{ width: 0 }}
                animate={run ? { width: `${r.completion}%` } : {}}
                transition={{ duration: 1.1, delay: 0.2 + i * 0.06, ease: "easeOut" }}
              />
            </div>
          </div>
          <span className="w-12 shrink-0 text-end text-[0.44rem] tracking-widest text-[#454d5a]" style={{ fontFamily: MONO }}>
            {r.status === "COMPLETED" ? "✓ DONE" : "· ACTIVE"}
          </span>
        </div>
      ))}
    </div>
  );
}

function LiveMetric({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="border border-white/[0.06] px-3 py-2.5" style={{ background: "#07080a" }}>
      <div className="text-[1rem] text-[#eef2f7]" style={{ fontFamily: MONO }}>{label}</div>
      <div className="mt-0.5 text-[0.44rem] tracking-[0.1em] text-[#5d6675]" style={{ fontFamily: MONO }}>{sub}</div>
    </div>
  );
}

function CommandRow({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2.5">
      <span className="text-[0.5rem] tracking-[0.12em] text-[#5d6675]" style={{ fontFamily: MONO }}>{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-[0.6rem] text-[#cdd5e0]" style={{ fontFamily: MONO }}>{value}</span>
        <span className="text-[0.42rem] tracking-widest text-[#454d5a]" style={{ fontFamily: MONO }}>{sub}</span>
      </span>
    </div>
  );
}
