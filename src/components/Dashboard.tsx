"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Menu, X, ChevronDown, Globe } from "lucide-react";
import { Logo } from "@/components/brand";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";
import { getFallbackData } from "@/lib/fallback-data";
import { t, type Lang } from "@/lib/i18n";
import { StatusBar } from "@/components/design-system";

import HomeSection from "@/components/sections/Home";
import NetworkSection from "@/components/sections/Network";
import LogSection from "@/components/sections/Records";
import ProjectsSection from "@/components/sections/Projects";
import InvestmentsSection from "@/components/sections/Money";
import VaultSection from "@/components/sections/Vault";
import InvoicesSection from "@/components/sections/Invoices";
import MembersSection from "@/components/sections/Members";
import MessagesSection from "@/components/sections/Messages";
import ArchiveSection from "@/components/sections/Archive";
import LadderSection from "@/components/sections/ImpactLadder";
import IdentitySection from "@/components/sections/Identity";
import GoalsSection from "@/components/sections/Goals";
import RulesSection from "@/components/sections/Rules";
import FeaturesSection from "@/components/sections/Features";
import PaymentsSection from "@/components/sections/Payments";
import ActivitySection from "@/components/sections/Activity";
import VipSection from "@/components/sections/Vip";

export type SectionKey =
  | "home" | "network" | "log"
  | "projects" | "investments"
  | "vault" | "invoices"
  | "members" | "messages"
  | "archive" | "ladder"
  | "identity" | "goals" | "rules"
  | "features" | "payments" | "activity" | "vip";

// Primary nav — most important pages, always visible and centered
const PRIMARY_NAV: { key: SectionKey; labelKey: string }[] = [
  { key: "home", labelKey: "nav.home" },
  { key: "network", labelKey: "nav.network" },
  { key: "projects", labelKey: "nav.projects" },
  { key: "investments", labelKey: "nav.investments" },
  { key: "messages", labelKey: "nav.messages" },
  { key: "ladder", labelKey: "nav.ladder" },
  { key: "archive", labelKey: "nav.archive" },
  { key: "vip", labelKey: "nav.vip" },
];

// Secondary nav — everything else goes into the "More" dropdown
const SECONDARY_NAV: { key: SectionKey; labelKey: string }[] = [
  { key: "features", labelKey: "nav.features" },
  { key: "members", labelKey: "nav.members" },
  { key: "payments", labelKey: "nav.payments" },
  { key: "activity", labelKey: "nav.activity" },
  { key: "log", labelKey: "nav.reports" },
  { key: "identity", labelKey: "nav.identity" },
  { key: "vault", labelKey: "nav.organizations" },
  { key: "rules", labelKey: "nav.rules" },
  { key: "goals", labelKey: "nav.goals" },
  { key: "invoices", labelKey: "nav.invoices" },
];

