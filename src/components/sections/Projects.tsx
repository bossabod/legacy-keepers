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
type CardVariant = "digital" | "physical" | "submit";

const CARD_STYLE: Record<
  CardVariant,
  {
    idles: string;
    ring: string;
    glow: string;
    chip: string;
    accent: string;
    inner: string;
  }
> = {
  // أسود غامق + لمسة رمادية
  digital: {
    idles:
      "border-[#1a1f2a]/90 bg-gradient-to-b from-[#0a0c11] via-[#05060a] to-[#020204] hover:border-slate-400/40",
    ring: "bg-slate-400/20",
    glow: "radial-gradient(70% 80% at 50% 0%, rgba(148,163,184,0.14), transparent 70%)",
    chip: "#94a3b8",
    accent: "from-[#0a0c11] via-[#1e2633] to-[#020204]",
    inner: "shadow-[0_22px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.05)]",
  },
  // رمادي داكن معدني مع لمسة فضية
  physical: {
    idles:
      "border-[#232936]/90 bg-gradient-to-b from-[#10141b] via-[#080b10] to-[#030406] hover:border-slate-300/40",
    ring: "bg-slate-300/25",
    glow: "radial-gradient(70% 80% at 50% 0%, rgba(226,232,240,0.16), transparent 70%)",
    chip: "#cbd5e1",
    accent: "from-[#10141b] via-[#2a313d] to-[#030406]",
    inner: "shadow-[0_26px_70px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]",
  },
  // أزرق داكن بلمسة ملكية
  submit: {
    idles:
      "border-[#0f2233]/90 bg-gradient-to-b from-[#071018] via-[#04090e] to-[#010304] hover:border-sky-400/40",
    ring: "bg-sky-400/20",
    glow: "radial-gradient(70% 80% at 50% 0%, rgba(56,189,248,0.16), transparent 70%)",
    chip: "#38bdf8",
    accent: "from-[#071018] via-[#0f2a3f] to-[#010304]",
    inner: "shadow-[0_24px_65px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(56,189,248,0.10)]",
  },
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
      whileHover={{ y: -7, scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "group relative w-full overflow-hidden rounded-2xl px-6 py-8 text-left transition-all duration-500 sm:min-h-[15rem]",
        offset,
        active ? `${v.ring} ring-1 ring-white/20` : v.idles,
        v.inner,
      ].join(" ")}
    >
      {/* تدرّج عمق داخلي */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: `linear-gradient(180deg, ${v.accent.split(" via ")[0]}, transparent 45%)` }}
      />

      {/* حافة علوية لامعة */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-70" />

      {/* توهج عند التحويم */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: v.glow }}
      />

      {/* إطار داخلي أنيق */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-xl border border-white/[0.04]"
      />

      {/* رقم */}
      <div className="relative flex items-start justify-between">
        <span className="font-mono text-[0.6rem] tracking-[0.3em] text-[#5d6675]">
          {glyph}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${v.chip} shadow-[0_0_8px_currentColor] transition-opacity duration-300`}
          style={{ opacity: active ? 1 : 0.35, background: v.chip, boxShadow: `0 0 10px ${v.chip}` }}
        />
      </div>

      {/* العنوان */}
      <h3
        className="relative mt-6 text-[clamp(1.15rem,2.4vw,1.5rem)] font-semibold uppercase tracking-[0.12em] text-[#f2f4f8]"
        style={{ fontFamily: "var(--font-luxury)", textShadow: `0 0 22px ${v.chip}55` }}
      >
        {title}
      </h3>

      {/* الوصف */}
      <p className="relative mt-3 text-[0.8rem] leading-relaxed text-[#9aa4b2]">
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
