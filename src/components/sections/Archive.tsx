"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight, ChevronLeft, FileText, Folder, Search, ShieldAlert, Lock, ArrowRight, ArrowLeft,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { play } from "@/lib/sound";
import {
  ARCHIVE_YEARS, MONTH_KEYS, monthAr, monthHasRecords, recordsFor, yearVolume,
  type ArchiveRecord,
} from "@/lib/archive-registry";
import type { AppData } from "@/lib/types";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

/* حالة الملف المشتقّة من التصنيف: مفتوح / مقفل / سري */
type FileMode = "open" | "locked" | "secret";
const MODE_OF_GRADE: Record<string, FileMode> = {
  Internal: "open",
  Restricted: "locked",
  Confidential: "secret",
  Sealed: "secret",
  "Pillars Only": "secret",
};
const modeOf = (gradeEn: string): FileMode => MODE_OF_GRADE[gradeEn] ?? "locked";

const STATUS_TONE: Record<FileMode, { dot: string; text: string; chip: string }> = {
  open:   { dot: "#3fa878", text: "#7fd6a9", chip: "rgba(63,168,120,0.14)" },
  locked: { dot: "#b98a3f", text: "#d3ad6b", chip: "rgba(185,138,63,0.14)" },
  secret: { dot: "#b5554d", text: "#d68f88", chip: "rgba(181,85,77,0.14)" },
};

interface ArcFile {
  rec: ArchiveRecord;
  year: number;
  month: number;
  day: number;
  dateKey: string; // yyyymmdd — للترتيب
  date: string;    // للعرض
  dateAr: string;
}

/* يولّد كل ملفات الأرشيف لكل السنوات (2013 → 2026) مرة واحدة */
function buildAllFiles(ar: boolean): ArcFile[] {
  const out: ArcFile[] = [];
  for (const y of ARCHIVE_YEARS) {
    for (let m = 0; m < 12; m++) {
      if (!monthHasRecords(y, m)) continue;
      recordsFor(y, m).forEach((rec) => {
        const day = 1 + ((rec.seq * 13 + m * 7 + y) % 27);
        const mm = String(m + 1).padStart(2, "0");
        const enDate = `${String(day).padStart(2, "0")} ${MONTH_KEYS[m].slice(0, 3)} ${y}`;
        const arDate = `${String(day).padStart(2, "0")} ${monthAr(m)} ${y}`;
        out.push({
          rec, year: y, month: m, day,
          dateKey: `${y}${mm}${String(day).padStart(2, "0")}`,
          date: enDate,
          dateAr: arDate,
        });
      });
    }
  }
  return out;
}

