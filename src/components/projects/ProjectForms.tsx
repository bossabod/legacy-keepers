"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { play } from "@/lib/sound";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

/* حقل نصّي بأسلوب النادي */
export function Field({
  label,
  value,
  onChange,
  area,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  placeholder?: string;
}) {
  const base =
    "w-full rounded-lg border border-white/[0.09] bg-black/40 px-3.5 py-2.5 text-[0.8rem] text-[#eaeef5] outline-none transition-colors placeholder:text-[#4d545f] focus:border-white/25";
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-[0.46rem] uppercase tracking-[0.22em] text-[#6a7280]"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
      {area ? (
        <textarea
          rows={4}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} resize-none leading-relaxed`}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </label>
  );
}

/* زر بأسلوب النادي — نص متوهّج بلا لون */
export function ClubButton({
  children,
  onClick,
  disabled,
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "ghost";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => !disabled && play("hover")}
      className={[
        "rounded-lg px-5 py-2.5 text-[0.58rem] uppercase tracking-[0.24em] transition-all duration-400",
        disabled
          ? "cursor-not-allowed border border-white/[0.06] text-[#3f4550]"
          : variant === "solid"
          ? "cursor-pointer border border-white/[0.18] bg-white/[0.05] text-white hover:border-white/40 hover:bg-white/[0.09]"
          : "cursor-pointer border border-white/[0.09] text-[#9aa3b1] hover:border-white/25 hover:text-white",
      ].join(" ")}
      style={{
        fontFamily: MONO,
        textShadow: disabled ? undefined : "0 0 10px rgba(255,255,255,0.32)",
      }}
    >
      {children}
    </button>
  );
}

/* غلاف نافذة نموذج */
function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { lang } = useApp();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/88 p-5 backdrop-blur-sm"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/[0.10] p-6"
        style={{
          background:
            "linear-gradient(158deg, rgba(17,20,27,0.98) 0%, rgba(7,9,13,0.99) 100%)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.85)",
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h4
            className="text-[0.95rem] uppercase tracking-[0.2em] text-white"
            style={{ fontFamily: LUX }}
          >
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/[0.09] p-1.5 transition-colors hover:border-white/25 hover:text-white"
            style={{ color: "#6d7684" }}
          >
            <X size={13} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* شاشة النجاح */
function Done({ onClose }: { onClose: () => void }) {
  const { lang } = useApp();
  return (
    <div className="py-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 190, delay: 0.05 }}
        className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.05]"
      >
        <Check size={20} className="text-white" />
      </motion.div>
      <p
        className="text-[0.95rem] uppercase tracking-[0.18em] text-white"
        style={{ fontFamily: LUX }}
      >
        {t("fm.sent", lang)}
      </p>
      <p className="mt-2.5 text-[0.75rem] text-[#8e97a5]">
        {t("fm.sentBody", lang)}
      </p>
      <div className="mt-7">
        <ClubButton variant="ghost" onClick={onClose}>
          {t("common.close", lang)}
        </ClubButton>
      </div>
    </div>
  );
}

/* نموذج طلب الانضمام */
export function JoinForm({
  projectName,
  positions,
  onClose,
}: {
  projectName: string;
  positions: string[];
  onClose: () => void;
}) {
  const { lang } = useApp();
  const [name, setName] = useState("");
  const [mid, setMid] = useState("");
  const [role, setRole] = useState(positions[0] ?? "");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const ok = name.trim() && mid.trim() && msg.trim().length > 8;

  return (
    <Sheet title={`${t("fm.joinTitle", lang)} · ${projectName}`} onClose={onClose}>
      {sent ? (
        <Done onClose={onClose} />
      ) : (
        <div className="space-y-4">
          <Field label={t("fm.name", lang)} value={name} onChange={setName} />
          <Field label={t("fm.memberId", lang)} value={mid} onChange={setMid} placeholder="Q-T-000" />

          {positions.length > 0 && (
            <div>
              <span
                className="mb-1.5 block text-[0.46rem] uppercase tracking-[0.22em] text-[#6a7280]"
                style={{ fontFamily: MONO }}
              >
                {t("fm.role", lang)}
              </span>
              <div className="flex flex-wrap gap-2">
                {positions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRole(p)}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-[0.62rem] transition-all duration-300",
                      role === p
                        ? "border-white/35 bg-white/[0.07] text-white"
                        : "border-white/[0.08] text-[#8e97a5] hover:border-white/20 hover:text-[#dfe4ec]",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field label={t("fm.message", lang)} value={msg} onChange={setMsg} area />

          <div className="flex gap-2.5 pt-1">
            <ClubButton
              disabled={!ok}
              onClick={() => {
                play("granted");
                setSent(true);
              }}
            >
              {t("fm.send", lang)}
            </ClubButton>
            <ClubButton variant="ghost" onClick={onClose}>
              {t("fm.cancel", lang)}
            </ClubButton>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* نموذج التواصل مع المدير */
export function ContactForm({
  projectName,
  manager,
  onClose,
  onOpenMessages,
}: {
  projectName: string;
  manager: string;
  onClose: () => void;
  onOpenMessages?: () => void;
}) {
  const { lang } = useApp();
  const [subject, setSubject] = useState(projectName);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const ok = subject.trim() && msg.trim().length > 8;

  return (
    <Sheet title={t("fm.contactTitle", lang)} onClose={onClose}>
      {sent ? (
        <Done onClose={onClose} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/[0.07] bg-black/30 px-3.5 py-2.5">
            <div
              className="text-[0.44rem] uppercase tracking-[0.2em] text-[#6a7280]"
              style={{ fontFamily: MONO }}
            >
              {t("pj.manager", lang)}
            </div>
            <div className="mt-1 text-[0.8rem] text-[#dfe4ec]">{manager}</div>
          </div>

          <Field label={t("fm.subject", lang)} value={subject} onChange={setSubject} />
          <Field label={t("fm.message", lang)} value={msg} onChange={setMsg} area />

          <div className="flex flex-wrap gap-2.5 pt-1">
            <ClubButton
              disabled={!ok}
              onClick={() => {
                play("granted");
                setSent(true);
              }}
            >
              {t("fm.send", lang)}
            </ClubButton>
            {onOpenMessages && (
              <ClubButton variant="ghost" onClick={onOpenMessages}>
                {t("nav.messages", lang)}
              </ClubButton>
            )}
            <ClubButton variant="ghost" onClick={onClose}>
              {t("fm.cancel", lang)}
            </ClubButton>
          </div>
        </div>
      )}
    </Sheet>
  );
}
