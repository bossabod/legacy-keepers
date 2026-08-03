"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import WireTerrain, { type Anchor, type Projected } from "./WireTerrain";
import type { ProjectTrack } from "@/lib/projects-data";

export type TrackChoice = ProjectTrack | "all" | "request";

interface Site {
  key: TrackChoice;
  labelAr: string;
  labelEn: string;
  minRank: number;
  /** موقع العنوان على الأرض في فضاء العالم */
  x: number;
  z: number;
  major?: boolean;
}

/**
 * المواقع موزّعة على مناطق مختلفة من نفس الأرض.
 * لم يُنشأ أي ارتفاع خصيصاً لأي عنوان — العناوين توضع
 * فوق تضاريس موجودة أصلاً.
 */
const SITES: Site[] = [
  // على الكتلة المرتفعة في الجهة اليسرى
  { key: "private", labelAr: "مشاريع خاصة", labelEn: "Private Ventures", minRank: 5, x: -980, z: 2150, major: true },
  // ارتفاع متوسط يمين الوسط
  { key: "ground", labelAr: "مشاريع على أرض الواقع", labelEn: "Ground Operations", minRank: 1, x: 1150, z: 1750 },
  // ارتفاعات الخلفية البعيدة
  { key: "online", labelAr: "مشاريع على الإنترنت", labelEn: "Digital Ventures", minRank: 1, x: 120, z: 3400 },
  // تموّج قريب في المقدمة اليسرى
  { key: "request", labelAr: "طلب إنشاء مشروعك الخاص", labelEn: "Request Your Own Venture", minRank: 1, x: -760, z: 1050 },
  // تموّج قريب في المقدمة اليمنى
  { key: "all", labelAr: "الكل", labelEn: "All Tracks", minRank: 1, x: 900, z: 1050 },
];

const ANCHORS: Anchor[] = SITES.map((s) => ({ id: s.key, x: s.x, z: s.z }));

