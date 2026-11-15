"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, X, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { ARCHIVE_PASSWORD } from "@/lib/archive-registry";

export const MONO = "var(--font-ibm-mono)";
export const LUX = "var(--font-luxury)";

/* ============ سطح الملفّ الموحّد ============ */

export function FileFace({
  ref_,
  eyebrow,
  title,
  sub,
  meta,
  footer,
  locked,
  onOpen,
  accent,
}: {
  ref_: string;
  eyebrow: string;
  title: string;
  sub?: string;
  meta?: { label: string; value: string }[];
  footer?: string;
  locked?: boolean;
  onOpen?: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => play("hover")}
      className="group relative block h-full w-full overflow-hidden rounded-2xl border text-start transition-colors duration-400"
      style={{
        borderColor: accent
          ? "rgba(196,72,72,0.34)"
          : "rgba(255,255,255,0.11)",
        background:
          "linear-gradient(158deg, #12151c 0%, #0b0e13 55%, #07090d 100%)",
        boxShadow: accent
          ? "0 0 40px rgba(196,72,72,0.08) inset, 0 24px 60px rgba(0,0,0,0.65)"
          : "0 24px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* شبكة هندسية دقيقة */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.055]"
        aria-hidden="true"
      >
        <defs>
          <pattern id={`g-${ref_}`} width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0H0V26" fill="none" stroke="#fff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#g-${ref_})`} />
      </svg>

      {/* علامات الزوايا */}
      <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t"
        style={{ borderColor: accent ? "rgba(196,72,72,0.5)" : "rgba(255,255,255,0.22)" }} />
      <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t"
        style={{ borderColor: accent ? "rgba(196,72,72,0.5)" : "rgba(255,255,255,0.22)" }} />
      <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l"
        style={{ borderColor: "rgba(255,255,255,0.12)" }} />
      <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r"
        style={{ borderColor: "rgba(255,255,255,0.12)" }} />

      <div className="relative flex h-full flex-col p-6 sm:p-7">
        {/* الرأس */}
        <div className="flex items-start justify-between gap-4">
          <span
            className="text-[0.46rem] tracking-[0.24em]"
            style={{ fontFamily: MONO, color: accent ? "#c98a8a" : "#6d7684" }}
          >
            {ref_}
          </span>
          {locked && <Lock size={12} className="shrink-0 text-[#c46a6a]" />}
        </div>

        <p
          className="mt-5 text-[0.44rem] uppercase tracking-[0.28em] text-[#5d6675]"
          style={{ fontFamily: MONO }}
        >
          {eyebrow}
        </p>

        <h3
          className="mt-2 text-[clamp(1.15rem,2.6vw,1.8rem)] font-light uppercase tracking-[0.14em] text-[#eaeef5] transition-colors group-hover:text-white"
          style={{ fontFamily: LUX }}
        >
          {title}
        </h3>

        {sub && (
          <p className="mt-2.5 max-w-[42ch] text-[0.76rem] leading-relaxed text-[#8d96a4]">
            {sub}
          </p>
        )}

        {meta && (
          <div className="mt-auto grid grid-cols-2 gap-x-5 gap-y-2 pt-6 sm:grid-cols-3">
            {meta.map((m) => (
              <div key={m.label}>
                <div
                  className="text-[0.4rem] uppercase tracking-[0.18em] text-[#565d6a]"
                  style={{ fontFamily: MONO }}
                >
                  {m.label}
                </div>
                <div
                  className="mt-0.5 truncate text-[0.7rem] text-[#c3ccd9]"
                  style={{ fontFamily: MONO }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {footer && (
          <div
            className="mt-5 border-t border-white/[0.06] pt-3 text-[0.42rem] uppercase tracking-[0.2em] text-[#4f5763]"
            style={{ fontFamily: MONO }}
          >
            {footer}
          </div>
        )}
      </div>

      {/* توهّج الحافة عند التحويم */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          boxShadow: accent
            ? "inset 0 0 0 1px rgba(196,72,72,0.4)"
            : "inset 0 0 0 1px rgba(255,255,255,0.16)",
        }}
      />
    </button>
  );
}

/* ============ نافذة كلمة المرور ============ */

export function PasswordGate({
  vaultTitle,
  onClose,
  onGranted,
}: {
  vaultTitle: string;
  onClose: () => void;
  onGranted: () => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [pw, setPw] = useState("");
  const [denied, setDenied] = useState(false);
  const [checking, setChecking] = useState(false);

  const verify = () => {
    if (!pw.trim()) return;
    setChecking(true);
    setDenied(false);
    play("vault");
    setTimeout(() => {
      setChecking(false);
      if (pw.trim().toUpperCase() === ARCHIVE_PASSWORD) {
        play("granted");
        onGranted();
      } else {
        setDenied(true);
        setPw("");
      }
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-5 backdrop-blur-sm"
      dir={ar ? "rtl" : "ltr"}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-2xl border p-6"
        style={{
          borderColor: denied ? "rgba(196,72,72,0.45)" : "rgba(255,255,255,0.11)",
          background: "linear-gradient(160deg, #101319 0%, #07090c 100%)",
          boxShadow: denied
            ? "0 0 50px rgba(196,72,72,0.14), 0 30px 70px rgba(0,0,0,0.85)"
            : "0 30px 70px rgba(0,0,0,0.85)",
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Lock size={13} className="text-[#c46a6a]" />
            <span
              className="text-[0.46rem] uppercase tracking-[0.26em] text-[#8d96a4]"
              style={{ fontFamily: MONO }}
            >
              {vaultTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/[0.08] p-1.5 text-[#6d7684] transition-colors hover:border-white/25 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>

        <label
          className="mb-2 block text-[0.44rem] uppercase tracking-[0.22em] text-[#6a7280]"
          style={{ fontFamily: MONO }}
        >
          {t("ar.password", lang)}
        </label>

        <input
          type="password"
          value={pw}
          autoFocus
          onChange={(e) => { setPw(e.target.value); setDenied(false); }}
          onKeyDown={(e) => e.key === "Enter" && verify()}
          className="w-full rounded-lg border bg-black/50 px-3.5 py-2.5 text-[0.85rem] tracking-[0.3em] text-[#eaeef5] outline-none transition-colors"
          style={{
            fontFamily: MONO,
            borderColor: denied ? "rgba(196,72,72,0.5)" : "rgba(255,255,255,0.1)",
          }}
        />

        {denied && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-1.5 text-[0.56rem] uppercase tracking-[0.2em]"
            style={{ fontFamily: MONO, color: "#e06b6b" }}
          >
            <ShieldAlert size={11} />
            {t("ar.denied", lang)}
          </motion.p>
        )}

        <button
          type="button"
          onClick={verify}
          disabled={!pw.trim() || checking}
          className={[
            "mt-6 w-full rounded-lg border py-2.5 text-[0.56rem] uppercase tracking-[0.24em] transition-all duration-350",
            pw.trim() && !checking
              ? "cursor-pointer border-white/[0.2] bg-white/[0.04] text-white hover:border-white/40 hover:bg-white/[0.08]"
              : "cursor-not-allowed border-white/[0.06] text-[#3f4550]",
          ].join(" ")}
          style={{ fontFamily: MONO }}
        >
          {checking ? t("ar.verifying", lang) : t("ar.verify", lang)}
        </button>

        <p
          className="mt-4 text-center text-[0.4rem] uppercase tracking-[0.18em] text-[#454c59]"
          style={{ fontFamily: MONO }}
        >
          {t("ar.gateNote", lang)}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ============ مسار التنقّل ============ */

export function Breadcrumb({
  crumbs,
  isAr,
}: {
  crumbs: { label: string; onClick?: () => void }[];
  isAr: boolean;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            <button
              type="button"
              disabled={last || !c.onClick}
              onClick={c.onClick}
              className={[
                "text-[0.5rem] uppercase tracking-[0.22em] transition-colors duration-300",
                last
                  ? "text-white"
                  : c.onClick
                  ? "cursor-pointer text-[#6d7684] hover:text-[#c3ccd9]"
                  : "text-[#6d7684]",
              ].join(" ")}
              style={{
                fontFamily: MONO,
                textShadow: last ? "0 0 10px rgba(255,255,255,0.4)" : undefined,
              }}
            >
              {c.label}
            </button>
            {!last && (
              <span className="text-[0.5rem] text-[#3f4550]">{isAr ? "\\" : "/"}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
