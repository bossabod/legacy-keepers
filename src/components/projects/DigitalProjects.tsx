"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Lock, ArrowRight, X } from "lucide-react";
import ConceptThumb from "./ConceptThumb";
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
} from "@/lib/archive-2026";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

export default function DigitalProjects({
  onGoArchive,
}: {
  onGoArchive?: () => void;
}) {
  const [yearOpen, setYearOpen] = useState(true);
  const [month, setMonth] = useState<MonthKey>(CURRENT_MONTH);
  const [locked, setLocked] = useState<number | null>(null);
  const [detail, setDetail] = useState<Snapshot | null>(null);

  const rows = useMemo(() => snapshot(month), [month]);
  const stats = useMemo(() => tally(month), [month]);

  return (
    <div className="relative flex w-full flex-col gap-6 lg:flex-row" dir="ltr">
      {/* ══════════ الشريط الجانبي: الأرشيف ══════════ */}
      <aside
        className="shrink-0 rounded-xl border border-white/[0.07] lg:sticky lg:top-24 lg:w-[210px] lg:self-start"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,12,17,0.96) 0%, rgba(6,8,11,0.98) 100%)",
        }}
      >
        <div className="border-b border-white/[0.06] px-4 py-3">
          <div
            className="text-[0.5rem] uppercase tracking-[0.28em] text-[#5d6675]"
            style={{ fontFamily: MONO }}
          >
            Archive
          </div>
        </div>

        <nav className="max-h-[52vh] overflow-y-auto py-1.5 lg:max-h-[64vh]">
          {YEARS.map((y) => {
            const isOpen = y === OPEN_YEAR;
            const expanded = isOpen && yearOpen;

            return (
              <div key={y}>
                <button
                  type="button"
                  onClick={() =>
                    isOpen ? setYearOpen((v) => !v) : setLocked(y)
                  }
                  className={[
                    "group flex w-full items-center gap-2 px-4 py-2 text-left transition-colors duration-300",
                    isOpen
                      ? "text-[#e8edf5] hover:bg-white/[0.04]"
                      : "text-[#4e5563] hover:bg-white/[0.02] hover:text-[#79808f]",
                  ].join(" ")}
                >
                  {expanded ? (
                    <ChevronDown size={11} className="shrink-0 opacity-70" />
                  ) : (
                    <ChevronRight size={11} className="shrink-0 opacity-55" />
                  )}
                  <span
                    className="flex-1 text-[0.68rem] tracking-[0.16em]"
                    style={{ fontFamily: MONO }}
                  >
                    {y}
                  </span>
                  {!isOpen && <Lock size={9} className="shrink-0 opacity-55" />}
                  {isOpen && (
                    <span
                      className="h-1 w-1 rounded-full bg-white/70"
                      style={{ boxShadow: "0 0 6px rgba(255,255,255,0.7)" }}
                    />
                  )}
                </button>

                {/* الأشهر */}
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-l border-white/[0.07] ms-[1.35rem] my-1">
                        {MONTHS.map((m) => {
                          const on = m === month;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMonth(m)}
                              className={[
                                "relative flex w-full items-center gap-2 py-[0.32rem] ps-3 pe-2 text-left transition-all duration-300",
                                on
                                  ? "text-white"
                                  : "text-[#626a78] hover:text-[#aab3c1]",
                              ].join(" ")}
                            >
                              {on && (
                                <motion.span
                                  layoutId="month-mark"
                                  className="absolute left-[-1px] top-1/2 h-3.5 w-px -translate-y-1/2 bg-white"
                                  style={{ boxShadow: "0 0 7px rgba(255,255,255,0.85)" }}
                                />
                              )}
                              <span
                                className="text-[0.55rem] tracking-[0.18em]"
                                style={{
                                  fontFamily: MONO,
                                  textShadow: on
                                    ? "0 0 10px rgba(255,255,255,0.45)"
                                    : undefined,
                                }}
                              >
                                {m}
                              </span>
                              {m === CURRENT_MONTH && (
                                <span
                                  className="ms-auto text-[0.4rem] tracking-[0.1em]"
                                  style={{ fontFamily: MONO, color: "#6f7a89" }}
                                >
                                  NOW
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {/* أشهر قادمة */}
                        {UPCOMING.map((m) => (
                          <div
                            key={m}
                            className="flex items-center gap-2 py-[0.32rem] ps-3 pe-2 opacity-25"
                          >
                            <span
                              className="text-[0.55rem] tracking-[0.18em] text-[#59606d]"
                              style={{ fontFamily: MONO }}
                            >
                              {m}
                            </span>
                            <span
                              className="ms-auto text-[0.38rem] tracking-[0.12em] text-[#59606d]"
                              style={{ fontFamily: MONO }}
                            >
                              UPCOMING
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

      {/* ══════════ المساحة الرئيسية ══════════ */}
      <section className="min-w-0 flex-1">
        {/* رأس الشهر + الإحصاء */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div>
            <div
              className="text-[0.48rem] uppercase tracking-[0.3em] text-[#5d6675]"
              style={{ fontFamily: MONO }}
            >
              {OPEN_YEAR} · Snapshot
            </div>
            <h3
              className="mt-1.5 text-[clamp(1.05rem,2.4vw,1.5rem)] font-light uppercase tracking-[0.24em] text-[#eaeef5]"
              style={{ fontFamily: LUX }}
            >
              {month}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Stat label="Active Projects" value={stats.active} />
            <Stat label="Completed" value={stats.completed} />
            <Stat label="Archived" value={stats.archived} muted />
          </div>
        </div>

        {/* البطاقات */}
        <AnimatePresence mode="wait">
          <motion.div key={month} className="flex flex-col gap-2.5">
            {rows.map((p, i) => (
              <ProjectRow
                key={p.id}
                p={p}
                index={i}
                onOpen={() => setDetail(p)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <div
          className="mt-5 flex items-center justify-between text-[0.42rem] uppercase tracking-[0.2em] text-[#454c59]"
          style={{ fontFamily: MONO }}
        >
          <span>Owners of Impact · Classified Register</span>
          <span>{rows.length} Records</span>
        </div>
      </section>

      {/* ══════════ رسالة السنة المؤرشفة ══════════ */}
      <AnimatePresence>
        {locked !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/86 px-6 backdrop-blur-sm"
            onClick={() => setLocked(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="text-center"
            >
              <Lock size={16} className="mx-auto mb-5 text-white/40" />
              <h4
                className="text-[clamp(0.95rem,2.2vw,1.35rem)] font-light uppercase tracking-[0.3em] text-white"
                style={{
                  fontFamily: LUX,
                  textShadow: "0 0 16px rgba(255,255,255,0.4)",
                }}
              >
                Archived Projects
              </h4>
              <p className="mt-4 text-[0.78rem] font-light text-[#98a2b1]">
                This year has been transferred to the Project Archive.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLocked(null);
                  onGoArchive?.();
                }}
                className="group mt-8 inline-flex items-center gap-2 bg-transparent text-[0.6rem] uppercase tracking-[0.3em] text-white transition-all duration-500 hover:tracking-[0.36em]"
                style={{
                  fontFamily: MONO,
                  textShadow: "0 0 12px rgba(255,255,255,0.5)",
                }}
              >
                Go to Archive
                <ArrowRight
                  size={12}
                  className="transition-transform duration-500 group-hover:translate-x-1"
                />
              </button>
              <div className="mx-auto mt-2 h-px w-40 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ تفاصيل المشروع ══════════ */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/88 p-5 backdrop-blur-sm"
            onClick={() => setDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-white/[0.10] p-6"
              style={{
                background:
                  "linear-gradient(158deg, rgba(18,22,31,0.97) 0%, rgba(8,10,15,0.99) 100%)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <ConceptThumb
                    seed={detail.id}
                    className="h-14 w-14 shrink-0 rounded-md"
                  />
                  <div>
                    <div
                      className="text-[0.48rem] tracking-[0.24em] text-[#69717f]"
                      style={{ fontFamily: MONO }}
                    >
                      {detail.id}
                    </div>
                    <h4
                      className="mt-1 text-lg uppercase tracking-[0.16em] text-white"
                      style={{ fontFamily: LUX }}
                    >
                      {detail.name}
                    </h4>
                    <div
                      className="mt-1 text-[0.52rem] uppercase tracking-[0.18em] text-[#7d8694]"
                      style={{ fontFamily: MONO }}
                    >
                      {detail.category}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="rounded-md border border-white/[0.09] p-1.5 transition-colors hover:border-white/25 hover:text-white"
                  style={{ color: "#6d7684" }}
                >
                  <X size={13} />
                </button>
              </div>

              <p className="mt-5 text-[0.8rem] leading-relaxed text-[#a7b0be]">
                {detail.description}
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Cell label="Started" value={detail.started} />
                <Cell label="Status" value={detail.status} />
                <Cell label="Completion" value={`${detail.completion}%`} />
              </div>

              <div className="mt-5">
                <div className="h-px w-full bg-white/[0.07]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${detail.completion}%` }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                    className="h-px bg-white"
                    style={{ boxShadow: "0 0 8px rgba(255,255,255,0.7)" }}
                  />
                </div>
              </div>

              <div
                className="mt-5 text-[0.42rem] uppercase tracking-[0.2em] text-[#454c59]"
                style={{ fontFamily: MONO }}
              >
                Detail view · Extended record pending
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- بطاقة مشروع ---------------- */

function ProjectRow({
  p,
  index,
  onOpen,
}: {
  p: Snapshot;
  index: number;
  onOpen: () => void;
}) {
  const done = p.status === "COMPLETED";
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 12) * 0.055,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -2.5 }}
      className="group relative w-full overflow-hidden rounded-xl border border-white/[0.07] px-3.5 py-3 text-left transition-all duration-400 hover:border-white/[0.2]"
      style={{
        background:
          "linear-gradient(120deg, rgba(15,18,25,0.9) 0%, rgba(9,11,16,0.95) 100%)",
      }}
    >
      {/* توهج خفيف عند التحويم */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(120% 100% at 0% 50%, rgba(255,255,255,0.055), transparent 62%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      />

      <div className="relative flex items-center gap-3.5">
        <ConceptThumb
          seed={p.id}
          className="h-11 w-11 shrink-0 rounded-md sm:h-12 sm:w-12"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              className="text-[0.46rem] tracking-[0.22em] text-[#69717f]"
              style={{ fontFamily: MONO }}
            >
              {p.id}
            </span>
            <span
              className="truncate text-[0.85rem] uppercase tracking-[0.14em] text-[#eaeef5] transition-colors group-hover:text-white"
              style={{ fontFamily: LUX }}
            >
              {p.name}
            </span>
            {p.isNew && (
              <span
                className="rounded-sm border border-white/15 px-1.5 py-px text-[0.38rem] tracking-[0.16em] text-[#9aa3b1]"
                style={{ fontFamily: MONO }}
              >
                NEW
              </span>
            )}
          </div>

          <div
            className="mt-0.5 text-[0.46rem] uppercase tracking-[0.18em] text-[#7a8391]"
            style={{ fontFamily: MONO }}
          >
            {p.category}
          </div>

          <p className="mt-1.5 line-clamp-1 text-[0.66rem] leading-relaxed text-[#8d96a4]">
            {p.description}
          </p>

          {/* شريط التقدّم */}
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-white/[0.08]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p.completion}%` }}
                transition={{
                  duration: 1.2,
                  delay: 0.25 + Math.min(index, 12) * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="h-px"
                style={{
                  background: done
                    ? "linear-gradient(90deg, rgba(255,255,255,0.6), #ffffff)"
                    : "linear-gradient(90deg, rgba(190,199,212,0.5), rgba(233,238,245,0.95))",
                  boxShadow: done
                    ? "0 0 9px rgba(255,255,255,0.85)"
                    : "0 0 6px rgba(255,255,255,0.45)",
                }}
              />
            </div>
            <span
              className="shrink-0 tabular-nums text-[0.55rem] tracking-[0.1em] text-[#c2cad6]"
              style={{ fontFamily: MONO }}
            >
              {p.completion}%
            </span>
          </div>
        </div>

        {/* العمود الأيمن */}
        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          <span
            className="text-[0.42rem] uppercase tracking-[0.18em] text-[#5f6875]"
            style={{ fontFamily: MONO }}
          >
            Started {p.started.slice(0, 3)}
          </span>
          <span
            className={[
              "rounded-sm border px-2 py-0.5 text-[0.42rem] uppercase tracking-[0.2em]",
              done
                ? "border-white/30 text-white"
                : "border-white/10 text-[#8d96a4]",
            ].join(" ")}
            style={{
              fontFamily: MONO,
              textShadow: done ? "0 0 9px rgba(255,255,255,0.55)" : undefined,
            }}
          >
            {p.status}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ---------------- عناصر مساعدة ---------------- */

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[0.46rem] uppercase tracking-[0.22em] text-[#5f6875]"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
      <span
        className={[
          "tabular-nums text-[0.9rem]",
          muted ? "text-[#5f6875]" : "text-[#eaeef5]",
        ].join(" ")}
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

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
      <div
        className="text-[0.42rem] uppercase tracking-[0.18em] text-[#5f6875]"
        style={{ fontFamily: MONO }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-[0.68rem] uppercase tracking-[0.1em] text-[#dfe4ec]"
        style={{ fontFamily: MONO }}
      >
        {value}
      </div>
    </div>
  );
}
