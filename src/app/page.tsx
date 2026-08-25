"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppProvider } from "@/lib/store";
import WelcomeScreen from "@/components/WelcomeScreen";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/ErrorBoundary";

type Phase = "welcome" | "login" | "app";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [appKey, setAppKey] = useState(0);
  const [demoMode, setDemoMode] = useState(false);

  const enterApp = useCallback((opts?: { demo?: boolean }) => {
    setDemoMode(Boolean(opts?.demo));
    // Switch immediately — do not leave login mounted over the app
    setPhase("app");
  }, []);

  const logout = useCallback(() => {
    setDemoMode(false);
    setPhase("welcome");
  }, []);

  return (
    <AppProvider>
      <ErrorBoundary
        key={appKey}
        onReset={() => {
          setPhase("welcome");
          setDemoMode(false);
          setAppKey((k) => k + 1);
        }}
      >
        {/*
          No mode="wait": login/welcome unmount immediately when phase changes
          so their fixed overlays can never cover the dashboard.
        */}
        <AnimatePresence initial={false}>
          {phase === "welcome" && (
            <WelcomeScreen key="welcome" onEnter={() => setPhase("login")} />
          )}
          {phase === "login" && (
            <LoginScreen
              key="login"
              onAuthenticated={enterApp}
              onBack={() => setPhase("welcome")}
            />
          )}
          {phase === "app" && (
            <motion.div
              key={`app-${appKey}-${demoMode ? "demo" : "member"}`}
              className="relative z-10 min-h-screen w-full"
              style={{ pointerEvents: "auto" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Dashboard onLogout={logout} demoMode={demoMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </ErrorBoundary>
    </AppProvider>
  );
}
