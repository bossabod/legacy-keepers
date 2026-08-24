"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/ui";
import { Logo } from "@/components/brand";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";
import type { SectionKey } from "@/components/Dashboard";

/* =====================================================================
   HOME — cleaned after moving Project Operations (globe, operational
   dashboard, quick glance, clocks, projects dashboard) into the PROJECTS
   section (see src/components/projects/ProjectOperations.tsx).
   Keeps: cinematic opening, The House journey, and the room shortcuts.
   The full original HOME is preserved in Home.original.tsx.
   ===================================================================== */

const TAB_NAV: { key: SectionKey; labelEn: string; labelAr: string }[] = [
  { key: "rules", labelEn: "Rules", labelAr: "القواعد" },
  { key: "goals", labelEn: "Objectives", labelAr: "الأهداف" },
  { key: "identity", labelEn: "Who Are the People of Impact", labelAr: "من هم أصحاب الأثر" },
];

/* Journey through the house — each chapter opens a room */
const JOURNEY: { key: SectionKey; no: string; en: string; subEn: string; ar: string; subAr: string }[] = [
  { key: "home", no: "01", en: "The House", subEn: "Where the circle began — the covenant, the rooms, the rules.", ar: "البيت", subAr: "حيث بدأت الدائرة — الميثاق، والغرف، والقواعد." },
  { key: "network", no: "02", en: "The Network", subEn: "Five nodes, five cities, one quiet command.", ar: "الشبكة", subAr: "خمس عقد، خمس مدن، قيادة واحدة هادئة." },
  { key: "investments", no: "03", en: "Investments", subEn: "The long game — equity, land, metal, digital.", ar: "الاستثمارات", subAr: "اللعبة الطويلة — أسهم، وعقار، ومعادن، ورقمي." },
  { key: "vip", no: "04", en: "Experiences", subEn: "Private dining, aviation, the yacht, the concierge.", ar: "التجارب", subAr: "مأدبة خاصة، وطيران، ويخت، وخدمة كونسيرج." },
  { key: "archive", no: "05", en: "The Archive", subEn: "Every record, every year, kept sealed.", ar: "الأرشيف", subAr: "كل سجلّ، وكل سنة، محفوظ ومختوم." },
  { key: "vip", no: "06", en: "The Elite", subEn: "Access granted only to those the house admits.", ar: "النخبة", subAr: "دخول لا يُمنح إلا لمن يعرفه البيت." },
];

/* The cinematic opening plays once per session, then the house is revealed. */
let introShown = false;

