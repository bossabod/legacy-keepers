"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AppProvider } from "@/lib/store";
import WelcomeScreen from "@/components/WelcomeScreen";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/ErrorBoundary";

type Phase = "welcome" | "login" | "app";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [appKey, setAppKey] = useState(0);

  return (
    <AppProvider>
      <ErrorBoundary
        key={appKey}
        onReset={() => { setPhase("welcome"); setAppKey((k) => k + 1); }}
      >
        <AnimatePresence mode="wait">
          {phase === "welcome" && (
            <WelcomeScreen key="welcome" onEnter={() => setPhase("login")} />
          )}
          {phase === "login" && (
            <LoginScreen
              key="login"
              onAuthenticated={() => setPhase("app")}
              onBack={() => setPhase("welcome")}
            />
          )}
          {phase === "app" && (
            <Dashboard key={`app-${appKey}`} onLogout={() => setPhase("welcome")} />
          )}
        </AnimatePresence>
      </ErrorBoundary>
    </AppProvider>
  );
}