/** يمنع خروج العنوان خارج حافتي الشاشة */
function clampX(x: number) {
  if (typeof window === "undefined") return x;
  return Math.min(Math.max(x, 165), window.innerWidth - 165);
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
  const [pts, setPts] = useState<Record<string, Projected>>({});

  return (
    /* يمتد من أقصى اليمين إلى أقصى اليسار وحتى أسفل الشاشة،
       ويلغي حشوة <main> بهوامش سالبة. لا إطار ولا بطاقة. */
    <div
      className="relative left-1/2 right-1/2 -mt-7 -mb-7 h-[calc(100vh-4.2rem)] w-screen -translate-x-1/2 overflow-hidden bg-black"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* التضاريس تملأ كامل المساحة */}
      <WireTerrain
        anchors={ANCHORS}
        activeId={selected}
        hoverId={hover}
        onProject={(list) => {
          const m: Record<string, Projected> = {};
          for (const p of list) m[p.id] = p;
          setPts(m);
        }}
        className="absolute inset-0 block h-full w-full"
      />

      {/* عناوين الأقسام — مثبّتة فوق مناطق من الأرض */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {SITES.map((s, i) => {
          const p = pts[s.key];
          if (!p || !p.visible) return null;

          const locked = rankOrd < s.minRank;
          const isSel = selected === s.key;
          const isHov = hover === s.key;
          const on = isSel || isHov;

          // ارتفاع العنوان فوق نقطته على الأرض
          const lift = s.major ? 104 : 82;
          const top = p.sy - lift;

          return (
            <div key={s.key}>
              {/* خيط رفيع يربط العنوان بموقعه على التضاريس */}
              <span
                className="pointer-events-none absolute"
                style={{
                  left: p.sx,
                  top,
                  width: 1,
                  height: lift,
                  background: `linear-gradient(to bottom, rgba(255,255,255,${
                    on ? 0.5 : 0.22
                  }), rgba(255,255,255,${on ? 0.9 : 0.55}))`,
                  transition: "background 0.35s",
                }}
              />

              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.09, duration: 0.55 }}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(s.key)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect(s.key)}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full cursor-pointer whitespace-nowrap px-5 py-3 text-center outline-none"
                style={{ left: clampX(p.sx), top }}
              >
                <span
                  className={[
                    "block transition-all duration-300",
                    s.major
                      ? "text-[clamp(0.78rem,1.7vw,1.12rem)] font-medium"
                      : "text-[clamp(0.6rem,1.15vw,0.8rem)] font-light",
                    isSel ? "text-white" : on ? "text-white" : "text-white/72",
                  ].join(" ")}
                  style={{
                    letterSpacing: s.major ? "0.3em" : "0.24em",
                    textTransform: "uppercase",
                    textShadow: isSel
                      ? "0 0 14px rgba(255,255,255,0.95), 0 0 38px rgba(255,255,255,0.5), 0 2px 16px #000"
                      : on
                      ? "0 0 12px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.35), 0 2px 16px #000"
                      : "0 0 9px rgba(255,255,255,0.42), 0 2px 16px #000",
                  }}
                >
                  {isAr ? s.labelAr : s.labelEn}
                </span>

                {locked && (
                  <span className="mono mt-1 inline-flex items-center gap-1 text-[0.5rem] uppercase tracking-[0.18em] text-white/45">
                    <Lock size={8} />
                    {isAr ? `رتبة ${s.minRank}+` : `TIER ${s.minRank}+`}
                  </span>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* العنوان العلوي — نص متوهّج فقط، بلا خلفية */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 px-6 pb-10 pt-5 text-center"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 100%)",
        }}
      >
        <p
          className="mono text-[0.55rem] uppercase tracking-[0.42em] text-white/45"
          style={{ textShadow: "0 2px 14px #000" }}
        >
          {isAr ? "بوابة المشاريع" : "Venture Gateway"}
        </p>
        <h2
          className="mt-2 text-[clamp(1.1rem,2.4vw,1.7rem)] font-light uppercase tracking-[0.3em] text-white"
          style={{
            fontFamily: "var(--font-luxury)",
            textShadow:
              "0 0 16px rgba(255,255,255,0.6), 0 0 44px rgba(255,255,255,0.22), 0 2px 18px #000",
          }}
        >
          {isAr ? "اختر مسارك" : "Choose Your Ascent"}
        </h2>
      </div>

      {/* الدخول — نص متوهّج فقط */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 pb-8 pt-32"
        style={{
          background:
            "linear-gradient(to top, #000 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.6) 62%, rgba(0,0,0,0) 100%)",
        }}
      >
        <p
          className="mono text-[0.55rem] uppercase tracking-[0.3em] text-white/45"
          style={{ textShadow: "0 2px 14px #000" }}
        >
          {selected
            ? isAr
              ? "المسار المحدد"
              : "Selected Track"
            : isAr
            ? "اختر منطقة أولًا"
            : "Select a region first"}
        </p>

        {selected && (
          <motion.p
            key={selected}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm uppercase tracking-[0.2em] text-white"
            style={{
              fontFamily: "var(--font-luxury)",
              textShadow: "0 0 14px rgba(255,255,255,0.7), 0 2px 16px #000",
            }}
          >
            {isAr
              ? SITES.find((s) => s.key === selected)?.labelAr
              : SITES.find((s) => s.key === selected)?.labelEn}
          </motion.p>
        )}

        <button
          disabled={!selected}
          onClick={onEnter}
          className={[
            "pointer-events-auto mt-1 bg-transparent px-6 py-2 text-[0.85rem] uppercase transition-all duration-300",
            selected
              ? "cursor-pointer text-white hover:tracking-[0.62em]"
              : "cursor-not-allowed text-white/25",
          ].join(" ")}
          style={{
            fontFamily: "var(--font-luxury)",
            letterSpacing: "0.5em",
            textIndent: "0.5em",
            textShadow: selected
              ? "0 0 14px rgba(255,255,255,0.9), 0 0 40px rgba(255,255,255,0.42), 0 2px 16px #000"
              : "0 2px 12px #000",
          }}
        >
          {isAr ? "الدخول" : "Enter"}
        </button>
      </div>
    </div>
  );
}
