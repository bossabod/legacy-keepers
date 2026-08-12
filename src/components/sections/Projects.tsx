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

/* ===== قسم بوابة منفصل (أسلوب مفتوح — ليس Card تقليدية) ===== */
type CardVariant = "digital" | "physical" | "submit";

const CARD_STYLE: Record<
  CardVariant,
  { accent: string; chip: string; line: string; corner: string }
> = {
  digital: { accent: "#94a3b8", chip: "#94a3b8", line: "rgba(148,163,184,0.35)", corner: "#cdd5e0" },
  physical: { accent: "#cbd5e1", chip: "#cbd5e1", line: "rgba(203,213,225,0.4)", corner: "#e2e8f0" },
  submit: { accent: "#38bdf8", chip: "#38bdf8", line: "rgba(56,189,248,0.4)", corner: "#7dd3fc" },
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      className={[
        "group relative w-full px-2 py-10 text-left sm:min-h-[15rem]",
        offset,
        "transition-transform duration-500",
      ].join(" ")}
    >
      {/* شريط علوي أفقي دقيق */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px transition-colors duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${v.line}, transparent)`, opacity: active ? 1 : 0.55 }}
      />

      {/* شريط جانبي عمودي دقيق */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-px transition-all duration-500"
        style={{ background: `linear-gradient(180deg, transparent, ${v.line}, transparent)`, opacity: active ? 1 : 0.4 }}
      />

      {/* عناصر هندسية — ركن متحرك عند التحويم */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-3 w-3 transition-all duration-500"
        style={{ borderLeft: `1.5px solid ${v.corner}`, borderTop: `1.5px solid ${v.corner}`, opacity: active ? 0.9 : 0.3, transform: "translate(-1px,-1px)" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-3 h-2 w-2 border border-[#c3c9d3]/20 transition-all duration-500 group-hover:border-[#c3c9d3]/50"
      />

      {/* توهج خفيف يظهر عند التحويم */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-3 inset-y-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(60% 70% at 50% 10%, ${v.chip}14, transparent 70%)` }}
      />

      {/* رقم */}
      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[0.6rem] tracking-[0.35em] text-[#5d6675]">
          {glyph}
        </span>
        <span
          className="h-1 w-1 rounded-full"
          style={{ background: v.chip, boxShadow: `0 0 8px ${v.chip}`, opacity: active ? 1 : 0.35 }}
        />
      </div>

      {/* خط فاصل دقيق بين الرقم والعنوان */}
      <div className="relative my-5 h-px w-10 bg-gradient-to-r from-white/25 to-transparent transition-all duration-500 group-hover:w-16" />

      {/* العنوان */}
      <h3
        className="relative text-[clamp(1.2rem,2.5vw,1.6rem)] font-semibold uppercase tracking-[0.14em] text-[#f2f4f8]"
        style={{ fontFamily: "var(--font-luxury)", textShadow: `0 0 26px ${v.chip}44` }}
      >
        {title}
      </h3>

      {/* الوصف */}
      <p className="relative mt-4 max-w-[30ch] text-[0.8rem] leading-relaxed text-[#9aa4b2]">
        {desc}
      </p>

      {/* مؤشر فتح — خط سفلي يتوسع عند التحويم */}
      <span className="relative mt-7 inline-flex items-center gap-3">
        <span className="h-px w-5 bg-[#7fb0ff] transition-all duration-500 group-hover:w-8" />
        <span className="text-[0.62rem] uppercase tracking-[0.28em] text-[#c3c9d3] transition-colors duration-300 group-hover:text-white">
          {active ? "✓ OPEN" : "→ OPEN"}
        </span>
      </span>
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

            <div className="relative grid w-full max-w-5xl grid-cols-1 items-start gap-5 sm:grid-cols-3 sm:gap-6">
              {/* بطاقة يسار: المشاريع الرقمية */}
              <CardStagger
                dir={ar ? "rtl" : "ltr"}
                title={TABS[0].label}
                desc={
                  ar
                    ? "استكشف المبادرات الرقمية: المنصّات، التطبيقات، والأعمال التفاعلية داخل الدائرة."
                    : "Explore digital initiatives: platforms, apps, and interactive works within the circle."
                }
                glyph="01"
                active={tab === "digital"}
                onClick={() => setTab(tab === "digital" ? null : "digital")}
                offset="sm:-mt-6"
                variant="digital"
              />
              {/* بطاقة وسط أعلى: المشاريع الواقعية */}
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
                offset="sm:-mt-14"
                variant="physical"
              />
              {/* بطاقة يمين: تقديم مشروع */}
              <CardStagger
                dir={ar ? "rtl" : "ltr"}
                title={TABS[2].label}
                desc={
                  ar
                    ? "اقترح فكرة أو مبادرة جديدة ليراجعها المجلس وتأخذ مكانها."
                    : "Propose a new idea or initiative for the council to review and place."
                }
                glyph="03"
                active={tab === "submit"}
                onClick={() => setTab(tab === "submit" ? null : "submit")}
                offset="sm:-mt-6"
                variant="submit"
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