export default function HomeSection({
  data,
  onNavigate,
}: {
  data: AppData;
  onNavigate: (k: SectionKey) => void;
}) {
  const me = data.members[0];
  const { lang } = useApp();
  const ar = lang === "ar";
  const [introOn, setIntroOn] = useState(!introShown);
  const [activeTab, setActiveTab] = useState<SectionKey | null>(null);

  useEffect(() => {
    if (!introShown) {
      introShown = true;
      const t = setTimeout(() => setIntroOn(false), 3200);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      {/* ═══════════ Cinematic opening — the house admits you ═══════════ */}
      <AnimatePresence>
        {introOn && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#060604]"
            exit={{ opacity: 0, transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } }}
            onClick={() => { setIntroOn(false); play("click"); }}
          >
            <motion.div className="pointer-events-none absolute inset-0 stage-glow" />
            <div className="relative flex flex-col items-center px-8 text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
                <Logo size={54} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 text-[clamp(1.4rem,3vw,2rem)] font-light uppercase tracking-[0.3em] text-[#ece9e0]"
                style={{ fontFamily: "var(--font-luxury)" }}
              >
                {ar ? "أصحاب الأثر" : "Owners of Impact"}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 1.2 }}
                className="mt-3 text-[0.55rem] uppercase tracking-[0.42em] text-[#c8a76b]/80"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                {ar ? "نادٍ مغلق · يقبل من يعرفه" : "A private house — it admits those it knows."}
              </motion.div>
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.4, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-7 h-px w-56 origin-center"
                style={{ background: "linear-gradient(90deg, transparent, #c8a76b, transparent)" }}
              />
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, duration: 1 }}
                className="mt-7 flex items-center gap-5 text-[0.5rem] uppercase tracking-[0.24em] text-[#7c7668]"
                style={{ fontFamily: "var(--font-ibm-mono)" }}
              >
                <span>{ar ? "رقم العضوية" : "Membership No."} · {me.code}</span>
                <span className="flex items-center gap-1.5" style={{ color: "#c8a76b" }}>
                  <span className="h-1 w-1 rounded-full" style={{ background: "#c8a76b" }} /> {ar ? "الوصول مُصرَّح" : "Access Authorised"}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl space-y-12">
        {/* ═══════ The Journey — index into the house ═══════ */}
        <Reveal>
          <div className="border-b border-[#c8a76b]/10 pb-2 pt-1">
            <div className="mb-7 flex items-end justify-between">
              <div>
                <div className="eyebrow" style={{ color: "#c8a76b" }}>{ar ? "رحلتك في النادي" : "Your Passage"}</div>
                <h2 className="mt-3 text-[clamp(2rem,5vw,3.4rem)] font-light uppercase tracking-[0.14em] text-[#ece9e0]" style={{ fontFamily: "var(--font-luxury)" }}>
                  {ar ? "منزل أصحاب الأثر" : "The House"}
                </h2>
              </div>
              <span className="hidden sm:block text-[0.46rem] uppercase tracking-[0.3em] text-[#7c7668]" style={{ fontFamily: "var(--font-ibm-mono)" }}>EST. 2012 · BY COVENANT</span>
            </div>
            <div className="flex flex-col">
              {JOURNEY.map((j, i) => (
                <button
                  key={`${j.no}-${i}`}
                  onClick={() => { onNavigate(j.key); play("open"); }}
                  onMouseEnter={() => play("hover")}
                  className="group flex w-full items-center gap-6 border-b border-[#c8a76b]/[0.08] py-5 text-left transition-colors duration-300 hover:bg-[#c8a76b]/[0.03] sm:gap-10"
                  style={{ textAlign: ar ? "right" : "left" }}
                >
                  <span className="shrink-0 text-[0.62rem] tracking-[0.2em] text-[#8a7044]" style={{ fontFamily: "var(--font-ibm-mono)" }}>{j.no}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[clamp(1.1rem,2.4vw,1.6rem)] font-light uppercase tracking-[0.12em] text-[#ece9e0] transition-colors duration-300 group-hover:text-[#e8c992]" style={{ fontFamily: "var(--font-luxury)" }}>
                      {ar ? j.ar : j.en}
                    </div>
                    <div className="mt-1 text-[0.68rem] tracking-[0.04em] text-[#7c7668]" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                      {ar ? j.subAr : j.subEn}
                    </div>
                  </div>
                  <span className="shrink-0 text-[#8a7044] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" style={{ transform: "translateX(-6px)" }}>
                    {ar ? <ArrowLeft size={16} /> : <ArrowUpRight size={16} />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ═══════ The Rooms ═══════ */}
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 border-b border-[#c8a76b]/[0.08] pb-5 pt-1">
            {TAB_NAV.map((t2) => {
              const on = activeTab === t2.key;
              return (
                <button
                  key={t2.key}
                  onMouseEnter={() => { setActiveTab(t2.key); play("hover"); }}
                  onMouseLeave={() => setActiveTab(null)}
                  onClick={() => onNavigate(t2.key)}
                  className="group relative py-2 text-center"
                >
                  <span
                    className={`text-[clamp(0.95rem,1.7vw,1.2rem)] tracking-[0.1em] transition-all duration-300 ${on ? "text-[#e8c992]" : "text-[#8b8577] group-hover:text-[#ece9e0]"}`}
                    style={{ fontFamily: "var(--font-luxury)", fontWeight: 600, textShadow: on ? "0 0 18px rgba(216,180,120,0.3)" : "none" }}
                  >
                    {ar ? t2.labelAr : t2.labelEn}
                  </span>
                  <span className="absolute inset-x-0 -bottom-[2px] mx-auto h-px transition-all duration-500"
                    style={{ width: on ? "100%" : "0%", background: "linear-gradient(90deg, transparent, #c8a76b, transparent)" }} />
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>
    </>
  );
}