export default function ArchiveSection(_props: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const Chevron = ar ? ChevronLeft : ChevronRight;

  const [year, setYear] = useState<number>(ARCHIVE_YEARS[0]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [openRec, setOpenRec] = useState<ArchiveRecord | null>(null);

  /* بيانات كل السنوات + كل الملفات (محسوبة مرة واحدة) */
  const allFiles = useMemo(() => buildAllFiles(ar), [ar]);
  const yearCounts = useMemo(
    () => new Map(ARCHIVE_YEARS.map((y) => [y, yearVolume(y)])),
    []
  );

  /* إحصائيات الرأس */
  const stats = useMemo(() => {
    const total = allFiles.length;
    const secret = allFiles.filter((f) => modeOf(f.rec.gradeEn) === "secret").length;
    const archived = allFiles.filter((f) => f.year < ARCHIVE_YEARS[0]).length;
    const latest = allFiles.reduce<ArcFile | null>((acc, f) =>
      (acc === null || f.dateKey > acc.dateKey ? f : acc), null);
    return {
      total, secret, archived,
      last: latest ? (ar ? latest.dateAr : latest.date) : "—",
    };
  }, [allFiles, ar]);

  /* تصنيفات (درجات) فريدة */
  const grades = useMemo(() => {
    const s = new Set<string>();
    allFiles.forEach((f) => s.add(f.rec.gradeEn));
    return Array.from(s);
  }, [allFiles]);

  /* الملفات المعروضة للسنة المحددة + البحث + الفلترة */
  const files = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFiles
      .filter((f) => f.year === year)
      .filter((f) => {
        if (!q) return true;
        const name = (ar ? f.rec.titleAr : f.rec.titleEn).toLowerCase();
        const ref = f.rec.ref.toLowerCase();
        return name.includes(q) || ref.includes(q);
      })
      .filter((f) => (cat === "all" ? true : f.rec.gradeEn === cat))
      .filter((f) => (status === "all" ? true : modeOf(f.rec.gradeEn) === status))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [allFiles, year, query, cat, status, ar]);

  const stLabel = (mode: FileMode) =>
    mode === "open" ? t("ar.open", lang) : mode === "locked" ? t("ar.locked", lang) : t("ar.secret", lang);

  const clearFilters = () => { setQuery(""); setCat("all"); setStatus("all"); play("click"); };

  /* ---------- صفحة التفاصيل ---------- */
  if (openRec) {
    return (
      <ArchiveDetail rec={openRec} ar={ar} lang={lang} onBack={() => { setOpenRec(null); play("click"); }} />
    );
  }

  return (
    <div className="w-full" dir={ar ? "rtl" : "ltr"}>
      {/* ═══════ الترويسة ═══════ */}
      <header className="mb-6 border-b border-white/[0.06] pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              className="eyebrow text-[0.5rem] uppercase tracking-[0.28em] text-[#5d6675]"
              style={{ fontFamily: MONO }}
            >
              {t("ar.eyebrow", lang)}
            </div>
            <h2
              className="mt-2 text-[clamp(1.25rem,3vw,2rem)] font-light uppercase tracking-[0.18em] text-[#eaeef5]"
              style={{ fontFamily: LUX }}
            >
              {t("ar.title", lang)}
            </h2>
          </div>
          <span
            className="text-[0.44rem] uppercase tracking-[0.24em] text-[#5d6675]"
            style={{ fontFamily: MONO }}
          >
            {t("ar.registerFooter", lang)}
          </span>
        </div>

        {/* ═══════ الإحصائيات ═══════ */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("ar.total", lang)} value={String(stats.total)} />
          <Stat label={t("ar.secretCount", lang)} value={String(stats.secret)} accent="#b5554d" />
          <Stat label={t("ar.archivedCount", lang)} value={String(stats.archived)} />
          <Stat label={t("ar.lastUpdate", lang)} value={stats.last} />
        </div>
      </header>

      {/* ═══════ شريط البحث + الفلترة ═══════ */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#5d6675]" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); play("click"); }}
            placeholder={t("ar.searchPh", lang)}
            className="w-full rounded-lg border border-white/[0.07] bg-[#0a0b0e] py-2.5 pe-10 ps-9 text-[0.8rem] text-[#dfe4ec] outline-none transition-colors placeholder:text-[#4a515d] focus:border-white/20"
            style={{ fontFamily: MONO }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#5d6675] transition-colors hover:text-white"
              aria-label={t("ar.clear", lang)}
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <Select
            value={cat}
            onChange={setCat}
            label={t("ar.classification", lang)}
            options={[{ value: "all", label: t("ar.all", lang) }].concat(
              grades.map((g) => ({ value: g, label: ar ? gradeAr(g) : g }))
            )}
          />
          <Select
            value={status}
            onChange={setStatus}
            label={t("ar.status", lang)}
            options={[
              { value: "all", label: t("ar.all", lang) },
              { value: "open", label: t("ar.open", lang) },
              { value: "locked", label: t("ar.locked", lang) },
              { value: "secret", label: t("ar.secret", lang) },
            ]}
          />
        </div>
      </div>

      {/* ═══════ السنوات + الملفات ═══════ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_1fr]">
        {/* ─── قائمة السنوات (جانبية) ─── */}
        <aside
          className="rounded-xl border border-white/[0.06] p-3"
          style={{ background: "linear-gradient(165deg,#0d0f13 0%,#08090c 100%)" }}
        >
          <div
            className="mb-2 flex items-center gap-2 px-2 py-1 text-[0.46rem] uppercase tracking-[0.24em] text-[#6b7383]"
            style={{ fontFamily: MONO }}
          >
            <Folder size={12} /> {t("ar.folders", lang)}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {ARCHIVE_YEARS.map((y) => {
              const on = y === year;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => { setYear(y); setCat("all"); setStatus("all"); play("open"); }}
                  className="group relative flex shrink-0 items-center justify-between gap-2 rounded-md border px-3 py-2 transition-all duration-200 lg:w-full"
                  style={{
                    fontFamily: MONO,
                    borderColor: on ? "rgba(126,176,216,0.45)" : "rgba(255,255,255,0.05)",
                    background: on ? "rgba(126,176,216,0.10)" : "transparent",
                  }}
                >
                  <span
                    className="text-[0.86rem] tracking-wider transition-colors"
                    style={{ color: on ? "#eaeef5" : "#7a8291", textShadow: on ? "0 0 14px rgba(126,176,216,0.5)" : "none" }}
                  >
                    {y}
                  </span>
                  <span
                    className="rounded border px-1.5 py-0.5 text-[0.52rem] transition-colors"
                    style={{
                      borderColor: on ? "rgba(126,176,216,0.35)" : "rgba(255,255,255,0.08)",
                      color: on ? "#c3c9d3" : "#5d6675",
                    }}
                  >
                    {yearCounts.get(y) ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ─── مساحة الملفات الرئيسية ─── */}
        <div
          className="min-w-0 rounded-xl border border-white/[0.06]"
          style={{ background: "linear-gradient(165deg,#0d0f13 0%,#08090c 100%)" }}
        >
          {/* رأس السنة */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="rounded-md border border-white/[0.10] bg-black/25 px-3 py-1 text-[0.9rem] text-[#eaeef5]"
                style={{ fontFamily: MONO }}
              >
                {year}
              </span>
              <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[#6b7383]" style={{ fontFamily: MONO }}>
                {files.length} {t("ar.files", lang)}
              </span>
            </div>
            {(query || cat !== "all" || status !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[0.52rem] uppercase tracking-[0.22em] text-[#7a8291] transition-colors hover:text-white"
                style={{ fontFamily: MONO }}
              >
                {t("ar.clear", lang)}
              </button>
            )}
          </div>

          <div className="p-3">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <ShieldAlert size={22} className="text-[#4a515d]" />
                <p className="text-[0.72rem] text-[#6b7383]" style={{ fontFamily: MONO }}>
                  {t("ar.empty", lang)}
                </p>
              </div>
            ) : (
              <>
                {/* عرض الكمبيوتر (جدول) */}
                <div className="hidden md:block">
                  <div
                    className="grid grid-cols-[1.5fr_0.9fr_1fr_1.1fr_0.9fr_0.8fr] gap-3 border-b border-white/[0.06] px-3 pb-2 text-[0.46rem] uppercase tracking-[0.18em] text-[#5d6675]"
                    style={{ fontFamily: MONO }}
                  >
                    <span>{t("ar.name", lang)}</span>
                    <span>{t("ar.type", lang)}</span>
                    <span>{t("ar.added", lang)}</span>
                    <span>{t("ar.number", lang)}</span>
                    <span>{t("ar.classification", lang)}</span>
                    <span>{t("ar.status", lang)}</span>
                  </div>
                  <AnimatePresence initial={false}>
                    {files.map((f) => {
                      const mode = modeOf(f.rec.gradeEn);
                      const tone = STATUS_TONE[mode];
                      return (
                        <motion.button
                          key={f.rec.ref}
                          type="button"
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          onClick={() => { setOpenRec(f.rec); play("open"); }}
                          className="group grid w-full grid-cols-[1.5fr_0.9fr_1fr_1.1fr_0.9fr_0.8fr] items-center gap-3 border-b border-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                          style={{ textAlign: ar ? "right" : "left" }}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
                              style={{ borderColor: "rgba(126,176,216,0.25)", background: "rgba(126,176,216,0.07)" }}
                            >
                              <FileText size={13} className="text-[#9aa3b2]" />
                            </span>
                            <span className="truncate text-[0.78rem] text-[#e7ebf1]">
                              {ar ? f.rec.titleAr : f.rec.titleEn}
                            </span>
                          </span>
                          <span className="truncate text-[0.66rem] text-[#8d96a4]">
                            {ar ? f.rec.categoryAr : f.rec.categoryEn}
                          </span>
                          <span className="text-[0.66rem] text-[#8d96a4]" style={{ fontFamily: MONO }}>
                            {ar ? f.dateAr : f.date}
                          </span>
                          <span className="truncate text-[0.62rem] text-[#6b7383]" style={{ fontFamily: MONO }}>
                            {f.rec.ref}
                          </span>
                          <span className="truncate text-[0.66rem] text-[#a9b2c0]">
                            {ar ? f.rec.gradeAr : f.rec.gradeEn}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot, boxShadow: `0 0 6px ${tone.dot}` }} />
                            <span className="text-[0.64rem]" style={{ color: tone.text }}>{stLabel(mode)}</span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* عرض الجوال (بطاقات مكدّسة) */}
                <div className="space-y-2 md:hidden">
                  <AnimatePresence initial={false}>
                    {files.map((f) => {
                      const mode = modeOf(f.rec.gradeEn);
                      const tone = STATUS_TONE[mode];
                      return (
                        <motion.button
                          key={f.rec.ref}
                          type="button"
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          onClick={() => { setOpenRec(f.rec); play("open"); }}
                          className="w-full rounded-lg border border-white/[0.06] bg-black/20 p-3 text-left transition-colors hover:border-white/15"
                          style={{ textAlign: ar ? "right" : "left" }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                              style={{ borderColor: "rgba(126,176,216,0.25)", background: "rgba(126,176,216,0.07)" }}
                            >
                              <FileText size={14} className="text-[#9aa3b2]" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-[0.82rem] text-[#e7ebf1]">
                                  {ar ? f.rec.titleAr : f.rec.titleEn}
                                </span>
                                <Chevron size={14} className="shrink-0 text-[#4a515d]" />
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] text-[#6b7383]" style={{ fontFamily: MONO }}>
                                <span>{ar ? f.rec.categoryAr : f.rec.categoryEn}</span>
                                <span>{ar ? f.dateAr : f.date}</span>
                                <span className="truncate">{f.rec.ref}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-2.5">
                            <span
                              className="rounded border px-2 py-0.5 text-[0.58rem]"
                              style={{ borderColor: "rgba(126,176,216,0.25)", color: "#a9b2c0" }}
                            >
                              {ar ? f.rec.gradeAr : f.rec.gradeEn}
                            </span>
                            <span
                              className="rounded px-2 py-0.5 text-[0.58rem]"
                              style={{ background: tone.chip, color: tone.text, border: `1px solid ${tone.dot}33` }}
                            >
                              {stLabel(mode)}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- عناصر مساعدة ---------- */

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-xl border border-white/[0.06] px-4 py-3"
      style={{ background: "linear-gradient(160deg,#0f1219 0%,#08090c 100%)" }}
    >
      <div
        className="text-[0.44rem] uppercase tracking-[0.2em] text-[#5f6875]"
        style={{ fontFamily: MONO }}
      >
        {label}
      </div>
      <div
        className="mt-1.5 text-[clamp(1rem,2vw,1.35rem)] font-medium"
        style={{ fontFamily: MONO, color: accent ?? "#eaeef5" }}
      >
        {value}
      </div>
    </div>
  );
}

function Select({
  value, onChange, label, options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => { onChange(e.target.value); play("click"); }}
        aria-label={label}
        className="appearance-none rounded-lg border border-white/[0.07] bg-[#0a0b0e] py-2.5 pe-9 ps-3 text-[0.7rem] text-[#c3c9d3] outline-none transition-colors focus:border-white/20"
        style={{ fontFamily: MONO }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0d0f13] text-[#dfe4ec]">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[#5d6675]">▾</span>
    </div>
  );
}

/* اسم التصنيف بالعربية لكل درجة */
function gradeAr(en: string): string {
  switch (en) {
    case "Internal": return "داخلي";
    case "Restricted": return "محدود";
    case "Confidential": return "سرّي";
    case "Sealed": return "مختوم";
    case "Pillars Only": return "للأعمدة فقط";
    default: return en;
  }
}

/* ---------- صفحة تفاصيل الملف ---------- */
function ArchiveDetail({
  rec, ar, lang, onBack,
}: {
  rec: ArchiveRecord;
  ar: boolean;
  lang: "en" | "ar";
  onBack: () => void;
}) {
  const Back = ar ? ArrowRight : ArrowLeft;
  const entries = ar ? rec.entriesAr : rec.entriesEn;
  const chain = ar ? rec.chainAr : rec.chainEn;

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-5xl"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[0.52rem] uppercase tracking-[0.26em] text-[#6d7684] transition-colors hover:text-white"
          style={{ fontFamily: MONO }}
        >
          <Back size={13} /> {t("ar.backToArchive", lang)}
        </button>
      </div>

      {/* رأس السجلّ */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-7"
        style={{
          borderColor: "rgba(196,72,72,0.28)",
          background: "linear-gradient(158deg, #12151c 0%, #080a0e 100%)",
          boxShadow: "0 0 40px rgba(196,72,72,0.05) inset",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="rounded-sm border px-2 py-0.5 text-[0.42rem] uppercase tracking-[0.2em]"
                style={{ fontFamily: MONO, borderColor: "rgba(196,72,72,0.5)", color: "#e0a2a2", background: "rgba(196,72,72,0.1)" }}
              >
                {rec.ref}
              </span>
              <span
                className="rounded-sm border border-white/12 px-2 py-0.5 text-[0.42rem] uppercase tracking-[0.18em] text-[#9aa3b1]"
                style={{ fontFamily: MONO }}
              >
                {ar ? rec.gradeAr : rec.gradeEn}
              </span>
            </div>

            <h3
              className="mt-3 text-[clamp(1.2rem,3vw,1.9rem)] font-light uppercase tracking-[0.12em] text-white"
              style={{ fontFamily: LUX, textShadow: "0 0 20px rgba(255,255,255,0.2)" }}
            >
              {ar ? rec.titleAr : rec.titleEn}
            </h3>
            <p className="mt-1.5 text-[0.5rem] uppercase tracking-[0.2em] text-[#8e97a5]" style={{ fontFamily: MONO }}>
              {ar ? rec.categoryAr : rec.categoryEn}
            </p>
          </div>

          <FileText size={20} className="shrink-0 text-white/15" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact label={t("ar.custodian", lang)} value={ar ? rec.custodianAr : rec.custodianEn} />
          <Fact label={t("ar.pages", lang)} value={String(rec.pages)} />
          <Fact label={t("ar.state", lang)} value={ar ? rec.statusAr : rec.statusEn} />
          <Fact label={t("ar.hash", lang)} value={rec.hash} />
        </div>
      </div>

      {/* المتن */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title={t("ar.abstract", lang)}>
            <p className="text-[0.84rem] leading-[1.85] text-[#a9b2c0]">
              {ar ? rec.abstractAr : rec.abstractEn}
            </p>
          </Panel>

          <div className="mt-5">
            <Panel title={t("ar.entries", lang)}>
              <ul className="space-y-2.5">
                {entries.map((e, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: ar ? 8 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.06, duration: 0.4 }}
                    className="flex items-start gap-3 text-[0.78rem] text-[#a9b2c0]"
                  >
                    <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full" style={{ background: "rgba(196,72,72,0.75)" }} />
                    {e}
                  </motion.li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <div>
          <Panel title={t("ar.chain", lang)}>
            <div className="space-y-4">
              {chain.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-[68px] shrink-0 pt-0.5 text-[0.42rem] uppercase tracking-[0.14em] text-[#6a7280]" style={{ fontFamily: MONO }}>
                    {c.stamp}
                  </span>
                  <p className="text-[0.72rem] leading-relaxed text-[#a0a9b7]">{c.text}</p>
                </div>
              ))}
            </div>
          </Panel>

          <div className="mt-5">
            <Panel title={t("ar.access", lang)}>
              <div className="flex items-center gap-2.5 text-[0.72rem] text-[#8d96a4]">
                <Lock size={11} className="text-[#c46a6a]" />
                {t("ar.accessNote", lang)}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] p-5" style={{ background: "linear-gradient(160deg, #0f1219 0%, #080a0f 100%)" }}>
      <h4 className="mb-4 text-[0.44rem] uppercase tracking-[0.28em] text-[#6a7280]" style={{ fontFamily: MONO }}>
        {title}
      </h4>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
      <div className="text-[0.4rem] uppercase tracking-[0.18em] text-[#5f6875]" style={{ fontFamily: MONO }}>
        {label}
      </div>
      <div className="mt-1 truncate text-[0.74rem] text-[#dfe4ec]" style={{ fontFamily: MONO }}>
        {value}
      </div>
    </div>
  );
}
