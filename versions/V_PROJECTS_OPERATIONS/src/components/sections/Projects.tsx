"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectsGate from "@/components/projects/ProjectsGate";
import ProjectOperations from "@/components/projects/ProjectOperations";
import TrackBrowser from "@/components/projects/TrackBrowser";
import SubmitProject from "@/components/projects/SubmitProject";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { AppData } from "@/lib/types";

type Tab = "operations" | "digital" | "physical" | "submit" | null;

/* ===== عنصر مشروع — نص حر فقط، بدون أي Container بصري ===== */
type CardVariant = "digital" | "physical" | "submit";

function CardStagger({
  title,
  desc,
  glyph,
  active,
  onClick,
  dir,
  index,
}: {
  title: string;
  desc: string;
  glyph: string;
  active: boolean;
  onClick: () => void;
  dir: "rtl" | "ltr";
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      dir={dir}
      className="group flex flex-col items-start text-left"
      style={{
        justifyContent: index === 1 ? "center" : index === 0 ? "flex-start" : "flex-end",
        alignItems: index === 1 ? "center" : index === 0 ? "flex-start" : "flex-end",
        textAlign: index === 1 ? "center" : index === 0 ? "left" : "right",
      }}
    >
      {/* رقم صغير */}
      <span className="font-mono text-[0.62rem] tracking-[0.4em] text-[#5d6675]">
        {glyph}
      </span>

      {/* العنوان الكبير */}
      <h3
        className="mt-3 text-[clamp(1.4rem,3vw,2.2rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8] transition-colors duration-300 group-hover:text-white"
        style={{ fontFamily: "var(--font-luxury)" }}
      >
        {title}
      </h3>

      {/* الوصف القصير */}
      <p className="mt-3 max-w-[26ch] text-[0.82rem] leading-relaxed text-[#9aa4b2]">
        {desc}
      </p>

      {/* OPEN — رابط نصي بسيط */}
      <span className="mt-5 text-[0.66rem] uppercase tracking-[0.3em] text-[#7fb0ff] transition-colors duration-300 group-hover:text-sky-200">
        {active ? "✓ OPEN" : "→ OPEN"}
      </span>
    </button>
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
          {/* ===== بوابة الخيارات — 4 مسارات؛ تُضغط عند فتح العمليات حتى تظهر الخريطة فوراً ===== */}
          <div className={`relative mb-10 flex items-center justify-center py-8 ${tab === "operations" ? "min-h-0" : "min-h-[26rem]"}`}>
            {/* توهج خلفي ناعم */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 mx-auto max-w-5xl"
              style={{
                background:
                  "radial-gradient(55% 60% at 50% 45%, rgba(255,255,255,0.045), transparent 70%)",
              }}
            />

            {/* توزيع حر بالعرض الكامل: 01 يسار، 02 وسط، 03 يمين */}
            <div className="relative grid w-full grid-cols-1 gap-14 sm:grid-cols-2 lg:grid-cols-4 sm:gap-10">
              <CardStagger
                index={0}
                dir={ar ? "rtl" : "ltr"}
                title={ar ? "عمليات المشاريع" : "Project Operations"}
                desc={
                  ar
                    ? "الخريطة التشغيلية، الأداء السنوي، الحالة، النمو، الجدول الزمني، والمشاريع الرقمية والواقعية."
                    : "The operational map, annual performance, status, growth, timeline, digital and physical projects."
                }
                glyph="PROJECT 00"
                active={tab === "operations"}
                onClick={() => setTab(tab === "operations" ? null : "operations")}
              />
              {/* يسار: تقديم مشروع */}
              <CardStagger
                index={0}
                dir={ar ? "rtl" : "ltr"}
                title={TABS[2].label}
                desc={
                  ar
                    ? "اقترح فكرة أو مبادرة جديدة ليراجعها المجلس وتأخذ مكانها."
                    : "Propose a new idea or initiative for the council to review and place."
                }
                glyph="PROJECT 01"
                active={tab === "submit"}
                onClick={() => setTab(tab === "submit" ? null : "submit")}
              />
              {/* وسط: المشاريع الواقعية */}
              <CardStagger
                index={1}
                dir={ar ? "rtl" : "ltr"}
                title={TABS[1].label}
                desc={
                  ar
                    ? "أعمال ملموسة على الأرض: مشاريع ميدانية وواقعية تُبنى وتمتد."
                    : "Tangible on-the-ground work: field and physical projects built to last."
                }
                glyph="PROJECT 02"
                active={tab === "physical"}
                onClick={() => setTab(tab === "physical" ? null : "physical")}
              />
              {/* يمين: المشاريع الرقمية */}
              <CardStagger
                index={2}
                dir={ar ? "rtl" : "ltr"}
                title={TABS[0].label}
                desc={
                  ar
                    ? "استكشف المبادرات الرقمية: المنصّات، التطبيقات، والأعمال التفاعلية داخل الدائرة."
                    : "Explore digital initiatives: platforms, apps, and interactive works within the circle."
                }
                glyph="PROJECT 03"
                active={tab === "digital"}
                onClick={() => setTab(tab === "digital" ? null : "digital")}
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
            ) : tab === "operations" ? (
              <motion.div
                key="operations"
                initial={{ opacity: 0, y: 14, filter: "brightness(0.6)" }}
                animate={{ opacity: 1, y: 0, filter: "brightness(1)" }}
                exit={{ opacity: 0, y: -10, filter: "brightness(0.4)" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProjectOperations
                  data={_data}
                  onNavigate={onNavigate}
                  onOpenTrack={(track) => setTab(track)}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
