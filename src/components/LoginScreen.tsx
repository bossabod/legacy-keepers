"use client";
import { publicPath } from "@/lib/public-path";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Loader2, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { Cursor } from "@/components/brand";
import { Pulse } from "@/components/ui";
import { play } from "@/lib/sound";
import { checkCredentials, AUTH_MESSAGES } from "@/lib/auth";

/* ────────────────────────────────────────────────────────────────
   Credentials live in src/lib/auth.ts (VALID_MEMBERSHIP_ID / PASS).
   Keep the current flow (Welcome → Login → app) and those values.
   ──────────────────────────────────────────────────────────────── */

const VERIFY_MS = 1500; // length of the "Decrypting…" animation before entry

export default function LoginScreen({
  onAuthenticated,
  onBack,
}: {
  onAuthenticated: () => void;
  onBack: () => void;
}) {
  const [membership, setMembership] = useState("");
  const [pass, setPass] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;

    /* 1 — validate (empty / wrong credentials) */
    const res = checkCredentials(membership, pass);
    if (!res.ok) {
      setError(AUTH_MESSAGES[res.reason]);
      try { play("reject"); } catch { /* noop */ }
      return;
    }

    /* 2 — authorised: play the verification animation, then enter */
    setError(null);
    setVerifying(true);
    try { play("vault"); } catch { /* noop */ }
    window.setTimeout(() => {
      try { play("granted"); } catch { /* noop */ }
      onAuthenticated();
    }, VERIFY_MS);
  };

  const onIdChange = (v: string) => { setMembership(v); if (error) setError(null); try { play("type"); } catch { /* noop */ } };
  const onPassChange = (v: string) => { setPass(v); if (error) setError(null); try { play("type"); } catch { /* noop */ } };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#020203] flex flex-col justify-between"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      <Cursor />

      {/* ====== Background: Full cinematic visibility, no blur ====== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${publicPath("/images/login-bg-eye.jpg")})` }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        {/* Subtle dark overlay for readability only */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 100% at 50% 40%, rgba(4,6,9,0.35), rgba(1,2,3,0.72) 100%)",
          }}
        />
      </div>

      {/* ====== Two-Column Layout Overlays ====== */}
      <div className="absolute inset-0 flex pointer-events-none">
        <div className="w-1/2 bg-[#020305]/55" />
        <div className="w-1/2 bg-[#06080e]/35" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-48 bg-gradient-to-r from-[#020305]/80 via-[#0a0d14]/30 to-transparent" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>

      {/* ====== Top Navigation ====== */}
      <header className="relative z-30 flex items-center justify-between px-6 py-6 sm:px-12 lg:px-16 w-full">
        <button
          type="button"
          onClick={() => { try { play("click"); } catch { /* noop */ } onBack(); }}
          onMouseEnter={() => { try { play("hover"); } catch { /* noop */ } }}
          className="group inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-mono tracking-widest text-[#8b95a5] border border-white/[0.08] bg-black/40 backdrop-blur-md transition-all duration-300 hover:border-[#c3c9d3]/40 hover:text-[#eaeef5] hover:bg-white/[0.04]"
        >
          <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
          <span>BACK TO GATEWAY</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-[#565d68] hidden sm:inline-block">
            ATHAR &middot; ENCRYPTED PORTAL
          </span>
        </div>
      </header>

      {/* ====== Main: Member Login ====== */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative w-full max-w-md rounded-2xl p-8 sm:p-10 backdrop-blur-2xl bg-gradient-to-b from-[#0e1118]/90 via-[#080a0e]/92 to-[#040507]/95 border border-[#c3c9d3]/20 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden"
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-50" />

          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[0.65rem] tracking-[0.3em] uppercase text-[#8b95a5]">
              MEMBER ACCESS
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#c3c9d3] shadow-[0_0_8px_#c3c9d3]" />
          </div>

          <h2 className="font-luxury text-2xl sm:text-3xl font-semibold tracking-[0.08em] text-[#eaeef5] uppercase mb-2">
            Member Login
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#7f8896] leading-relaxed mb-7">
            Enter your verified credentials to decrypt the inner circle channel.
          </p>

          <form onSubmit={submit} noValidate className="space-y-5">
            {/* Membership ID Field */}
            <div className="space-y-2 text-left">
              <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                Membership ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="username"
                  value={membership}
                  onChange={(e) => onIdChange(e.target.value)}
                  onMouseEnter={() => { try { play("hover"); } catch { /* noop */ } }}
                  className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-mono tracking-widest text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f]"
                />
              </div>
            </div>

            {/* Membership Password Field */}
            <div className="space-y-2 text-left">
              <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                Membership Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => onPassChange(e.target.value)}
                  onMouseEnter={() => { try { play("hover"); } catch { /* noop */ } }}
                  className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-mono tracking-[0.5em] text-center text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f]"
                />
              </div>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-2.5"
                  role="alert"
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                  <span className="font-mono text-[0.68rem] leading-relaxed tracking-wide text-red-200/90">
                    {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={verifying}
                onMouseEnter={() => { try { play("hover"); } catch { /* noop */ } }}
                className="group relative w-full overflow-hidden rounded-xl py-4 px-6 font-luxury text-sm font-semibold tracking-[0.2em] uppercase text-[#eaeef5] transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(180deg, #2a313d 0%, #161b24 50%, #0a0d13 100%)",
                  border: "1px solid rgba(195,201,211,0.35)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(174,182,194,0.08)",
                }}
              >
                <span className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-100" />

                {verifying ? (
                  <span className="flex items-center justify-center gap-2.5 font-mono text-xs tracking-widest">
                    <Loader2 className="animate-spin text-[#c3c9d3]" size={16} />
                    AUTHENTICATING...
                  </span>
                ) : (
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                    Authenticate
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Demo credentials hint — keeps the flow usable & testable */}
          <div className="mt-4 rounded-md border border-white/[0.05] bg-black/30 px-3 py-2 text-center">
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[#565d68]">
              Demo access — ID <span className="text-[#9aa3b1]">Q-T-971</span> · Pass <span className="text-[#9aa3b1]">COVENANT</span>
            </span>
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[0.68rem] font-mono text-[#565d68]">
            <span className="flex items-center gap-2">
              <Pulse color="#7f8896" />
              MONITORED CHANNEL
            </span>
            <span>256-BIT ENCRYPTION</span>
          </div>
        </motion.div>
      </main>

      {/* ====== Footer ====== */}
      <footer className="relative z-20 pb-6 pt-8 flex flex-col items-center justify-center gap-1.5 text-center pointer-events-none">
        <p className="font-luxury text-xs sm:text-sm tracking-[0.35em] uppercase text-[#8b95a5] text-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Legal &amp; Authorized Club
        </p>
        <p className="font-mono text-[0.58rem] sm:text-[0.65rem] tracking-[0.28em] uppercase text-[#4a515d]">
          Closed System &middot; Est. 2012
        </p>
      </footer>

      {/* ====== Verification Scrim ====== */}
      <AnimatePresence>
        {verifying && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative h-16 w-16">
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{ borderTopColor: "#c3c9d3" }}
              >
                <motion.div
                  className="h-full w-full rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <Lock className="absolute inset-0 m-auto text-[#c3c9d3]" size={20} />
            </div>
            <p className="font-luxury text-sm tracking-[0.3em] uppercase text-[#eaeef5]">
              Decrypting Inner Circle...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
