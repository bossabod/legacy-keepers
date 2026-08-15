"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AppProvider } from "@/lib/store";
import WelcomeScreen from "@/components/WelcomeScreen";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";

type Phase = "welcome" | "login" | "app";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("welcome");

  return (
    <AppProvider>
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
          <Dashboard key="app" onLogout={() => setPhase("welcome")} />
        )}
      </AnimatePresence>
    </AppProvider>
  );
}