const MONEY: SectionKey[] = ["projects", "investments", "vault", "invoices", "payments"];

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [section, setSection] = useState<SectionKey>("home");
  const [data, setData] = useState<AppData | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { currency, setCurrency, soundOn, toggleSound, lang, setLang, camera, fps, setFps } = useApp();

  // FPS monitor
  useEffect(() => {
    let raf: number;
    let frames = 0;
    let last = performance.now();
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 2000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setFps]);

  // Close "More" on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => { if (active) setData((prev) => prev ?? getFallbackData()); }, 1200);
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => { if (active) { if (!d || d.error) setData(getFallbackData()); else setData(d); } })
      .catch(() => { if (active) setData(getFallbackData()); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); };
  }, []);

  const go = (k: SectionKey) => { setSection(k); setMobileOpen(false); setMoreOpen(false); play("open"); };

  const renderSection = () => {
    if (!data) return <LoadingBlock />;
    switch (section) {
      case "home": return <HomeSection data={data} onNavigate={go} />;
      case "network": return <NetworkSection />;
      case "log": return <LogSection data={data} />;
      case "projects": return <ProjectsSection data={data} onNavigate={(k) => go(k as SectionKey)} />;
      case "investments": return <InvestmentsSection data={data} />;
      case "vault": return <VaultSection data={data} />;
      case "invoices": return <InvoicesSection data={data} onNavigate={(k) => go(k as SectionKey)} />;
      case "members": return <MembersSection data={data} />;
      case "messages": return <MessagesSection data={data} />;
      case "archive": return <ArchiveSection data={data} />;
      case "ladder": return <LadderSection data={data} />;
      case "identity": return <IdentitySection />;
      case "goals": return <GoalsSection />;
      case "rules": return <RulesSection />;
      case "features": return <FeaturesSection />;
      case "payments": return <PaymentsSection />;
      case "activity": return <ActivitySection data={data} />;
      case "vip": return <VipSection />;
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#050608]" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* ===== Top Navigation ===== */}
      <nav className="sticky top-0 z-50 w-full">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">

          {/* Logo */}
          <button onClick={() => go("home")} className="group flex items-center gap-2.5 shrink-0" onMouseEnter={() => play("hover")}>
            <Logo size={24} />
            <div className="text-left leading-none hidden sm:block">
              <div className="text-[0.88rem] font-bold tracking-[0.15em] text-[#eaeef5] transition-colors group-hover:text-white" style={{ fontFamily: "var(--font-luxury)" }}>OWNERS OF IMPACT</div>
              <div className="mt-0.5 text-[0.5rem] tracking-[0.28em] text-[#7f8896]" style={{ fontFamily: "var(--font-ibm-mono)" }}>EST. 2012</div>
            </div>
          </button>

          {/* Center nav — 5 primary items + More dropdown */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            {PRIMARY_NAV.map((item) => {
              const active = section === item.key;
              return (
                <button key={item.key} onClick={() => go(item.key)} onMouseEnter={() => play("hover")} className="group relative py-2 shrink-0">
                  <span className={`text-[0.95rem] tracking-[0.1em] transition-all duration-250 ${active ? "text-white" : "text-[#7f8896] group-hover:text-[#eaeef5]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 700, textShadow: active ? "0 0 16px rgba(195,201,211,0.35)" : "none" }}>
                    {t(item.labelKey, lang)}
                  </span>
                  {active && <span className="absolute bottom-0 left-0 h-[2.5px] w-full bg-gradient-to-r from-transparent via-[#eaeef5] to-transparent" style={{ boxShadow: "0 0 8px rgba(195,201,211,0.5)" }} />}
                  {!active && <span className="absolute bottom-0 left-1/2 h-[2.5px] w-0 bg-gradient-to-r from-transparent via-[#c3c9d3] to-transparent transition-all duration-250 -translate-x-1/2 group-hover:w-full group-hover:left-0 group-hover:translate-x-0" />}
                </button>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} className="relative shrink-0">
              <button onClick={() => { setMoreOpen(!moreOpen); play("click"); }} onMouseEnter={() => play("hover")} className="group relative py-2 flex items-center gap-1.5">
                <span className={`text-[0.95rem] tracking-[0.1em] transition-all duration-250 ${SECONDARY_NAV.some((s) => s.key === section) || moreOpen ? "text-white" : "text-[#7f8896] group-hover:text-[#eaeef5]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 700 }}>
                  {t("nav.more", lang)}
                </span>
                <ChevronDown size={14} className={`text-[#7f8896] transition-transform duration-250 ${moreOpen ? "rotate-180" : ""}`} />
                {(SECONDARY_NAV.some((s) => s.key === section) || moreOpen) && <span className="absolute bottom-0 left-0 h-[2.5px] w-full bg-gradient-to-r from-transparent via-[#eaeef5] to-transparent" />}
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-3 min-w-[200px] max-h-[400px] overflow-y-auto scroll-thin rounded-xl border border-[#1a1d22] bg-[#0a0b0e]/95 backdrop-blur-xl py-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                  >
                    {SECONDARY_NAV.map((item) => {
                      const active = section === item.key;
                      return (
                        <button key={item.key} onClick={() => go(item.key)} onMouseEnter={() => play("hover")}
                          className={`block w-full px-4 py-2 text-left text-[0.84rem] tracking-[0.06em] transition-colors duration-200 ${active ? "text-[#eaeef5] bg-white/[0.04]" : "text-[#7f8896] hover:text-[#eaeef5] hover:bg-white/[0.02]"}`}
                          style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                          {t(item.labelKey, lang)}
                        </button>
                      );
                    })}
                    <div className="my-1.5 mx-3 h-px bg-[#1a1d22]" />
                    <button onClick={() => { play("reject"); onLogout(); }} onMouseEnter={() => play("hover")}
                      className="block w-full px-4 py-2 text-left text-[0.84rem] tracking-[0.06em] text-[#565d68] hover:text-[#8b95a5] transition-colors duration-200"
                      style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                      {t("nav.logout", lang)}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Language + Currency + Sound + Mobile */}
          <div className="flex items-center gap-3 shrink-0">
            {MONEY.includes(section) && (
              <div className="hidden sm:flex items-center gap-0.5">
                {(["CHF", "USD", "BTC"] as const).map((c) => (
                  <button key={c} onClick={() => setCurrency(c)} className={`text-[0.68rem] tracking-[0.1em] px-2 py-1 transition-colors duration-250 ${currency === c ? "text-[#eaeef5]" : "text-[#565d68] hover:text-[#aeb6c2]"}`} style={{ fontFamily: "var(--font-ibm-mono)" }}>{c}</button>
                ))}
              </div>
            )}

            {/* Language Switcher */}
            <button onClick={() => { setLang(lang === "en" ? "ar" : "en"); play("click"); }} onMouseEnter={() => play("hover")} className="flex items-center gap-1.5 text-[0.72rem] tracking-wide text-[#8b95a5] hover:text-[#eaeef5] transition-colors duration-250 border border-white/[0.08] rounded-lg px-2.5 py-1.5 hover:border-[#c3c9d3]/25">
              <Globe size={13} />
              <span style={{ fontFamily: "var(--font-ibm-mono)" }}>{lang === "en" ? "EN" : "ع"}</span>
            </button>

            <button onClick={toggleSound} onMouseEnter={() => play("hover")} className="text-[#8b95a5] hover:text-[#eaeef5] transition-colors duration-250" aria-label="Sound">
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button onClick={() => { setMobileOpen(!mobileOpen); play("click"); }} className="lg:hidden text-[#aeb6c2]" aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[#050608]" />
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="lg:hidden overflow-hidden border-b border-white/[0.06] bg-[#080a0e]/95 backdrop-blur-xl">
            <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-1">
              {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
                <button key={item.key} onClick={() => go(item.key)} className={`text-left py-2.5 text-[0.92rem] tracking-[0.06em] transition-colors ${section === item.key ? "text-[#eaeef5]" : "text-[#8b95a5]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                  {t(item.labelKey, lang)}
                </button>
              ))}
              <div className="col-span-2 my-2 h-px bg-white/[0.06]" />
              <button onClick={() => { play("reject"); onLogout(); }} className="text-left py-2.5 text-[0.92rem] text-[#7f8896]" style={{ fontFamily: "var(--font-luxury)" }}>{t("nav.logout", lang)}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full px-5 py-7 sm:px-8 lg:px-10">
        <AnimatePresence mode="wait">
          <motion.div key={section} initial={{ opacity: 0, y: 16, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Status Bar */}
      <StatusBar
        coordinates={{ lat: camera.lat, lon: camera.lon }}
        zoom={camera.zoom}
        entities={data?.members.length}
        connections={data?.members.reduce((s, m) => s + (m.visible ? 1 : 0), 0)}
        fps={fps}
      />
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="anim-spin-cw h-10 w-10 rounded-full border border-dashed border-white/15" />
      <span className="eyebrow">Loading system…</span>
    </div>
  );
}
