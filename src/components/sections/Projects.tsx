"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectsGate from "@/components/projects/ProjectsGate";
import ProjectsDashboard from "@/components/projects/ProjectsDashboard";
import TrackBrowser from "@/components/projects/TrackBrowser";
import SubmitProject from "@/components/projects/SubmitProject";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { AppData } from "@/lib/types";

type Tab = "digital" | "physical" | "submit" | null;

/* ===== عنصر مشروع مفتوح (بدون مربع/خلفية) مع خط سفلي مميز ===== */
type CardVariant = "digital" | "physical" | "submit";

const CARD_STYLE: Record<
  CardVariant,
  { accent: string; line: string }
> = {
  digital: { accent: "#94a3b8", line: "rgba(148,163,184,0.45)" },
  physical: { accent: "#cbd5e1", line: "rgba(203,213,225,0.5)" },
  submit: { accent: "#38bdf8", line: "rgba(56,189,248,0.5)" },
};

function CardStagger({
  title,
  desc,
  glyph,
  active,
  onClick,
  offset = "",
  dir,
  variant = "digital",
}: {
  title: string;
  desc: string;
  glyph: string;
  active: boolean;
  onClick: () => void;
  offset?: string;
  dir: "rtl" | "ltr";
  variant?: CardVariant;
}) {
  const v = CARD_STYLE[variant];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      dir={dir}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      className={[
        "group relative w-full px-1 pb-10 pt-2 text-left",
        offset,
      ].join(" ")}
    >
      {/* توهج خفيف جدًا عند التحويم (بلا خلفية) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-4 inset-y-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(55% 70% at 50% 15%, ${v.accent}10, transparent 75%)` }}
      />

      {/* رقم صغير */}
      <span className="relative font-mono text-[0.6rem] tracking-[0.35em] text-[#5d6675]">
        {glyph}
      </span>

      {/* العنوان */}
      <h3
        className="relative mt-3 text-[clamp(1.25rem,2.6vw,1.7rem)] font-semibold uppercase tracking-[0.14em] text-[#f2f4f8]"
        style={{ fontFamily: "var(--font-luxury)", textShadow: `0 0 26px ${v.accent}33` }}
      >
        {title}
      </h3>

      {/* الوصف */}
      <p className="relative mt-3 max-w-[30ch] text-[0.8rem] leading-relaxed text-[#9aa4b2]">
        {desc}
      </p>

      {/* زر OPEN */}
      <span className="relative mt-6 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.28em] text-[#c3c9d3] transition-colors duration-300 group-hover:text-white">
        {active ? "✓ OPEN" : "→ OPEN"}
      </span>

      {/* الخط الأفقي المميز أسفل كل عنصر — مع توهج خفيف */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${v.line} 25%, ${v.line} 75%, transparent 100%)`,
          boxShadow: `0 0 10px ${v.accent}40`,
          opacity: active ? 1 : 0.75,
        }}
      />
      {/* نقطة نهاية مضيئة على الخط */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 h-1 w-1 -translate-y-[1.5px] rounded-full transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: v.accent, boxShadow: `0 0 6px ${v.accent}`, opacity: active ? 1 : 0.3, [dir === "rtl" ? "left" : "right"]: 0 }}
      />
    </motion.button>
  );
}

/**
 * قسم المشاريع.
 *
 * بوابة دخول ← لوحة عامة تحمل بطاقة الأداء، مع ثلاثة خيارات
 * متوسّطة أفقياً تفتح كل منها صفحة مستقلة داخل القسم نفسه.
 */
export default function ProjectsSection({
  data: _data,
  onNavigate,
}: {
  data: AppData;
  onNavigate?: (section: string) => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>(null);

  const TABS: { key: Exclude<Tab, null>; label: string }[] = [
    { key: "digital", label: t("pj.digital", lang) },
    { key: "physical", label: t("pj.physical", lang) },
    { key: "submit", label: t("pj.submit", lang) },
  ];

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <ProjectsGate key="gate" onEnter={() => setEntered(true)} />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[60vh] w-full"
          dir={ar ? "rtl" : "ltr"}
        >
          {/* ===== بوابة الخيارات — 3 بطاقات فاخرة بترتيب متدرج ===== */}
          <div className="relative mb-10 flex min-h-[26rem] items-center justify-center py-8">
            {/* توهج خلفي ناعم */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 mx-auto max-w-5xl"
              style={{
                background:
                  "radial-gradient(55% 60% at 50% 45%, rgba(255,255,255,0.045), transparent 70%)",
              }}
            />

            <div className="relative grid w-full max-w-5xl grid-cols-1 items-start gap-5 sm:grid-cols-3 sm:gap-8">
              {/* يسار: تقديم مشروع */}
              <CardStagger
                dir={ar ? "rtl" : "ltr"}
                title={TABS[2].label}
                desc={
                  ar
                    ? "اقترح فكرة أو مبادرة جديدة ليراجعها المجلس وتأخذ مكانها."
                    : "Propose a new idea or initiative for the council to review and place."
                }
                glyph="01"
                active={tab === "submit"}
                onClick={() => setTab(tab === "submit" ? null : "submit")}
                variant="submit"
              />
              {/* وسط: المشاريع الواقعية */}
              <CardStagger
                dir={ar ? "rtl" : "ltr"}
                title={TABS[1].label}
                desc={
                  ar
                    ? "أعمال ملموسة على الأرض: مشاريع ميدانية وواقعية تُبنى وتمتد."
                    : "Tangible on-the-ground work: field and physical projects built to last."
                }
                glyph="02"
                active={tab === "physical"}
                onClick={() => setTab(tab === "physical" ? null : "physical")}
                offset="sm:mt-10"
                variant="physical"
              />
              {/* يمين: المشاريع الرقمية */}
              <CardStagger
                dir={ar ? "rtl" : "ltr"}
                title={TABS[0].label}
                desc={
                  ar
                    ? "استكشف المبادرات الرقمية: المنصّات، التطبيقات، والأعمال التفاعلية داخل الدائرة."
                    : "Explore digital initiatives: platforms, apps, and interactive works within the circle."
                }
                glyph="03"
                active={tab === "digital"}
                onClick={() => setTab(tab === "digital" ? null : "digital")}
                variant="digital"
              />
            </div>
          </div>

          {/* ===== المحتوى ===== */}
          <AnimatePresence mode="wait">
            {tab === "digital" || tab === "physical" ? (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14, filter: "brightness(0.6)" }}
                animate={{ opacity: 1, y: 0, filter: "brightness(1)" }}
                exit={{ opacity: 0, y: -10, filter: "brightness(0.4)" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <TrackBrowser
                  track={tab}
                  onGoArchive={() => onNavigate?.("archive")}
                  onOpenMessages={() => onNavigate?.("messages")}
                />
              </motion.div>
            ) : tab === "submit" ? (
              <motion.div
                key="submit"
                initial={{ opacity: 0, y: 14, filter: "brightness(0.6)" }}
                animate={{ opacity: 1, y: 0, filter: "brightness(1)" }}
                exit={{ opacity: 0, y: -10, filter: "brightness(0.4)" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <SubmitProject />
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 14, filter: "brightness(0.6)" }}
                animate={{ opacity: 1, y: 0, filter: "brightness(1)" }}
                exit={{ opacity: 0, y: -10, filter: "brightness(0.4)" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProjectsDashboard
                  data={_data}
                  onOpenTrack={(track) => setTab(track)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
