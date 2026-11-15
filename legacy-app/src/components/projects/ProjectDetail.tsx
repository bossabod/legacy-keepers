"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, Users, Wallet, Clock } from "lucide-react";
import ConceptThumb from "./ConceptThumb";
import { JoinForm, ContactForm, ClubButton } from "./ProjectForms";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import type { Snapshot } from "@/lib/projects-registry";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

export default function ProjectDetail({
  p,
  onBack,
  onOpenMessages,
}: {
  p: Snapshot;
  onBack: () => void;
  onOpenMessages?: () => void;
}) {
  const { lang, currency } = useApp();
  const ar = lang === "ar";
  const [join, setJoin] = useState(false);
  const [contact, setContact] = useState(false);

  const Back = ar ? ArrowRight : ArrowLeft;
  const name = ar ? p.nameAr : p.nameEn;
  const positions = ar ? p.positionsAr : p.positionsEn;
  const objectives = ar ? p.objectivesAr : p.objectivesEn;
  const requirements = ar ? p.requirementsAr : p.requirementsEn;
  const updates = ar ? p.updatesAr : p.updatesEn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      dir={ar ? "rtl" : "ltr"}
    >
      <button
        type="button"
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-[0.55rem] uppercase tracking-[0.24em] text-[#6d7684] transition-colors hover:text-white"
        style={{ fontFamily: MONO }}
      >
        <Back size={12} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
        {t("pj.back", lang)}
      </button>

      {/* ===== الترويسة ===== */}
      <header
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 sm:p-7"
        style={{
          background:
            "linear-gradient(150deg, rgba(18,21,29,0.94) 0%, rgba(9,11,16,0.97) 100%)",
        }}
      >
        <ConceptThumb
          seed={p.id}
          className="pointer-events-none absolute -end-8 -top-8 h-56 w-56 opacity-[0.10]"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="text-[0.48rem] tracking-[0.24em] text-[#6d7684]"
                style={{ fontFamily: MONO }}
              >
                {p.id}
              </span>
              <span
                className="rounded-sm border border-white/12 px-2 py-0.5 text-[0.42rem] uppercase tracking-[0.18em] text-[#9aa3b1]"
                style={{ fontFamily: MONO }}
              >
                {t(`pj.sg.${p.stage}`, lang)}
              </span>
              <span
                className={[
                  "rounded-sm border px-2 py-0.5 text-[0.42rem] uppercase tracking-[0.2em]",
                  p.status === "COMPLETED"
                    ? "border-white/30 text-white"
                    : "border-white/10 text-[#8d96a4]",
                ].join(" ")}
                style={{ fontFamily: MONO }}
              >
                {t(`pj.st.${p.status}`, lang)}
              </span>
            </div>

            <h2
              className="mt-3 text-[clamp(1.5rem,3.6vw,2.3rem)] font-light uppercase tracking-[0.14em] text-white"
              style={{
                fontFamily: LUX,
                textShadow: "0 0 22px rgba(255,255,255,0.22)",
              }}
            >
              {name}
            </h2>

            <p
              className="mt-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-[#8e97a5]"
              style={{ fontFamily: MONO }}
            >
              {ar ? p.categoryAr : p.categoryEn}
            </p>
          </div>

          {/* نسبة الإنجاز */}
          <div className="shrink-0 text-end">
            <div
              className="text-[0.44rem] uppercase tracking-[0.2em] text-[#6a7280]"
              style={{ fontFamily: MONO }}
            >
              {t("pj.completion", lang)}
            </div>
            <div
              className="mt-1 tabular-nums text-[2rem] font-light leading-none text-white"
              style={{
                fontFamily: LUX,
                textShadow: "0 0 20px rgba(255,255,255,0.3)",
              }}
            >
              {p.completion}%
            </div>
          </div>
        </div>

        {/* شريط التقدّم */}
        <div className="relative mt-6 h-px w-full bg-white/[0.08]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${p.completion}%` }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="h-px bg-white"
            style={{ boxShadow: "0 0 9px rgba(255,255,255,0.8)" }}
          />
        </div>

        {/* الإجراءان */}
        <div className="relative mt-6 flex flex-wrap gap-2.5">
          <ClubButton onClick={() => setJoin(true)}>
            {t("pj.requestJoin", lang)}
          </ClubButton>
          <ClubButton variant="ghost" onClick={() => setContact(true)}>
            {t("pj.contactManager", lang)}
          </ClubButton>
        </div>
      </header>

      {/* ===== الحقائق ===== */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact icon={Clock} label={t("pj.launch", lang)} value={ar ? p.launchAr : p.launchEn} />
        <Fact icon={MapPin} label={t("pj.location", lang)} value={ar ? p.locationAr : p.locationEn} />
        <Fact icon={Wallet} label={t("pj.capital", lang)} value={formatMoney(p.capitalChf, currency)} />
        <Fact icon={Users} label={t("pj.partners", lang)} value={String(p.partners)} />
      </div>

      {/* ===== المحتوى ===== */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title={t("pj.overview", lang)}>
            <p className="text-[0.85rem] leading-[1.85] text-[#a9b2c0]">
              {ar ? p.overviewAr : p.overviewEn}
            </p>
          </Panel>

          <div className="mt-5">
            <Panel title={t("pj.objectives", lang)}>
              <ul className="space-y-2.5">
                {objectives.map((o, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: ar ? 8 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.45 }}
                    className="flex items-start gap-3 text-[0.8rem] text-[#a9b2c0]"
                  >
                    <span
                      className="mt-[0.42rem] h-1 w-1 shrink-0 rounded-full bg-white/60"
                      style={{ boxShadow: "0 0 6px rgba(255,255,255,0.6)" }}
                    />
                    {o}
                  </motion.li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="mt-5">
            <Panel title={t("pj.updates", lang)}>
              <div className="space-y-4">
                {updates.map((u, i) => (
                  <div key={i} className="flex gap-4">
                    <span
                      className="w-20 shrink-0 pt-0.5 text-[0.46rem] uppercase tracking-[0.16em] text-[#6a7280]"
                      style={{ fontFamily: MONO }}
                    >
                      {u.date}
                    </span>
                    <p className="text-[0.78rem] leading-relaxed text-[#a0a9b7]">
                      {u.text}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <div>
          <Panel title={t("pj.positions", lang)}>
            {positions.length ? (
              <div className="space-y-2">
                {positions.map((o) => (
                  <div
                    key={o}
                    className="rounded-lg border border-white/[0.07] bg-black/25 px-3 py-2.5 text-[0.75rem] text-[#c3ccd9] transition-colors hover:border-white/18"
                  >
                    {o}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[0.75rem] text-[#6d7684]">
                {t("pj.noPositions", lang)}
              </p>
            )}
          </Panel>

          <div className="mt-5">
            <Panel title={t("pj.requirements", lang)}>
              <ul className="space-y-2">
                {requirements.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[0.75rem] text-[#a0a9b7]"
                  >
                    <span className="mt-[0.4rem] h-px w-2.5 shrink-0 bg-white/35" />
                    {r}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="mt-5">
            <Panel title={t("pj.manager", lang)}>
              <div className="flex items-center gap-3">
                <ConceptThumb seed={p.id + "m"} className="h-9 w-9 shrink-0 rounded-md" />
                <span className="text-[0.82rem] text-[#dfe4ec]">
                  {ar ? p.managerAr : p.managerEn}
                </span>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {join && (
          <JoinForm
            projectName={name}
            positions={positions}
            onClose={() => setJoin(false)}
          />
        )}
        {contact && (
          <ContactForm
            projectName={name}
            manager={ar ? p.managerAr : p.managerEn}
            onClose={() => setContact(false)}
            onOpenMessages={onOpenMessages}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border border-white/[0.07] p-5"
      style={{
        background:
          "linear-gradient(160deg, rgba(15,18,25,0.9) 0%, rgba(8,10,15,0.95) 100%)",
      }}
    >
      <h3
        className="mb-4 text-[0.48rem] uppercase tracking-[0.28em] text-[#6a7280]"
        style={{ fontFamily: MONO }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon size={10} className="text-[#5f6875]" />
        <span
          className="text-[0.42rem] uppercase tracking-[0.18em] text-[#5f6875]"
          style={{ fontFamily: MONO }}
        >
          {label}
        </span>
      </div>
      <div className="mt-1.5 truncate text-[0.78rem] text-[#dfe4ec]">{value}</div>
    </div>
  );
}
