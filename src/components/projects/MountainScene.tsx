"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { ProjectTrack } from "@/lib/projects-data";

export type TrackChoice = ProjectTrack | "all" | "request";

interface Peak {
  key: TrackChoice;
  /** موضع القمة أفقيًا % */
  x: number;
  /** ارتفاع القمة % من أسفل المشهد */
  h: number;
  labelAr: string;
  labelEn: string;
  minRank: number;
  /** قمة غير مكتملة (مقطوعة الرأس) */
  unfinished?: boolean;
}

const PEAKS: Peak[] = [
  { key: "private", x: 50, h: 88, labelAr: "مشاريع خاصة", labelEn: "Private Ventures", minRank: 5 },
  { key: "ground", x: 24, h: 60, labelAr: "مشاريع على أرض الواقع", labelEn: "Ground Operations", minRank: 1 },
  { key: "online", x: 76, h: 55, labelAr: "مشاريع على الإنترنت", labelEn: "Digital Ventures", minRank: 1 },
  { key: "request", x: 38, h: 34, labelAr: "طلب إنشاء مشروعك الخاص", labelEn: "Request Your Own Venture", minRank: 1, unfinished: true },
  { key: "all", x: 62, h: 30, labelAr: "الكل", labelEn: "All Tracks", minRank: 1 },
];

/** يبني مسار جبل مثلثي بقاعدة عريضة */
function peakPath(cx: number, topY: number, halfW: number, baseY: number, jag = 0) {
  // jag: انكسار بسيط على الحافة لإحساس صخري
  const lx = cx - halfW;
  const rx = cx + halfW;
  if (!jag) return `M ${lx} ${baseY} L ${cx} ${topY} L ${rx} ${baseY} Z`;
  const m1x = cx - halfW * 0.42;
  const m1y = topY + (baseY - topY) * 0.34 + jag;
  const m2x = cx + halfW * 0.5;
  const m2y = topY + (baseY - topY) * 0.28 - jag * 0.6;
  return `M ${lx} ${baseY} L ${m1x} ${m1y} L ${cx} ${topY} L ${m2x} ${m2y} L ${rx} ${baseY} Z`;
}

/** قمة مقطوعة (غير مكتملة) */
function truncatedPath(cx: number, topY: number, halfW: number, baseY: number) {
  const lx = cx - halfW;
  const rx = cx + halfW;
  const tl = cx - halfW * 0.26;
  const tr = cx + halfW * 0.26;
  return `M ${lx} ${baseY} L ${tl} ${topY} L ${tr} ${topY} L ${rx} ${baseY} Z`;
}

