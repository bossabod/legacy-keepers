"use client";

import { publicPath } from "@/lib/public-path";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Loader2, Lock, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Cursor } from "@/components/brand";
import { Pulse } from "@/components/ui";
import { play } from "@/lib/sound";
import {
  checkCredentials,
  AUTH_MESSAGES,
  VALID_MEMBERSHIP_ID,
  VALID_MEMBERSHIP_PASS,
} from "@/lib/auth";

/* ────────────────────────────────────────────────────────────────
   Credentials live in src/lib/auth.ts (VALID_MEMBERSHIP_ID / PASS).
   Keep the current flow (Welcome → Login → app) and those values.
   ──────────────────────────────────────────────────────────────── */

const VERIFY_MS = 900;

export default function LoginScreen({
  onAuthenticated,
  onBack,
}: {
  onAuthenticated: (opts?: { demo?: boolean }) => void;
  onBack: () => void;
}) {
  const [membership, setMembership] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const idRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Focus ID field so keyboard / Enter works immediately
    const t = window.setTimeout(() => idRef.current?.focus(), 80);
    return () => {
      window.clearTimeout(t);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const finishAuth = useCallback(
    (demo = false) => {
      try {
        play("granted");
      } catch {
        /* noop */
      }
      onAuthenticated({ demo });
    },
    [onAuthenticated],
  );

  const runVerifyThenEnter = useCallback(
    (demo = false) => {
      setError(null);
      setVerifying(true);
      try {
        play("vault");
      } catch {
        /* noop */
      }
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        // Drop overlay BEFORE routing so nothing covers the dashboard
        setVerifying(false);
        // next frame → unmount login / mount app
        window.requestAnimationFrame(() => finishAuth(demo));
      }, VERIFY_MS);
    },
    [finishAuth],
  );

  /** AUTHENTICATE — validates then enters the main site */
  const authenticate = useCallback(() => {
    if (verifying) return;

    const res = checkCredentials(membership, pass);
    if (!res.ok) {
      setError(AUTH_MESSAGES[res.reason]);
      try {
        play("reject");
      } catch {
        /* noop */
      }
      return;
    }

    runVerifyThenEnter(false);
  }, [membership, pass, verifying, runVerifyThenEnter]);

  /** DEMO ACCESS — enter demo mode immediately (no credential check) */
  const enterDemo = useCallback(() => {
    if (verifying) return;
    setMembership(VALID_MEMBERSHIP_ID);
    setPass(VALID_MEMBERSHIP_PASS);
    setError(null);
    runVerifyThenEnter(true);
  }, [verifying, runVerifyThenEnter]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    authenticate();
  };

  const onFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      // Allow native submit; also force auth if browser swallowed it
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "BUTTON") {
        // form onSubmit handles it for inputs; for buttons default is fine
      }
    }
  };

  const onIdChange = (v: string) => {
    setMembership(v);
    if (error) setError(null);
    try {
      play("type");
    } catch {
      /* noop */
    }
  };

  const onPassChange = (v: string) => {
    setPass(v);
    if (error) setError(null);
    try {
      play("type");
    } catch {
      /* noop */
    }
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#020203] flex flex-col justify-between"
      style={{ pointerEvents: verifying ? "none" : "auto", zIndex: 20 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.01 }, pointerEvents: "none" }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      data-screen="login"
    >
      <Cursor />

      {/* ====== Background (never intercepts clicks) ====== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${publicPath("/images/login-bg-eye.jpg")})` }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 100% at 50% 40%, rgba(4,6,9,0.35), rgba(1,2,3,0.72) 100%)",
          }}
        />
      </div>

      {/* ====== Two-Column Layout Overlays (never intercepts clicks) ====== */}
      <div className="absolute inset-0 flex pointer-events-none" aria-hidden="true">
        <div className="w-1/2 bg-[#020305]/55" />
        <div className="w-1/2 bg-[#06080e]/35" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-48 bg-gradient-to-r from-[#020305]/80 via-[#0a0d14]/30 to-transparent" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>

      {/* ====== Top Navigation ====== */}
      <header className="relative z-40 flex items-center justify-between px-6 py-6 sm:px-12 lg:px-16 w-full pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            try {
              play("click");
            } catch {
              /* noop */
            }
            onBack();
          }}
          onMouseEnter={() => {
            try {
              play("hover");
            } catch {
              /* noop */
            }
          }}
          className="group inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-mono tracking-widest text-[#8b95a5] border border-white/[0.08] bg-black/40 backdrop-blur-md transition-all duration-300 hover:border-[#a8a8a8]/40 hover:text-[#eaeef5] hover:bg-white/[0.04] cursor-pointer"
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
      <main className="relative z-40 flex-1 flex items-center justify-center px-4 sm:px-8 py-10 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative z-40 w-full max-w-md rounded-2xl p-8 sm:p-10 backdrop-blur-2xl bg-gradient-to-b from-[#0e1118]/90 via-[#080a0e]/92 to-[#040507]/95 border border-[#a8a8a8]/20 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden pointer-events-auto"
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-50" />

          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[0.65rem] tracking-[0.3em] uppercase text-[#8b95a5]">
              MEMBER ACCESS
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#a8a8a8] shadow-[0_0_8px_#a8a8a8]" />
          </div>

          <h2 className="font-luxury text-2xl sm:text-3xl font-semibold tracking-[0.08em] text-[#eaeef5] uppercase mb-2">
            Member Login
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#7f8896] leading-relaxed mb-7">
            Enter your verified credentials to decrypt the inner circle channel.
          </p>

          <form
            onSubmit={onSubmit}
            onKeyDown={onFormKeyDown}
            noValidate
            className="space-y-5 relative z-10"
            autoComplete="on"
          >
            {/* Membership ID Field */}
            <div className="space-y-2 text-left">
              <label
                htmlFor="membership-id"
                className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]"
              >
                Membership ID
              </label>
              <div className="relative">
                <input
                  ref={idRef}
                  id="membership-id"
                  name="membership-id"
                  type="text"
                  inputMode="text"
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={membership}
                  onChange={(e) => onIdChange(e.target.value)}
                  onMouseEnter={() => {
                    try {
                      play("hover");
                    } catch {
                      /* noop */
                    }
                  }}
                  disabled={verifying}
                  className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#a8a8a8]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-mono tracking-widest text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(170,170,170,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f] disabled:opacity-60 pointer-events-auto cursor-text"
                />
              </div>
            </div>

            {/* Membership Password Field */}
            <div className="space-y-2 text-left">
              <label
                htmlFor="membership-pass"
                className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]"
              >
                Membership Password
              </label>
              <div className="relative">
                <input
                  id="membership-pass"
                  name="membership-pass"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  spellCheck={false}
                  value={pass}
                  onChange={(e) => onPassChange(e.target.value)}
                  onMouseEnter={() => {
                    try {
                      play("hover");
                    } catch {
                      /* noop */
                    }
                  }}
                  disabled={verifying}
                  className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#a8a8a8]/70 rounded-xl px-4 py-3.5 pr-12 text-[#eaeef5] font-mono tracking-[0.5em] text-center text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(170,170,170,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f] disabled:opacity-60 pointer-events-auto cursor-text"
                />
                {/* Show / hide password */}
                <button
                  type="button"
                  tabIndex={0}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  aria-pressed={showPass}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPass((v) => !v);
                    try {
                      play("click");
                    } catch {
                      /* noop */
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-md p-1.5 text-[#8b95a5] hover:text-[#eaeef5] transition-colors cursor-pointer pointer-events-auto"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
                  className="flex items-start gap-2 rounded-lg border border-[#555555]/40 bg-[#141414] px-3 py-2.5"
                  role="alert"
                  data-testid="login-error"
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#888888]" />
                  <span className="font-mono text-[0.68rem] leading-relaxed tracking-wide text-[#b0b0b0]">
                    {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AUTHENTICATE */}
            <div className="pt-3">
              <button
                type="submit"
                data-testid="login-authenticate"
                disabled={verifying}
                onClick={(e) => {
                  // Backup path if form submit is blocked by a parent handler
                  if (e.detail === 0) return; // keyboard activation still uses submit
                }}
                onMouseEnter={() => {
                  try {
                    play("hover");
                  } catch {
                    /* noop */
                  }
                }}
                className="group relative w-full overflow-hidden rounded-xl py-4 px-6 font-luxury text-sm font-semibold tracking-[0.2em] uppercase text-[#eaeef5] transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer pointer-events-auto"
                style={{
                  background: "linear-gradient(180deg, #1e1e1e 0%, #121212 50%, #0c0c0c 100%)",
                  border: "1px solid rgba(170,170,170,0.35)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(174,182,194,0.08)",
                }}
              >
                <span className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-100" />

                {verifying ? (
                  <span className="flex items-center justify-center gap-2.5 font-mono text-xs tracking-widest">
                    <Loader2 className="animate-spin text-[#a8a8a8]" size={16} />
                    AUTHENTICATING...
                  </span>
                ) : (
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                    AUTHENTICATE
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* DEMO ACCESS — real button, enters demo site */}
          <div className="mt-4">
            <button
              type="button"
              data-testid="login-demo"
              disabled={verifying}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                enterDemo();
              }}
              onMouseEnter={() => {
                try {
                  play("hover");
                } catch {
                  /* noop */
                }
              }}
              className="w-full rounded-md border border-white/[0.08] bg-black/30 px-3 py-2.5 text-center transition-all duration-300 hover:border-[#a8a8a8]/35 hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pointer-events-auto"
            >
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[#9aa3b1]">
                DEMO ACCESS
              </span>
              <span className="mt-1 block font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[#565d68]">
                ID {VALID_MEMBERSHIP_ID} · Pass {VALID_MEMBERSHIP_PASS}
              </span>
            </button>
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

      {/* ====== Verification Scrim (only while verifying; does not stick) ====== */}
      <AnimatePresence>
        {verifying && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            aria-live="polite"
            aria-busy="true"
          >
            <div className="relative h-16 w-16">
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: "#a8a8a8" }}
              />
              <Lock className="absolute inset-0 m-auto text-[#a8a8a8]" size={20} />
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
