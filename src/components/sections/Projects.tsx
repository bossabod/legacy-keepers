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

/* ===== بطاقة بوابة فاخرة (مربع كبير بإطار + توهج + Hover) ===== */
function CardStagger({
  title,
  desc,
  glyph,
  active,
  onClick,
  offset = "",
  dir,
}: {
  title: string;
  desc: string;
  glyph: string;
  active: boolean;
  onClick: () => void;
  offset?: string;
  dir: "rtl" | "ltr";
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      dir={dir}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "group relative w-full overflow-hidden rounded-2xl px-6 py-8 text-left transition-colors duration-500 sm:min-h-[15rem]",
        offset,
        active
          ? "border-white/40 bg-white/[0.07]"
          : "border-white/10 bg-gradient-to-b from-[#13161d]/95 via-[#0b0d12]/95 to-[#07080b]/95 hover:border-white/30",
      ].join(" ")}
      style={{
        boxShadow: active
          ? "0 0 40px rgba(195,201,211,0.18), inset 0 1px 0 rgba(255,255,255,0.10)"
          : "0 18px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* حافة علوية لامعة */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60" />

      {/* توهج عند التحويم */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(70% 80% at 50% 0%, rgba(255,255,255,0.10), transparent 70%)",
        }}
      />

      {/* رقم */}
      <div className="relative flex items-start justify-between">
        <span
          className="font-mono text-[0.6rem] tracking-[0.3em] text-[#5d6675]"
        >
          {glyph}
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full bg-[#c3c9d3] shadow-[0_0_8px_#c3c9d3] transition-opacity duration-300"
          style={{ opacity: active ? 1 : 0.35 }}
        />
      </div>

      {/* العنوان */}
      <h3
        className="relative mt-6 text-[clamp(1.15rem,2.4vw,1.5rem)] font-semibold uppercase tracking-[0.12em] text-[#eaeef5]"
        style={{ fontFamily: "var(--font-luxury)" }}
      >
        {title}
      </h3>

      {/* الوصف */}
      <p className="relative mt-3 text-[0.8rem] leading-relaxed text-[#8b95a5]">
        {desc}
      </p>

      {/* مؤشر فتح */}
      <span className="relative mt-6 inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.25em] text-[#c3c9d3] transition-colors duration-300 group-hover:text-white">
        {active ? "✓" : "→"} <span>{active ? "مفتوح" : "فتح"}</span>
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