export default function MountainScene({
  isAr,
  rankOrd,
  selected,
  onSelect,
  onEnter,
}: {
  isAr: boolean;
  rankOrd: number;
  selected: TrackChoice | null;
  onSelect: (k: TrackChoice) => void;
  onEnter: () => void;
}) {
  const [hover, setHover] = useState<TrackChoice | null>(null);

  const VB_W = 1000;
  const VB_H = 560;
  const BASE = 500; // خط الأرض داخل الـ viewBox

  return (
    <div className="relative w-full" dir={isAr ? "rtl" : "ltr"}>
      {/* عنوان القسم */}
      <div className="mb-8 text-center">
        <p className="mono text-[0.58rem] uppercase tracking-[0.4em] text-[#4d545f]">
          {isAr ? "بوابة المشاريع" : "Venture Gateway"}
        </p>
        <h2
          className="mt-3 text-3xl font-light text-[#eaeef5] sm:text-4xl"
          style={{ fontFamily: "var(--font-luxury)" }}
        >
          {isAr ? "اختر مسارك" : "Choose Your Ascent"}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[0.82rem] leading-relaxed text-[#7f8896]">
          {isAr
            ? "كل قمة تفتح طبقة مختلفة من النادي. اختر قمة ثم ادخل."
            : "Each summit opens a different stratum of the circle. Select a peak, then enter."}
        </p>
      </div>

      {/* المشهد */}
      <div className="relative overflow-hidden rounded-3xl border border-[#c3c9d3]/10 bg-[#020204]">
        {/* سماء متدرجة + نجوم */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% 92%, rgba(195,201,211,0.10), transparent 62%), linear-gradient(to bottom, #05070c 0%, #04060a 45%, #020204 100%)",
          }}
        />
        <Stars />

        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="relative block h-[clamp(320px,52vw,540px)] w-full"
          preserveAspectRatio="xMidYMax meet"
        >
          <defs>
            {/* تدرّج الجبال البعيدة */}
            <linearGradient id="mtFar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#171d28" />
              <stop offset="100%" stopColor="#080b11" />
            </linearGradient>
            {/* تدرّج الجبال النشطة */}
            <linearGradient id="mtMain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b3340" />
              <stop offset="55%" stopColor="#141a24" />
              <stop offset="100%" stopColor="#070a0f" />
            </linearGradient>
            <linearGradient id="mtHot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a5464" />
              <stop offset="50%" stopColor="#222a37" />
              <stop offset="100%" stopColor="#090c12" />
            </linearGradient>
            {/* توهج القمة */}
            <radialGradient id="peakGlow">
              <stop offset="0%" stopColor="rgba(195,201,211,0.55)" />
              <stop offset="100%" stopColor="rgba(195,201,211,0)" />
            </radialGradient>
            <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>

          {/* طبقة جبال خلفية للعمق */}
          <g opacity="0.55">
            <path d={peakPath(120, 300, 190, BASE, 12)} fill="url(#mtFar)" />
            <path d={peakPath(330, 262, 210, BASE, -10)} fill="url(#mtFar)" />
            <path d={peakPath(680, 250, 230, BASE, 14)} fill="url(#mtFar)" />
            <path d={peakPath(900, 292, 200, BASE, -8)} fill="url(#mtFar)" />
          </g>

          {/* ضباب بين الطبقات */}
          <rect x="0" y="380" width={VB_W} height="130" fill="url(#peakGlow)" opacity="0.16" />

          {/* الجبال التفاعلية — من الخلف للأمام */}
          {[...PEAKS]
            .sort((a, b) => b.h - a.h)
            .map((p, idx) => {
              const isSel = selected === p.key;
              const isHov = hover === p.key;
              const active = isSel || isHov;

              const cx = (p.x / 100) * VB_W;
              const topY = BASE - (p.h / 100) * (BASE - 40);
              const halfW = 118 + p.h * 1.5;

              const d = p.unfinished
                ? truncatedPath(cx, topY, halfW, BASE)
                : peakPath(cx, topY, halfW, BASE, idx % 2 === 0 ? 10 : -9);

              return (
                <g
                  key={p.key}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(p.key)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect(p.key)}
                >
                  {/* الجسم */}
                  <motion.path
                    d={d}
                    fill={active ? "url(#mtHot)" : "url(#mtMain)"}
                    stroke={
                      isSel
                        ? "rgba(234,238,245,0.55)"
                        : active
                        ? "rgba(195,201,211,0.3)"
                        : "rgba(195,201,211,0.12)"
                    }
                    strokeWidth={isSel ? 1.6 : 1}
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * idx, duration: 0.75, ease: "easeOut" }}
                    style={{ transition: "fill 0.35s, stroke 0.35s" }}
                  />

                  {/* حافة مضيئة عند التحديد */}
                  {isSel && (
                    <motion.path
                      d={d}
                      fill="none"
                      stroke="rgba(234,238,245,0.7)"
                      strokeWidth="1.2"
                      filter="url(#soft)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.35, 0.8, 0.35] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    />
                  )}

                  {/* خط القمة المكسور للمشروع غير المكتمل */}
                  {p.unfinished && (
                    <line
                      x1={cx - halfW * 0.26}
                      y1={topY}
                      x2={cx + halfW * 0.26}
                      y2={topY}
                      stroke="rgba(234,238,245,0.4)"
                      strokeWidth="1.4"
                      strokeDasharray="7 6"
                    />
                  )}

                  {/* توهج القمة */}
                  <circle
                    cx={cx}
                    cy={topY}
                    r={active ? 34 : 20}
                    fill="url(#peakGlow)"
                    opacity={active ? 0.85 : 0.35}
                    style={{ transition: "all 0.4s" }}
                  />
                  <circle
                    cx={cx}
                    cy={topY}
                    r={isSel ? 4 : 2.6}
                    fill="#eaeef5"
                    opacity={active ? 1 : 0.55}
                    style={{ transition: "all 0.3s" }}
                  />
                </g>
              );
            })}

          {/* خط الأرض */}
          <line
            x1="0"
            y1={BASE}
            x2={VB_W}
            y2={BASE}
            stroke="rgba(195,201,211,0.16)"
            strokeWidth="1"
          />
        </svg>

        {/* ===== التسميات فوق القمم (HTML عشان الخط العربي) ===== */}
        <div className="pointer-events-none absolute inset-0">
          {PEAKS.map((p, idx) => {
            const locked = rankOrd < p.minRank;
            const isSel = selected === p.key;
            const isHov = hover === p.key;
            const active = isSel || isHov;
            const topPct = ((BASE - (p.h / 100) * (BASE - 40)) / VB_H) * 100;

            return (
              <motion.button
                key={p.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + idx * 0.09, duration: 0.6 }}
                onMouseEnter={() => setHover(p.key)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(p.key)}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full whitespace-nowrap px-2 pb-3 text-center"
                style={{ left: `${p.x}%`, top: `${topPct}%` }}
              >
                <span
                  className={[
                    "block transition-all duration-300",
                    p.key === "private"
                      ? "text-[clamp(0.85rem,2.1vw,1.35rem)] font-semibold"
                      : "text-[clamp(0.62rem,1.35vw,0.88rem)] font-medium",
                    isSel
                      ? "text-white drop-shadow-[0_0_16px_rgba(234,238,245,0.7)]"
                      : active
                      ? "text-[#eaeef5]"
                      : p.key === "private"
                      ? "text-[#dfe4ec]"
                      : "text-[#96a0af]",
                  ].join(" ")}
                  style={{
                    fontFamily:
                      p.key === "private" ? "var(--font-luxury)" : "inherit",
                    letterSpacing: p.key === "private" ? "0.05em" : "0.02em",
                    textShadow:
                      p.key === "private"
                        ? "0 2px 22px rgba(0,0,0,0.95), 0 0 34px rgba(234,238,245,0.28)"
                        : "0 2px 14px rgba(0,0,0,0.95)",
                  }}
                >
                  {isAr ? p.labelAr : p.labelEn}
                </span>

                {locked && (
                  <span className="mono mt-1 inline-flex items-center gap-1 text-[0.5rem] uppercase tracking-[0.16em] text-[#7a6a4e]">
                    <Lock size={8} />
                    {isAr ? `رتبة ${p.minRank}+` : `TIER ${p.minRank}+`}
                  </span>
                )}

                {isSel && (
                  <motion.span
                    layoutId="peak-underline"
                    className="mx-auto mt-1.5 block h-px w-10 bg-gradient-to-r from-transparent via-[#eaeef5] to-transparent"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ===== زر الدخول ===== */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="mono text-[0.58rem] uppercase tracking-[0.28em] text-[#4d545f]">
          {selected
            ? isAr
              ? "المسار المحدد"
              : "Selected Track"
            : isAr
            ? "اختر قمة أولًا"
            : "Select a peak first"}
        </p>

        {selected && (
          <motion.p
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg text-[#eaeef5]"
            style={{ fontFamily: "var(--font-luxury)" }}
          >
            {isAr
              ? PEAKS.find((p) => p.key === selected)?.labelAr
              : PEAKS.find((p) => p.key === selected)?.labelEn}
          </motion.p>
        )}

        <button
          disabled={!selected}
          onClick={onEnter}
          className={[
            "mt-1 rounded-xl border px-14 py-4 text-sm font-semibold uppercase tracking-[0.22em] transition-all duration-300",
            selected
              ? "cursor-pointer border-[#c3c9d3]/35 bg-gradient-to-b from-[#2a313d] to-[#0a0d13] text-[#eaeef5] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_34px_rgba(0,0,0,0.65)] hover:border-[#c3c9d3]/60 hover:text-white"
              : "cursor-not-allowed border-white/[0.07] bg-black/30 text-[#3f4550]",
          ].join(" ")}
          style={{ fontFamily: "var(--font-luxury)" }}
        >
          {isAr ? "الدخول" : "Enter"}
        </button>
      </div>
    </div>
  );
}

/** نجوم ثابتة خفيفة */
function Stars() {
  const stars = Array.from({ length: 46 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const r = seed / 233280;
    const r2 = ((i * 4931 + 7919) % 10007) / 10007;
    return {
      left: r * 100,
      top: r2 * 62,
      size: r2 > 0.85 ? 1.6 : 1,
      delay: (i % 7) * 0.45,
    };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-[#c3c9d3]"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
          }}
          animate={{ opacity: [0.08, 0.5, 0.08] }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
