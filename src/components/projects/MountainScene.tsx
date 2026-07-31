"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import WireTerrain, { type Summit } from "./WireTerrain";
import type { ProjectTrack } from "@/lib/projects-data";

export type TrackChoice = ProjectTrack | "all" | "request";

interface Peak {
  key: TrackChoice;
  labelAr: string;
  labelEn: string;
  minRank: number;
  summit: Summit;
  /** قمة لم تكتمل */
  unfinished?: boolean;
  /** حجم التسمية */
  major?: boolean;
}

const PEAKS: Peak[] = [
  {
    key: "private",
    labelAr: "مشاريع خاصة",
    labelEn: "Private Ventures",
    minRank: 5,
    major: true,
    summit: { wx: -0.02, wz: 0.86, height: 0.62, spread: 0.34 },
  },
  {
    key: "ground",
    labelAr: "مشاريع على أرض الواقع",
    labelEn: "Ground Operations",
    minRank: 1,
    summit: { wx: -0.62, wz: 0.72, height: 0.44, spread: 0.3 },
  },
  {
    key: "online",
    labelAr: "مشاريع على الإنترنت",
    labelEn: "Digital Ventures",
    minRank: 1,
    summit: { wx: 0.58, wz: 0.68, height: 0.4, spread: 0.29 },
  },
  {
    key: "request",
    labelAr: "طلب إنشاء مشروعك الخاص",
    labelEn: "Request Your Own Venture",
    minRank: 1,
    unfinished: true,
    summit: { wx: -0.42, wz: 0.3, height: 0.3, spread: 0.24 },
  },
  {
    key: "all",
    labelAr: "الكل",
    labelEn: "All Tracks",
    minRank: 1,
    summit: { wx: 0.4, wz: 0.27, height: 0.28, spread: 0.23 },
  },
];

const SUMMITS = PEAKS.map((p) => p.summit);

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
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const [box, setBox] = useState({ w: 1, h: 1 });

  const selIdx = PEAKS.findIndex((p) => p.key === selected);
  const hovIdx = PEAKS.findIndex((p) => p.key === hover);

  return (
    <div className="relative w-full" dir={isAr ? "rtl" : "ltr"}>
      {/* العنوان */}
      <div className="mb-7 text-center">
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
      <div
        className="relative overflow-hidden rounded-3xl border border-[#c3c9d3]/10 bg-black"
        ref={(el) => {
          if (el) {
            const r = el.getBoundingClientRect();
            if (Math.abs(r.width - box.w) > 2 || Math.abs(r.height - box.h) > 2)
              setBox({ w: r.width, h: r.height });
          }
        }}
      >
        {/* توهج علوي خافت */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at 50% 78%, rgba(180,200,235,0.09), transparent 65%)",
          }}
        />

        <WireTerrain
          summits={SUMMITS}
          activeIndex={selIdx >= 0 ? selIdx : null}
          hoverIndex={hovIdx >= 0 ? hovIdx : null}
          onProject={setPts}
          className="relative z-[2] block h-[clamp(340px,54vw,560px)] w-full"
        />

        {/* تلاشي الحواف */}
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            background:
              "linear-gradient(to right, #000 0%, transparent 9%, transparent 91%, #000 100%), linear-gradient(to bottom, #000 0%, transparent 14%, transparent 88%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* التسميات فوق القمم */}
        <div className="absolute inset-0 z-[4]">
          {PEAKS.map((p, i) => {
            const locked = rankOrd < p.minRank;
            const isSel = selected === p.key;
            const isHov = hover === p.key;
            const active = isSel || isHov;
            const pt = pts[i];
            if (!pt) return null;

            return (
              <motion.button
                key={p.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.55 }}
                onMouseEnter={() => setHover(p.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.key)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect(p.key)}
                className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg px-3 pb-4 pt-1 text-center outline-none"
                style={{
                  left: pt.x,
                  top: pt.y,
                  background: p.major
                    ? "none"
                    : "radial-gradient(ellipse 62% 58% at 50% 42%, rgba(0,0,0,0.88), rgba(0,0,0,0) 72%)",
                }}
              >
                <span
                  className={[
                    "block transition-all duration-300",
                    p.major
                      ? "text-[clamp(0.9rem,2.2vw,1.4rem)] font-semibold"
                      : "text-[clamp(0.64rem,1.4vw,0.9rem)] font-medium",
                    isSel
                      ? "text-white"
                      : active
                      ? "text-[#f2f6ff]"
                      : p.major
                      ? "text-[#e4eaf4]"
                      : "text-[#9aa5b5]",
                  ].join(" ")}
                  style={{
                    fontFamily: p.major ? "var(--font-luxury)" : "inherit",
                    letterSpacing: p.major ? "0.05em" : "0.02em",
                    textShadow: isSel
                      ? "0 2px 20px rgba(0,0,0,1), 0 0 40px rgba(220,235,255,0.75)"
                      : p.major
                      ? "0 2px 22px rgba(0,0,0,1), 0 0 32px rgba(210,228,255,0.32)"
                      : "0 2px 16px rgba(0,0,0,1)",
                  }}
                >
                  {isAr ? p.labelAr : p.labelEn}
                </span>

                {p.unfinished && (
                  <span className="mx-auto mt-1 block h-px w-14 bg-[repeating-linear-gradient(90deg,rgba(230,240,255,0.55)_0_5px,transparent_5px_10px)]" />
                )}

                {locked && (
                  <span className="mono mt-1 inline-flex items-center gap-1 text-[0.5rem] uppercase tracking-[0.16em] text-[#8a7a58]">
                    <Lock size={8} />
                    {isAr ? `رتبة ${p.minRank}+` : `TIER ${p.minRank}+`}
                  </span>
                )}

                {isSel && (
                  <motion.span
                    layoutId="peak-underline"
                    className="mx-auto mt-1.5 block h-px w-12 bg-gradient-to-r from-transparent via-white to-transparent"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* زر الدخول */}
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
