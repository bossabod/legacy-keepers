"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Field, ClubButton } from "./ProjectForms";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { play } from "@/lib/sound";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

export default function SubmitProject() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [name, setName] = useState("");
  const [track, setTrack] = useState("");
  const [scale, setScale] = useState("");
  const [summary, setSummary] = useState("");
  const [sent, setSent] = useState(false);

  const tracks = [
    { id: "digital", label: t("pj.digital", lang) },
    { id: "physical", label: t("pj.physical", lang) },
  ];
  const scales = [
    { id: "seed", label: t("fm.seed", lang) },
    { id: "growth", label: t("fm.growth", lang) },
    { id: "major", label: t("fm.major", lang) },
  ];

  const ok = name.trim() && track && scale && summary.trim().length > 12;

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[46vh] flex-col items-center justify-center text-center"
        dir={ar ? "rtl" : "ltr"}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/[0.05]"
        >
          <Check size={24} className="text-white" />
        </motion.div>
        <h3
          className="text-xl uppercase tracking-[0.2em] text-white"
          style={{ fontFamily: LUX, textShadow: "0 0 16px rgba(255,255,255,0.35)" }}
        >
          {t("fm.sent", lang)}
        </h3>
        <p className="mt-3 max-w-sm text-[0.82rem] leading-relaxed text-[#8e97a5]">
          {t("fm.sentBody", lang)}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="mb-7 text-center">
        <h3
          className="text-[clamp(1.1rem,2.6vw,1.6rem)] font-light uppercase tracking-[0.24em] text-white"
          style={{ fontFamily: LUX }}
        >
          {t("pj.submit", lang)}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-[0.78rem] leading-relaxed text-[#8e97a5]">
          {t("fm.submitIntro", lang)}
        </p>
      </div>

      <div
        className="space-y-5 rounded-2xl border border-white/[0.08] p-6"
        style={{
          background:
            "linear-gradient(158deg, rgba(16,19,26,0.92) 0%, rgba(8,10,15,0.96) 100%)",
        }}
      >
        <Field label={t("fm.projectName", lang)} value={name} onChange={setName} />

        <div>
          <span
            className="mb-2 block text-[0.46rem] uppercase tracking-[0.22em] text-[#6a7280]"
            style={{ fontFamily: MONO }}
          >
            {t("fm.track", lang)}
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {tracks.map((o) => (
              <Choice
                key={o.id}
                active={track === o.id}
                label={o.label}
                onClick={() => {
                  setTrack(o.id);
                  play("hover");
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <span
            className="mb-2 block text-[0.46rem] uppercase tracking-[0.22em] text-[#6a7280]"
            style={{ fontFamily: MONO }}
          >
            {t("fm.capitalScale", lang)}
          </span>
          <div className="grid gap-2">
            {scales.map((o) => (
              <Choice
                key={o.id}
                active={scale === o.id}
                label={o.label}
                onClick={() => {
                  setScale(o.id);
                  play("hover");
                }}
              />
            ))}
          </div>
        </div>

        <Field label={t("fm.summary", lang)} value={summary} onChange={setSummary} area />

        <div className="pt-1">
          <ClubButton
            disabled={!ok}
            onClick={() => {
              play("granted");
              setSent(true);
            }}
          >
            {t("fm.submitProject", lang)}
          </ClubButton>
        </div>
      </div>
    </motion.div>
  );
}

function Choice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-3 text-start text-[0.78rem] transition-all duration-300",
        active
          ? "border-white/35 bg-white/[0.06] text-white"
          : "border-white/[0.07] bg-black/25 text-[#8e97a5] hover:border-white/18 hover:text-[#dfe4ec]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
