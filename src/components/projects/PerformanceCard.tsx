"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  buildSeries,
  sliceRange,
  smoothPath,
  RANGES,
  TARGET,
  type Point,
  type RangeKey,
} from "@/lib/performance-series";

/* ------------------------------------------------------------------ */
/*  عدّاد تصاعدي راقٍ                                                  */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, run: boolean, ms = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      // تباطؤ ناعم في النهاية
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return n;
}

/* ------------------------------------------------------------------ */
/*  علامة النادي المائية                                               */
/* ------------------------------------------------------------------ */

function ClubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect
        x="9"
        y="9"
        width="30"
        height="30"
        transform="rotate(45 24 24)"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth="0.7" opacity="0.55" />
      <path
        d="M14 30 L24 20 L34 30"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 35 L24 25 L34 35"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <circle cx="24" cy="14" r="1.9" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  البطاقة                                                            */
/* ------------------------------------------------------------------ */

/* هندسة الرسم داخل مساحة الإحداثيات */
const VB_W = 560;
const VB_H = 220;
const PAD_L = 6;
const PAD_R = 6;
const PAD_T = 18;
const PAD_B = 26;

export default function PerformanceCard() {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(hostRef, { once: true, amount: 0.35 });

  const [range, setRange] = useState<RangeKey>("1Y");
  const [hover, setHover] = useState<number | null>(null);

  /* تاريخ ثابت يُحسب مرة واحدة على العميل، فلا يختلف عن الخادم */
  const [endDate, setEndDate] = useState<Date | null>(null);
  useEffect(() => setEndDate(new Date()), []);

  const full = useMemo(() => (endDate ? buildSeries(endDate) : []), [endDate]);
  const data: Point[] = useMemo(
    () => (full.length ? sliceRange(full, range) : []),
    [full, range]
  );

  /* تحويل القيم إلى إحداثيات */
  const geo = useMemo(() => {
    if (!data.length) return null;
    const vs = data.map((p) => p.v);
    let lo = Math.min(...vs);
    let hi = Math.max(...vs);
    const pad = (hi - lo) * 0.16 || 1;
    lo -= pad;
    hi += pad;

    const w = VB_W - PAD_L - PAD_R;
    const h = VB_H - PAD_T - PAD_B;
    const xs = (i: number) => PAD_L + (i / (data.length - 1)) * w;
    const ys = (v: number) => PAD_T + (1 - (v - lo) / (hi - lo)) * h;

    const pts = data.map((p, i) => ({ x: xs(i), y: ys(p.v) }));
    return { pts, lo, hi, xs, ys, zeroY: ys(0) };
  }, [data]);

  const line = useMemo(() => (geo ? smoothPath(geo.pts) : ""), [geo]);
  const area = useMemo(() => {
    if (!geo || !line) return "";
    const last = geo.pts[geo.pts.length - 1];
    const first = geo.pts[0];
    return `${line} L ${last.x.toFixed(2)} ${VB_H - PAD_B} L ${first.x.toFixed(2)} ${VB_H - PAD_B} Z`;
  }, [geo, line]);

  const finalValue = data.length ? data[data.length - 1].v : 0;
  const shown = useCountUp(finalValue, inView && !!data.length);
  const display = hover !== null && data[hover] ? data[hover].v : shown;
  const positive = display >= 0;

  /* تتبّع المؤشر */
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || !data.length) return;
    const r = svgRef.current.getBoundingClientRect();
    const rel = (e.clientX - r.left) / r.width;
    const i = Math.round(rel * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const hp = hover !== null && geo ? geo.pts[hover] : null;
  const hd = hover !== null ? data[hover] : null;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  /* علامات المحور الزمني */
  const ticks = useMemo(() => {
    if (!data.length || !geo) return [];
    const n = Math.min(5, data.length);
    return Array.from({ length: n }, (_, k) => {
      const i = Math.round((k / (n - 1)) * (data.length - 1));
      return {
        x: geo.xs(i),
        label: data[i].date.toLocaleDateString("en-GB", {
          month: "short",
          ...(range === "1M" ? { day: "2-digit" } : {}),
        }),
      };
    });
  }, [data, geo, range]);

  return (
    <motion.article
      ref={hostRef}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      dir="ltr"
      className="relative overflow-hidden rounded-2xl border border-white/[0.09] p-5 backdrop-blur-xl sm:p-6"
      style={{
        background:
          "linear-gradient(158deg, rgba(18,22,31,0.92) 0%, rgba(11,14,20,0.95) 46%, rgba(8,10,15,0.97) 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.07), 0 24px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* زخرفة الزوايا — من هوية النادي */}
      <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-white/20" />
      <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-white/20" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/12" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/12" />

      {/* علامة مائية خافتة جداً */}
      <ClubMark className="pointer-events-none absolute right-4 top-4 h-16 w-16 text-white/[0.035]" />

      {/* ===== الرأس ===== */}
      <header className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ClubMark className="h-3.5 w-3.5 shrink-0 text-white/45" />
            <h3
              className="truncate text-[0.6rem] uppercase tracking-[0.3em] text-[#98a3b4]"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              Project Performance
            </h3>
          </div>

          <div className="mt-3 flex items-baseline gap-2.5">
            <span
              className="tabular-nums text-[clamp(1.5rem,3.2vw,2.05rem)] font-light leading-none"
              style={{
                fontFamily: "var(--font-luxury)",
                color: positive ? "#cfe3d2" : "#e3cfcf",
                textShadow: positive
                  ? "0 0 18px rgba(190,225,198,0.22), 0 0 44px rgba(255,255,255,0.07)"
                  : "0 0 18px rgba(225,190,190,0.22)",
              }}
            >
              {positive ? "+" : "−"}
              {Math.abs(display).toFixed(2)}%
            </span>
            <span
              className="text-[0.54rem] uppercase tracking-[0.26em] text-[#6d7686]"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {hover !== null && hd ? fmtDate(hd.date) : "This Year"}
            </span>
          </div>
        </div>

        {/* شارة الحالة */}
        <div className="shrink-0 rounded-full border border-white/[0.10] bg-white/[0.03] px-2.5 py-1">
          <span
            className="text-[0.5rem] uppercase tracking-[0.2em] text-[#8fa596]"
            style={{ fontFamily: "var(--font-ibm-mono)" }}
          >
            ▲ Active
          </span>
        </div>
      </header>

      {/* ===== الرسم ===== */}
      <div className="relative mt-5">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          className="block h-[clamp(140px,20vw,190px)] w-full touch-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(178,214,188,0.20)" />
              <stop offset="55%" stopColor="rgba(150,190,162,0.06)" />
              <stop offset="100%" stopColor="rgba(150,190,162,0)" />
            </linearGradient>
            <linearGradient id="pc-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(226,235,246,0.55)" />
              <stop offset="62%" stopColor="rgba(238,245,252,0.9)" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <filter id="pc-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* شبكة أفقية رفيعة */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = PAD_T + f * (VB_H - PAD_T - PAD_B);
            return (
              <line
                key={f}
                x1={PAD_L}
                y1={y}
                x2={VB_W - PAD_R}
                y2={y}
                stroke="rgba(255,255,255,0.045)"
                strokeWidth="0.6"
              />
            );
          })}

          {/* خط الصفر */}
          {geo && geo.zeroY > PAD_T && geo.zeroY < VB_H - PAD_B && (
            <line
              x1={PAD_L}
              y1={geo.zeroY}
              x2={VB_W - PAD_R}
              y2={geo.zeroY}
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="0.7"
              strokeDasharray="3 4"
            />
          )}

          {/* التعبئة */}
          {area && (
            <motion.path
              key={`a-${range}`}
              d={area}
              fill="url(#pc-fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: inView ? 1 : 0 }}
              transition={{ duration: 1.2, delay: 0.5 }}
            />
          )}

          {/* الخط — يُرسم من اليسار لليمين */}
          {line && (
            <motion.path
              key={`l-${range}`}
              d={line}
              fill="none"
              stroke="url(#pc-line)"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#pc-glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: inView ? 1 : 0 }}
              transition={{ duration: 1.9, ease: [0.32, 0.9, 0.3, 1] }}
            />
          )}

          {/* نقاط متفرقة على المسار */}
          {geo &&
            geo.pts
              .filter((_, i) => i % Math.ceil(geo.pts.length / 14) === 0)
              .map((p, i) => (
                <motion.circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="1.1"
                  fill="rgba(255,255,255,0.42)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inView ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: 1.1 + i * 0.03 }}
                />
              ))}

          {/* النقطة الأخيرة النابضة */}
          {geo && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: inView ? 1 : 0 }}
              transition={{ delay: 1.85, duration: 0.5 }}
            >
              <circle
                cx={geo.pts[geo.pts.length - 1].x}
                cy={geo.pts[geo.pts.length - 1].y}
                r="4.6"
                fill="rgba(255,255,255,0.13)"
              />
              <circle
                cx={geo.pts[geo.pts.length - 1].x}
                cy={geo.pts[geo.pts.length - 1].y}
                r="2.1"
                fill="#ffffff"
              />
            </motion.g>
          )}

          {/* التقاطع عند التحويم */}
          {hp && (
            <g>
              <line
                x1={hp.x}
                y1={PAD_T - 6}
                x2={hp.x}
                y2={VB_H - PAD_B}
                stroke="rgba(255,255,255,0.34)"
                strokeWidth="0.7"
              />
              <circle cx={hp.x} cy={hp.y} r="5.2" fill="rgba(255,255,255,0.12)" />
              <circle
                cx={hp.x}
                cy={hp.y}
                r="2.6"
                fill="#ffffff"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="0.6"
              />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hp && hd && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-white/[0.12] px-2.5 py-1.5 backdrop-blur-md"
            style={{
              left: `${(hp.x / VB_W) * 100}%`,
              top: `${(hp.y / VB_H) * 100}%`,
              marginTop: -10,
              background: "rgba(10,13,19,0.93)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.6)",
            }}
          >
            <div
              className="whitespace-nowrap text-[0.5rem] uppercase tracking-[0.16em] text-[#7c8698]"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {fmtDate(hd.date)}
            </div>
            <div
              className="mt-0.5 whitespace-nowrap tabular-nums text-[0.72rem] text-white"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {hd.v >= 0 ? "+" : "−"}
              {Math.abs(hd.v).toFixed(2)}%
            </div>
          </div>
        )}

        {/* علامات المحور الزمني */}
        <div className="mt-1 flex justify-between px-1">
          {ticks.map((t, i) => (
            <span
              key={i}
              className="text-[0.46rem] uppercase tracking-[0.14em] text-[#5c6473]"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* ===== المدى الزمني ===== */}
      <div className="relative mt-4 flex items-center gap-1 border-t border-white/[0.06] pt-3">
        {RANGES.map((r) => {
          const on = r === range;
          return (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r);
                setHover(null);
              }}
              className={[
                "rounded-md px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.16em] transition-all duration-300",
                on
                  ? "bg-white/[0.09] text-white"
                  : "text-[#69717f] hover:bg-white/[0.04] hover:text-[#c3ccd9]",
              ].join(" ")}
              style={{
                fontFamily: "var(--font-ibm-mono)",
                boxShadow: on ? "inset 0 0 0 1px rgba(255,255,255,0.14)" : undefined,
                textShadow: on ? "0 0 10px rgba(255,255,255,0.4)" : undefined,
              }}
            >
              {r}
            </button>
          );
        })}

        <span
          className="ms-auto text-[0.46rem] uppercase tracking-[0.18em] text-[#4f5766]"
          style={{ fontFamily: "var(--font-ibm-mono)" }}
        >
          IMPACT · INDEX
        </span>
      </div>
    </motion.article>
  );
}

export { TARGET };
