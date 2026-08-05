"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Lock, ArrowRight } from "lucide-react";
import ConceptThumb from "./ConceptThumb";
import ProjectDetail from "./ProjectDetail";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import {
  MONTHS,
  UPCOMING,
  CURRENT_MONTH,
  YEARS,
  OPEN_YEAR,
  snapshot,
  tally,
  type MonthKey,
  type Snapshot,
  type Track,
} from "@/lib/projects-registry";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

export default function TrackBrowser({
  track,
  onGoArchive,
  onOpenMessages,
}: {
  track: Track;
  onGoArchive?: () => void;
  onOpenMessages?: () => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [yearOpen, setYearOpen] = useState(true);
  const [month, setMonth] = useState<MonthKey>(CURRENT_MONTH);
  const [locked, setLocked] = useState<number | null>(null);
  const [open, setOpen] = useState<Snapshot | null>(null);

  const rows = useMemo(() => snapshot(track, month), [track, month]);
  const stats = useMemo(() => tally(track, month), [track, month]);

  if (open) {
    return (
      <ProjectDetail
        p={open}
        onBack={() => setOpen(null)}
        onOpenMessages={onOpenMessages}
      />
    );
  }

  return (
    <div className="relative flex w-full flex-col gap-6 lg:flex-row" dir={ar ? "rtl" : "ltr"}>
      {/* ══════════ الشريط الجانبي ══════════ */}
      <aside
        className="shrink-0 rounded-xl border border-white/[0.06] lg:sticky lg:top-24 lg:w-[208px] lg:self-start"
        style={{ background: "#0a0b0d" }}
      >
        <div className="border-b border-white/[0.05] px-4 py-3">
          <span
            className="text-[0.48rem] uppercase tracking-[0.28em] text-[#5d6675]"
            style={{ fontFamily: MONO }}
          >
            {t("pj.archive", lang)}
          </span>
        </div>

        <nav className="max-h-[50vh] overflow-y-auto py-1.5 lg:max-h-[62vh]">
          {YEARS.map((y) => {
            const isOpen = y === OPEN_YEAR;
            const expanded = isOpen && yearOpen;
            return (
              <div key={y}>
                <button
                  type="button"
                  onClick={() => (isOpen ? setYearOpen((v) => !v) : setLocked(y))}
                  className={[
                    "flex w-full items-center gap-2 px-4 py-2 text-start transition-colors duration-300",
                    isOpen
                      ? "text-[#e8edf5] hover:bg-white/[0.035]"
                      : "text-[#4a515e] hover:bg-white/[0.02] hover:text-[#767d8b]",
                  ].join(" ")}
                >
                  {expanded ? (
                    <ChevronDown size={11} className="shrink-0 opacity-70" />
                  ) : (
                    <ChevronRight
                      size={11}
                      className={`shrink-0 opacity-55 ${ar ? "rotate-180" : ""}`}
                    />
                  )}
                  <span className="flex-1 text-[0.68rem] tracking-[0.14em]" style={{ fontFamily: MONO }}>
                    {y}
                  </span>
                  {!isOpen && <Lock size={9} className="shrink-0 opacity-50" />}
                  {isOpen && (
                    <span
                      className="h-1 w-1 rounded-full bg-white/75"
                      style={{ boxShadow: "0 0 6px rgba(255,255,255,0.75)" }}
                    />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="my-1 ms-[1.35rem] border-s border-white/[0.06]">
                        {MONTHS.map((m) => {
                          const on = m === month;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMonth(m)}
                              className={[
                                "relative flex w-full items-center gap-2 py-[0.3rem] pe-2 ps-3 text-start transition-colors duration-300",
                                on ? "text-white" : "text-[#5f6774] hover:text-[#a7b0be]",
                              ].join(" ")}
                            >
                              {on && (
                                <motion.span
                                  layoutId={`mm-${track}`}
                                  className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-white"
                                  style={{
                                    boxShadow: "0 0 7px rgba(255,255,255,0.9)",
                                    insetInlineStart: -1,
                                  }}
                                />
                              )}
                              <span
                                className="text-[0.55rem] tracking-[0.14em]"
                                style={{
                                  fontFamily: MONO,
                                  textShadow: on ? "0 0 10px rgba(255,255,255,0.45)" : undefined,
                                }}
                              >
                                {t(`mo.${m}`, lang)}
                              </span>
                              {m === CURRENT_MONTH && (
                                <span
                                  className="ms-auto text-[0.4rem] tracking-[0.1em]"
                                  style={{ fontFamily: MONO, color: "#6f7a89" }}
                                >
                                  {t("pj.now", lang)}
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {UPCOMING.map((m) => (
                          <div
                            key={m}
                            className="flex items-center gap-2 py-[0.3rem] pe-2 ps-3 opacity-25"
                          >
                            <span
                              className="text-[0.55rem] tracking-[0.14em] text-[#59606d]"
                              style={{ fontFamily: MONO }}
                            >
                              {t(`mo.${m}`, lang)}
                            </span>
                            <span
                              className="ms-auto text-[0.38rem] tracking-[0.1em] text-[#59606d]"
                              style={{ fontFamily: MONO }}
                            >
                              {t("pj.upcoming", lang)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ══════════ الشبكة ══════════ */}
      <section className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <div
              className="text-[0.46rem] uppercase tracking-[0.28em] text-[#5d6675]"
              style={{ fontFamily: MONO }}
            >
              {OPEN_YEAR} · {t("pj.snapshot", lang)}
            </div>
            <h3
              className="mt-1.5 text-[clamp(1.05rem,2.4vw,1.5rem)] font-light uppercase tracking-[0.22em] text-[#eaeef5]"
              style={{ fontFamily: LUX }}
            >
              {t(`mo.${month}`, lang)}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Stat label={t("pj.activeProjects", lang)} value={stats.active} />
            <Stat label={t("pj.completed", lang)} value={stats.completed} />
            <Stat label={t("pj.archived", lang)} value={stats.archived} muted />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${track}-${month}`}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {rows.map((p, i) => (
              <Card key={p.key} p={p} index={i} onOpen={() => setOpen(p)} />
            ))}
          </motion.div>
        </AnimatePresence>

        <div
          className="mt-6 flex items-center justify-between text-[0.42rem] uppercase tracking-[0.18em] text-[#454c59]"
          style={{ fontFamily: MONO }}
        >
          <span>{t("pj.register", lang)}</span>
          <span>
            {rows.length} {t("pj.records", lang)}
          </span>
        </div>
      </section>

      {/* ══════════ السنة المؤرشفة ══════════ */}
      <AnimatePresence>
        {locked !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={() => setLocked(null)}
            className="fixed inset-0 z-[85] flex items-center justify-center bg-black/88 px-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="text-center"
            >
              <Lock size={16} className="mx-auto mb-5 text-white/40" />
              <h4
                className="text-[clamp(0.95rem,2.2vw,1.3rem)] font-light uppercase tracking-[0.28em] text-white"
                style={{ fontFamily: LUX, textShadow: "0 0 16px rgba(255,255,255,0.4)" }}
              >
                {t("pj.archivedTitle", lang)}
              </h4>
              <p className="mt-4 text-[0.8rem] font-light text-[#98a2b1]">
                {t("pj.archivedBody", lang)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setLocked(null);
                  onGoArchive?.();
                }}
                className="group mt-8 inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.28em] text-white transition-all duration-500 hover:tracking-[0.34em]"
                style={{ fontFamily: MONO, textShadow: "0 0 12px rgba(255,255,255,0.5)" }}
              >
                {t("pj.goArchive", lang)}
                <ArrowRight
                  size={12}
                  className={`transition-transform duration-500 group-hover:translate-x-1 ${ar ? "rotate-180" : ""}`}
                />
              </button>
              <div className="mx-auto mt-2 h-px w-40 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- بطاقة مشروع ---------------- */

function Card({
  p,
  index,
  onOpen,
}: {
  p: Snapshot;
  index: number;
  onOpen: () => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const done = p.status === "COMPLETED";

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] text-start transition-colors duration-400 hover:border-white/[0.22]"
      style={{
        background:
          "linear-gradient(158deg, rgba(16,19,26,0.92) 0%, rgba(8,10,15,0.96) 100%)",
      }}
    >
      {/* الصورة */}
      <div className="relative h-28 overflow-hidden border-b border-white/[0.06]">
        <ConceptThumb
          seed={p.id}
          className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(8,10,15,0.95) 0%, rgba(8,10,15,0.35) 45%, transparent 100%)",
          }}
        />
        <span
          className="absolute start-3 top-3 text-[0.44rem] tracking-[0.2em] text-[#8a93a1]"
          style={{ fontFamily: MONO }}
        >
          {p.id}
        </span>
        {p.isNew && (
          <span
            className="absolute end-3 top-3 rounded-sm border border-white/20 bg-black/50 px-1.5 py-px text-[0.38rem] tracking-[0.14em] text-[#c3ccd9]"
            style={{ fontFamily: MONO }}
          >
            {t("pj.new", lang)}
          </span>
        )}
      </div>

      {/* المتن */}
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <h4
            className="text-[1rem] uppercase tracking-[0.12em] text-[#eaeef5] transition-colors group-hover:text-white"
            style={{ fontFamily: LUX }}
          >
            {ar ? p.nameAr : p.nameEn}
          </h4>
          <span
            className={[
              "shrink-0 rounded-sm border px-1.5 py-0.5 text-[0.38rem] uppercase tracking-[0.16em]",
              done ? "border-white/30 text-white" : "border-white/10 text-[#8d96a4]",
            ].join(" ")}
            style={{
              fontFamily: MONO,
              textShadow: done ? "0 0 8px rgba(255,255,255,0.5)" : undefined,
            }}
          >
            {t(`pj.st.${p.status}`, lang)}
          </span>
        </div>

        <div
          className="mt-1 text-[0.44rem] uppercase tracking-[0.18em] text-[#7a8391]"
          style={{ fontFamily: MONO }}
        >
          {ar ? p.categoryAr : p.categoryEn}
        </div>

        <p className="mt-2.5 line-clamp-2 text-[0.72rem] leading-relaxed text-[#8d96a4]">
          {ar ? p.briefAr : p.briefEn}
        </p>

        {/* التقدّم */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span
              className="text-[0.42rem] uppercase tracking-[0.16em] text-[#5f6875]"
              style={{ fontFamily: MONO }}
            >
              {t("pj.started", lang)} {t(`mo.${p.started}`, lang)}
            </span>
            <span
              className="tabular-nums text-[0.6rem] text-[#c2cad6]"
              style={{ fontFamily: MONO }}
            >
              {p.completion}%
            </span>
          </div>
          <div className="h-px w-full bg-white/[0.08]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${p.completion}%` }}
              transition={{
                duration: 1.15,
                delay: 0.28 + Math.min(index, 8) * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="h-px"
              style={{
                background: done
                  ? "linear-gradient(90deg, rgba(255,255,255,0.55), #fff)"
                  : "linear-gradient(90deg, rgba(185,194,208,0.45), rgba(233,238,245,0.95))",
                boxShadow: done
                  ? "0 0 9px rgba(255,255,255,0.85)"
                  : "0 0 6px rgba(255,255,255,0.45)",
              }}
            />
          </div>
        </div>
      </div>

      {/* توهج الحافة */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10)" }}
      />
    </motion.button>
  );
}

function Stat({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[0.44rem] uppercase tracking-[0.2em] text-[#5f6875]"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
      <span
        className={["tabular-nums text-[0.9rem]", muted ? "text-[#5f6875]" : "text-[#eaeef5]"].join(" ")}
        style={{
          fontFamily: MONO,
          textShadow: muted ? undefined : "0 0 10px rgba(255,255,255,0.28)",
        }}
      >
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}
