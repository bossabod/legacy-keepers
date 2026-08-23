"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Sigil from "./Sigil";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { DIRECTORY, GROUPS, type Channel, type Priority } from "@/lib/comms";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

const PRIORITIES: Priority[] = ["routine", "elevated", "critical"];

export default function Compose({
  channel,
  onBack,
  onSend,
}: {
  channel: Exclude<Channel, "administration">;
  onBack: () => void;
  onSend: (p: {
    channel: Channel;
    to: string;
    subject: string;
    priority: Priority;
    body: string;
    recipients?: number;
  }) => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const Back = ar ? ArrowRight : ArrowLeft;

  const [to, setTo] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<Priority>("routine");
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);

  const isGroup = channel === "group";
  const ok = to && subject.trim() && body.trim().length > 8;

  const title =
    channel === "mail" ? t("ms.mail", lang) : isGroup ? t("ms.group", lang) : t("ms.internal", lang);

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[44vh] flex-col items-center justify-center text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 180 }}
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/[0.05]"
        >
          <Check size={22} className="text-white" />
        </motion.div>
        <h3
          className="text-lg uppercase tracking-[0.2em] text-white"
          style={{ fontFamily: LUX, textShadow: "0 0 16px rgba(255,255,255,0.35)" }}
        >
          {t("ms.transmitted", lang)}
        </h3>
        <p className="mt-3 text-[0.78rem] text-[#8e97a5]">{t("ms.loggedBody", lang)}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={onBack}
        className="group mb-5 inline-flex items-center gap-2 text-[0.52rem] uppercase tracking-[0.24em] text-[#6d7684] transition-colors hover:text-white"
        style={{ fontFamily: MONO }}
      >
        <Back size={11} />
        {t("ms.backCentre", lang)}
      </button>

      <div
        className="rounded-2xl border border-white/[0.08] p-6"
        style={{
          background:
            "linear-gradient(158deg, rgba(16,19,26,0.94) 0%, rgba(8,10,14,0.97) 100%)",
        }}
      >
        <h3
          className="text-[1.05rem] uppercase tracking-[0.2em] text-white"
          style={{ fontFamily: LUX }}
        >
          {title}
        </h3>
        <div className="mt-1.5 h-px w-16 bg-gradient-to-r from-white/45 to-transparent" />

        {/* المستلم */}
        <div className="mt-6">
          <Label>{isGroup ? t("ms.selectGroup", lang) : t("ms.recipient", lang)}</Label>

          {isGroup ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => { setTo(g.id); play("hover"); }}
                  className={[
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-start transition-all duration-300",
                    to === g.id
                      ? "border-white/35 bg-white/[0.06]"
                      : "border-white/[0.07] bg-black/25 hover:border-white/18",
                  ].join(" ")}
                >
                  <span className="text-[0.78rem] text-[#dfe4ec]">{ar ? g.ar : g.en}</span>
                  <span
                    className="tabular-nums text-[0.6rem] text-[#6d7684]"
                    style={{ fontFamily: MONO }}
                  >
                    {String(g.size).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="max-h-[190px] space-y-1.5 overflow-y-auto pe-1">
              {DIRECTORY.map((c) => (
                <button
                  key={c.sigil}
                  type="button"
                  onClick={() => { setTo(c.sigil); play("hover"); }}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-start transition-all duration-300",
                    to === c.sigil
                      ? "border-white/32 bg-white/[0.05]"
                      : "border-white/[0.06] bg-black/20 hover:border-white/16",
                  ].join(" ")}
                >
                  <Sigil sigil={c.sigil} tier={c.tier} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.76rem] text-[#dfe4ec]">
                      {ar ? c.nameAr : c.nameEn}
                    </span>
                    <RankTag tier={c.tier} label={ar ? c.rankAr : c.rankEn} />
                  </span>
                  <span
                    className="shrink-0 text-[0.52rem] tracking-[0.14em] text-[#5f6875]"
                    style={{ fontFamily: MONO }}
                  >
                    {c.sigil}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* العنوان */}
        <div className="mt-5">
          <Label>{t("ms.subject", lang)}</Label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-white/[0.09] bg-black/40 px-3.5 py-2.5 text-[0.8rem] text-[#eaeef5] outline-none transition-colors focus:border-white/25"
          />
        </div>

        {/* الأولوية */}
        <div className="mt-5">
          <Label>{t("ms.priority", lang)}</Label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => {
              const on = priority === p;
              const hot = p === "critical";
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPriority(p); play("hover"); }}
                  className={[
                    "rounded-lg border px-3.5 py-1.5 text-[0.55rem] uppercase tracking-[0.18em] transition-all duration-300",
                    on
                      ? hot
                        ? "border-[#c44848]/55 bg-[#c44848]/[0.12] text-[#e8b4b4]"
                        : "border-white/35 bg-white/[0.06] text-white"
                      : "border-white/[0.07] text-[#6d7684] hover:border-white/18 hover:text-[#c3ccd9]",
                  ].join(" ")}
                  style={{ fontFamily: MONO }}
                >
                  {t(`ms.pr.${p}`, lang)}
                </button>
              );
            })}
          </div>
        </div>

        {/* النص */}
        <div className="mt-5">
          <Label>{t("ms.body", lang)}</Label>
          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-none rounded-lg border border-white/[0.09] bg-black/40 px-3.5 py-3 text-[0.8rem] leading-relaxed text-[#eaeef5] outline-none transition-colors focus:border-white/25"
            style={{ fontFamily: MONO }}
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={!ok}
            onClick={() => {
              play("granted");
              const g = GROUPS.find((x) => x.id === to);
              onSend({
                channel,
                to,
                subject,
                priority,
                body,
                recipients: isGroup ? g?.size : undefined,
              });
              setDone(true);
            }}
            className={[
              "rounded-lg px-6 py-2.5 text-[0.58rem] uppercase tracking-[0.24em] transition-all duration-400",
              ok
                ? "cursor-pointer border border-white/[0.2] bg-white/[0.05] text-white hover:border-white/40 hover:bg-white/[0.09]"
                : "cursor-not-allowed border border-white/[0.06] text-[#3f4550]",
            ].join(" ")}
            style={{
              fontFamily: MONO,
              textShadow: ok ? "0 0 10px rgba(255,255,255,0.32)" : undefined,
            }}
          >
            {t("ms.transmit", lang)}
          </button>

          <span
            className="text-[0.46rem] uppercase tracking-[0.18em] text-[#4b525f]"
            style={{ fontFamily: MONO }}
          >
            {t("ms.encrypted", lang)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mb-2 block text-[0.46rem] uppercase tracking-[0.22em] text-[#6a7280]"
      style={{ fontFamily: MONO }}
    >
      {children}
    </span>
  );
}

export function RankTag({ tier, label }: { tier: number; label: string }) {
  /* الرتب العليا تحصل على وسم أحمر أوضح */
  const strong = tier >= 7;
  return (
    <span
      className="mt-0.5 inline-block rounded-sm border px-1.5 py-px text-[0.4rem] uppercase tracking-[0.14em]"
      style={{
        fontFamily: MONO,
        borderColor: strong ? "rgba(196,72,72,0.5)" : "rgba(196,72,72,0.26)",
        color: strong ? "#e0a2a2" : "#b98a8a",
        background: strong ? "rgba(196,72,72,0.10)" : "rgba(196,72,72,0.05)",
      }}
    >
      {label}
    </span>
  );
}
