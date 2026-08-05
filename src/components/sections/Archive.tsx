"use client";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Lock } from "lucide-react";
import FileStack, { type StackItem } from "@/components/archive/FileStack";
import {
  FileFace, PasswordGate, Breadcrumb, MONO, LUX,
} from "@/components/archive/ArchiveParts";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { play } from "@/lib/sound";
import {
  VAULTS, ARCHIVE_YEARS, MONTH_KEYS, monthAr, monthHasRecords,
  recordsFor, yearVolume, type Vault, type ArchiveRecord,
} from "@/lib/archive-registry";
import type { AppData } from "@/lib/types";

type Level = "vaults" | "years" | "months" | "records" | "detail";

export default function ArchiveSection(_props: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const Back = ar ? ArrowRight : ArrowLeft;

  const [level, setLevel] = useState<Level>("vaults");
  const [year, setYear] = useState<number>(ARCHIVE_YEARS[0]);
  const [month, setMonth] = useState(0);
  const [gate, setGate] = useState<Vault | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  /* موضع المؤشّر في كل مستوى — يُستعاد عند الرجوع */
  const [posVault, setPosVault] = useState(0);
  const [posYear, setPosYear] = useState(0);
  const [posMonth, setPosMonth] = useState(0);
  const [posRecord, setPosRecord] = useState(0);
  /* آخر موضع لكل شهر على حدة */
  const memory = useRef<Map<string, number>>(new Map());

  const months = useMemo(
    () => MONTH_KEYS.map((m, i) => ({ name: m, index: i })).filter((m) => monthHasRecords(year, m.index)),
    [year]
  );
  const records = useMemo(() => recordsFor(year, month), [year, month]);
  const record = records[posRecord];

  const monthLabel = (i: number) => (ar ? monthAr(i) : MONTH_KEYS[i]);

  /* ---------- المسار ---------- */
  const crumbs = useMemo(() => {
    const c: { label: string; onClick?: () => void }[] = [
      { label: t("ar.root", lang), onClick: () => setLevel("vaults") },
    ];
    if (level !== "vaults") {
      c.push({ label: t("ar.projects", lang), onClick: () => setLevel("years") });
    }
    if (level === "months" || level === "records" || level === "detail") {
      c.push({ label: String(year), onClick: () => setLevel("months") });
    }
    if (level === "records" || level === "detail") {
      c.push({ label: monthLabel(month), onClick: () => setLevel("records") });
    }
    if (level === "detail" && record) {
      c.push({ label: `${t("ar.record", lang)} ${String(record.seq).padStart(3, "0")}` });
    }
    return c;
  }, [level, year, month, record, lang, ar]);

  /* ---------- بطاقات كل مستوى ---------- */

  const vaultItems: StackItem[] = VAULTS.map((v) => {
    const open = !v.locked || unlocked.has(v.key);
    return {
      id: v.key,
      node: (
        <FileFace
          ref_={ar ? v.codeAr : v.codeEn}
          eyebrow={open ? t("ar.available", lang) : t("ar.sealed", lang)}
          title={ar ? v.titleAr : v.titleEn}
          sub={ar ? v.descAr : v.descEn}
          locked={!open}
          accent={!open}
          meta={[
            { label: t("ar.volume", lang), value: String(v.volume) },
            { label: t("ar.grade", lang), value: ar ? v.gradeAr : v.gradeEn },
            { label: t("ar.state", lang), value: open ? t("ar.open", lang) : t("ar.locked", lang) },
          ]}
          footer={t("ar.registerFooter", lang)}
          onOpen={() => {
            if (open) {
              if (v.key === "projects") { setLevel("years"); play("open"); }
            } else {
              setGate(v);
              play("click");
            }
          }}
        />
      ),
    };
  });

  const yearItems: StackItem[] = ARCHIVE_YEARS.map((y) => ({
    id: String(y),
    node: (
      <FileFace
        ref_={`ARC-P/${y}`}
        eyebrow={t("ar.yearVolume", lang)}
        title={String(y)}
        sub={t("ar.yearDesc", lang)}
        meta={[
          { label: t("ar.records", lang), value: String(yearVolume(y)) },
          { label: t("ar.months", lang), value: y === 2026 ? "08" : "12" },
          { label: t("ar.state", lang), value: y === 2026 ? t("ar.current", lang) : t("ar.closed", lang) },
        ]}
        footer={t("ar.registerFooter", lang)}
        onOpen={() => {
          setYear(y);
          setLevel("months");
          play("open");
        }}
      />
    ),
  }));

  const monthItems: StackItem[] = months.map((m) => {
    const count = recordsFor(year, m.index).length;
    return {
      id: `${year}-${m.index}`,
      node: (
        <FileFace
          ref_={`ARC-P/${year}/${String(m.index + 1).padStart(2, "0")}`}
          eyebrow={String(year)}
          title={monthLabel(m.index)}
          sub={t("ar.monthDesc", lang)}
          meta={[
            { label: t("ar.records", lang), value: String(count).padStart(2, "0") },
            { label: t("ar.period", lang), value: `${String(m.index + 1).padStart(2, "0")}/${year}` },
            { label: t("ar.state", lang), value: t("ar.filed", lang) },
          ]}
          footer={t("ar.registerFooter", lang)}
          onOpen={() => {
            setMonth(m.index);
            /* استعادة آخر موضع في هذا الشهر */
            setPosRecord(memory.current.get(`${year}-${m.index}`) ?? 0);
            setLevel("records");
            play("open");
          }}
        />
      ),
    };
  });

  const recordItems: StackItem[] = records.map((r) => ({
    id: r.ref,
    node: (
      <FileFace
        ref_={r.ref}
        eyebrow={ar ? r.categoryAr : r.categoryEn}
        title={ar ? r.titleAr : r.titleEn}
        sub={ar ? r.abstractAr : r.abstractEn}
        accent={r.gradeEn === "Sealed"}
        meta={[
          { label: t("ar.grade", lang), value: ar ? r.gradeAr : r.gradeEn },
          { label: t("ar.custodian", lang), value: ar ? r.custodianAr : r.custodianEn },
          { label: t("ar.pages", lang), value: String(r.pages) },
        ]}
        footer={`${t("ar.hash", lang)} ${r.hash}`}
        onOpen={() => {
          setLevel("detail");
          play("open");
        }}
      />
    ),
  }));

  /* ---------- الرجوع مستوى واحد ---------- */
  const up = () => {
    play("click");
    if (level === "detail") setLevel("records");
    else if (level === "records") {
      memory.current.set(`${year}-${month}`, posRecord);
      setLevel("months");
    } else if (level === "months") setLevel("years");
    else if (level === "years") setLevel("vaults");
  };

  const heading =
    level === "vaults" ? t("ar.title", lang)
    : level === "years" ? t("ar.projects", lang)
    : level === "months" ? String(year)
    : level === "records" ? monthLabel(month)
    : record ? (ar ? record.titleAr : record.titleEn) : "";

  return (
    <div className="w-full" dir={ar ? "rtl" : "ltr"}>
      {/* ═══════ الترويسة ═══════ */}
      <header className="mb-6 border-b border-white/[0.06] pb-4">
        <Breadcrumb crumbs={crumbs} isAr={ar} />

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            {level !== "vaults" && (
              <button
                type="button"
                onClick={up}
                aria-label={t("ar.up", lang)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.10] text-[#98a2b1] transition-colors hover:border-white/30 hover:text-white"
              >
                <Back size={13} />
              </button>
            )}
            <h2
              className="text-[clamp(1.15rem,2.6vw,1.7rem)] font-light uppercase tracking-[0.22em] text-[#eaeef5]"
              style={{ fontFamily: LUX }}
            >
              {heading}
            </h2>
          </div>

          <span
            className="text-[0.44rem] uppercase tracking-[0.24em] text-[#5d6675]"
            style={{ fontFamily: MONO }}
          >
            {t("ar.eyebrow", lang)}
          </span>
        </div>
      </header>

      {/* ═══════ المستويات ═══════ */}
      <>
        {level === "vaults" && (
          <Layer key="vaults" hint={t("ar.hintVaults", lang)}>
            <FileStack
              key="stack-vaults"
              items={vaultItems} index={posVault} onIndex={setPosVault} isAr={ar}
              labelPrev={t("ar.prev", lang)} labelNext={t("ar.next", lang)}
            />
          </Layer>
        )}

        {level === "years" && (
          <Layer key="years" hint={t("ar.hintYears", lang)}>
            <FileStack
              key="stack-years"
              items={yearItems} index={posYear} onIndex={setPosYear} isAr={ar}
              labelPrev={t("ar.prev", lang)} labelNext={t("ar.next", lang)}
            />
          </Layer>
        )}

        {level === "months" && (
          <Layer key="months" hint={t("ar.hintMonths", lang)}>
            <FileStack
              key={`stack-months-${year}`}
              items={monthItems} index={posMonth} onIndex={setPosMonth} isAr={ar}
              labelPrev={t("ar.prev", lang)} labelNext={t("ar.next", lang)}
            />
          </Layer>
        )}

        {level === "records" && (
          <Layer key="records" hint={t("ar.hintRecords", lang)}>
            <FileStack
              key={`stack-records-${year}-${month}`}
              items={recordItems}
              index={posRecord}
              onIndex={(i) => {
                setPosRecord(i);
                memory.current.set(`${year}-${month}`, i);
              }}
              isAr={ar}
              labelPrev={t("ar.prev", lang)} labelNext={t("ar.next", lang)}
            />
          </Layer>
        )}

        {level === "detail" && record && (
          <Detail key={record.ref} r={record} ar={ar} lang={lang} onBack={up} />
        )}
      </>

      {/* ═══════ بوابة كلمة المرور ═══════ */}
      <AnimatePresence>
        {gate && (
          <PasswordGate
            vaultTitle={ar ? gate.titleAr : gate.titleEn}
            onClose={() => setGate(null)}
            onGranted={() => {
              setUnlocked((s) => new Set(s).add(gate.key));
              setGate(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- غلاف مستوى ---------- */

function Layer({ children, hint }: { children: React.ReactNode; hint: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
      <p
        className="mt-5 text-center text-[0.42rem] uppercase tracking-[0.24em] text-[#454c59]"
        style={{ fontFamily: MONO }}
      >
        {hint}
      </p>
    </motion.div>
  );
}

/* ---------- صفحة السجلّ ---------- */

function Detail({
  r, ar, lang, onBack,
}: {
  r: ArchiveRecord;
  ar: boolean;
  lang: "en" | "ar";
  onBack: () => void;
}) {
  const entries = ar ? r.entriesAr : r.entriesEn;
  const chain = ar ? r.chainAr : r.chainEn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-5xl"
    >
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
                style={{
                  fontFamily: MONO,
                  borderColor: "rgba(196,72,72,0.5)",
                  color: "#e0a2a2",
                  background: "rgba(196,72,72,0.1)",
                }}
              >
                {r.ref}
              </span>
              <span
                className="rounded-sm border border-white/12 px-2 py-0.5 text-[0.42rem] uppercase tracking-[0.18em] text-[#9aa3b1]"
                style={{ fontFamily: MONO }}
              >
                {ar ? r.gradeAr : r.gradeEn}
              </span>
            </div>

            <h3
              className="mt-3 text-[clamp(1.2rem,3vw,1.9rem)] font-light uppercase tracking-[0.12em] text-white"
              style={{ fontFamily: LUX, textShadow: "0 0 20px rgba(255,255,255,0.2)" }}
            >
              {ar ? r.titleAr : r.titleEn}
            </h3>
            <p
              className="mt-1.5 text-[0.5rem] uppercase tracking-[0.2em] text-[#8e97a5]"
              style={{ fontFamily: MONO }}
            >
              {ar ? r.categoryAr : r.categoryEn}
            </p>
          </div>

          <FileText size={20} className="shrink-0 text-white/15" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact label={t("ar.custodian", lang)} value={ar ? r.custodianAr : r.custodianEn} />
          <Fact label={t("ar.pages", lang)} value={String(r.pages)} />
          <Fact label={t("ar.state", lang)} value={ar ? r.statusAr : r.statusEn} />
          <Fact label={t("ar.hash", lang)} value={r.hash} />
        </div>
      </div>

      {/* المتن */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title={t("ar.abstract", lang)}>
            <p className="text-[0.84rem] leading-[1.85] text-[#a9b2c0]">
              {ar ? r.abstractAr : r.abstractEn}
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
                    <span
                      className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full"
                      style={{ background: "rgba(196,72,72,0.75)" }}
                    />
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
                  <span
                    className="w-[68px] shrink-0 pt-0.5 text-[0.42rem] uppercase tracking-[0.14em] text-[#6a7280]"
                    style={{ fontFamily: MONO }}
                  >
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

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-[0.52rem] uppercase tracking-[0.26em] text-[#6d7684] transition-colors hover:text-white"
          style={{ fontFamily: MONO }}
        >
          {t("ar.backRecords", lang)}
        </button>
      </div>
    </motion.div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border border-white/[0.07] p-5"
      style={{ background: "linear-gradient(160deg, #0f1219 0%, #080a0f 100%)" }}
    >
      <h4
        className="mb-4 text-[0.44rem] uppercase tracking-[0.28em] text-[#6a7280]"
        style={{ fontFamily: MONO }}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
      <div
        className="text-[0.4rem] uppercase tracking-[0.18em] text-[#5f6875]"
        style={{ fontFamily: MONO }}
      >
        {label}
      </div>
      <div
        className="mt-1 truncate text-[0.74rem] text-[#dfe4ec]"
        style={{ fontFamily: MONO }}
      >
        {value}
      </div>
    </div>
  );
}
