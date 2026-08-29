"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen from "@/components/WelcomeScreen";
import LoginScreen from "@/components/LoginScreen";

type Phase = "welcome" | "login" | "done";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("welcome");

  return (
    <AnimatePresence initial={false} mode="wait">
      {phase === "welcome" && (
        <WelcomeScreen key="welcome" onEnter={() => setPhase("login")} />
      )}
      {phase === "login" && (
        <LoginScreen
          key="login"
          onAuthenticated={() => setPhase("done")}
          onBack={() => setPhase("welcome")}
        />
      )}
      {phase === "done" && (
        <motion.div
          key="done"
          className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[#050505] px-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="text-[0.55rem] uppercase tracking-[0.32em] text-[#6e6e6e]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ACCESS GRANTED
          </div>
          <h1
            className="mt-4 text-[clamp(1.6rem,4vw,2.4rem)] font-light tracking-[0.14em] text-[#e8e8e8]"
            style={{ fontFamily: "var(--font-luxury)" }}
          >
            Welcome
          </h1>
          <p className="mt-3 max-w-md text-sm text-[#8a8a8a]">
            Authentication successful.
          </p>
          <button
            type="button"
            onClick={() => setPhase("welcome")}
            className="mt-8 rounded-lg border border-[#2a2a2a] px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] text-[#c0c0c0] transition hover:border-[#3a3a3a] hover:text-white"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Sign out
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
