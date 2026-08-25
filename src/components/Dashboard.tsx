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

// Sections that carry a discreet "members only" hint in the navigation
const RESTRICTED: Set<SectionKey> = new Set(["archive", "vip", "vault", "invoices", "ladder", "payments", "members"]);

export default function Dashboard({
  onLogout,
  demoMode = false,
}: {
  onLogout: () => void;
  demoMode?: boolean;
}) {
  const [section, setSection] = useState<SectionKey>("home");
  const [data, setData] = useState<AppData | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Scroll-aware header (transparent at the top → glass once scrolled)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const go = (k: SectionKey) => {
    setSection(k);
    setMobileOpen(false);
    setMoreOpen(false);
    try { play("open"); } catch { /* never block navigation */ }
  };

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
    <div
      className="relative flex min-h-screen w-full flex-col bg-[#060604]"
      dir={lang === "ar" ? "rtl" : "ltr"}
      data-demo={demoMode ? "true" : "false"}
      data-screen="dashboard"
      style={{ pointerEvents: "auto", position: "relative", zIndex: 10 }}
    >
      {demoMode && (
        <div
          className="relative z-[50] flex items-center justify-center gap-2 border-b border-[#c8a76b]/20 bg-[#0c0b08] px-4 py-1.5"
          role="status"
          style={{ pointerEvents: "none" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#c8a76b]" style={{ boxShadow: "0 0 6px #c8a76b" }} />
          <span
            className="text-[0.55rem] uppercase tracking-[0.28em] text-[#c8a76b]/90"
            style={{ fontFamily: "var(--font-ibm-mono)" }}
          >
            {lang === "ar" ? "نسخة تجريبية · DEMO MODE" : "DEMO MODE · READ-ONLY PREVIEW"}
          </span>
        </div>
      )}
      {/* ===== Top Navigation — discreet, gold-hairline, scroll-aware ===== */}
      <nav
        className={`sticky top-0 z-[100] w-full transition-all duration-500 ${scrolled ? "border-b border-[#c8a76b]/10 bg-[#060604]/85 backdrop-blur-xl" : "border-b border-transparent bg-[#060604]/70 backdrop-blur-md"}`}
        style={{ pointerEvents: "auto" }}
        data-nav="primary"
      >
        <div className="relative z-[101] flex items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8" style={{ pointerEvents: "auto" }}>

          {/* Logo / Mark */}
          <button type="button" onClick={() => go("home")} className="group flex items-center gap-3 shrink-0" onMouseEnter={() => play("hover")}>
            <Logo size={22} />
            <div className="text-left leading-none hidden sm:block">
              <div className="text-[0.9rem] font-semibold tracking-[0.18em] text-[#ece9e0] transition-colors duration-300 group-hover:text-white" style={{ fontFamily: "var(--font-luxury)" }}>OWNERS OF IMPACT</div>
              <div className="mt-1 text-[0.46rem] uppercase tracking-[0.34em] text-[#c8a76b]/70" style={{ fontFamily: "var(--font-ibm-mono)" }}>EST. 2012 · MEMBERS ONLY</div>
            </div>
          </button>

          {/* Center nav */}
          <div className="hidden lg:flex items-center gap-7 xl:gap-9">
            {PRIMARY_NAV.map((item) => {
              const active = section === item.key;
              const restricted = RESTRICTED.has(item.key);
              return (
                <button type="button" key={item.key} onClick={() => go(item.key)} onMouseEnter={() => play("hover")} className="group relative py-2 shrink-0">
                  <span className={`text-[0.84rem] uppercase tracking-[0.16em] transition-all duration-300 ${active ? "text-[#e8c992]" : "text-[#8b8577] group-hover:text-[#ece9e0]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 600, textShadow: active ? "0 0 18px rgba(216,180,120,0.28)" : "none" }}>
                    {t(item.labelKey, lang)}
                  </span>
                  {restricted && (
                    <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rotate-45" style={{ background: "#c8a76b", boxShadow: "0 0 6px rgba(200,167,107,0.8)" }} />
                  )}
                  {active && <span className="absolute bottom-0 left-0 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #c8a76b 40%, #e8c992 60%, transparent)", boxShadow: "0 0 6px rgba(216,180,120,0.5)" }} />}
                  {!active && <span className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-[#c8a76b]/60 transition-all duration-300 group-hover:w-full group-hover:left-0 group-hover:translate-x-0" />}
                </button>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} className="relative shrink-0">
              <button type="button" onClick={() => { setMoreOpen(!moreOpen); play("click"); }} onMouseEnter={() => play("hover")} className="group relative py-2 flex items-center gap-1.5">
                <span className={`text-[0.84rem] uppercase tracking-[0.16em] transition-all duration-300 ${SECONDARY_NAV.some((s) => s.key === section) || moreOpen ? "text-[#e8c992]" : "text-[#8b8577] group-hover:text-[#ece9e0]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                  {t("nav.more", lang)}
                </span>
                <ChevronDown size={13} className={`text-[#c8a76b]/70 transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`} />
                {(SECONDARY_NAV.some((s) => s.key === section) || moreOpen) && <span className="absolute bottom-0 left-0 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #c8a76b 40%, #e8c992 60%, transparent)" }} />}
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.26, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-3 min-w-[220px] max-h-[400px] overflow-y-auto scroll-thin rounded-lg border border-[#c8a76b]/15 bg-[#0c0b08]/95 backdrop-blur-xl py-2 shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
                  >
                    {SECONDARY_NAV.map((item) => {
                      const active = section === item.key;
                      const restricted = RESTRICTED.has(item.key);
                      return (
                        <button type="button" key={item.key} onClick={() => go(item.key)} onMouseEnter={() => play("hover")}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[0.8rem] tracking-[0.08em] transition-colors duration-200 ${active ? "text-[#e8c992] bg-[#c8a76b]/[0.06]" : "text-[#a39d8e] hover:text-[#ece9e0] hover:bg-[#c8a76b]/[0.03]"}`}
                          style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                          <span>{t(item.labelKey, lang)}</span>
                          {restricted && <span className="text-[0.44rem] uppercase tracking-[0.18em] text-[#c8a76b]/60" style={{ fontFamily: "var(--font-ibm-mono)" }}>· · ·</span>}
                        </button>
                      );
                    })}
                    <div className="my-1.5 mx-3 h-px bg-[#c8a76b]/10" />
                    <button type="button" onClick={() => { play("reject"); onLogout(); }} onMouseEnter={() => play("hover")}
                      className="block w-full px-4 py-2.5 text-left text-[0.8rem] tracking-[0.08em] text-[#57534a] hover:text-[#a39d8e] transition-colors duration-200"
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
                  <button type="button" key={c} onClick={() => setCurrency(c)} className={`text-[0.66rem] tracking-[0.12em] px-2 py-1 transition-colors duration-250 ${currency === c ? "text-[#e8c992]" : "text-[#57534a] hover:text-[#a39d8e]"}`} style={{ fontFamily: "var(--font-ibm-mono)" }}>{c}</button>
                ))}
              </div>
            )}

            {/* Language Switcher */}
            <button type="button" onClick={() => { setLang(lang === "en" ? "ar" : "en"); play("click"); }} onMouseEnter={() => play("hover")} className="flex items-center gap-1.5 text-[0.7rem] tracking-wide text-[#8b8577] hover:text-[#e8c992] transition-colors duration-300 border border-[#c8a76b]/15 rounded-md px-2.5 py-1.5 hover:border-[#c8a76b]/40">
              <Globe size={13} />
              <span style={{ fontFamily: "var(--font-ibm-mono)" }}>{lang === "en" ? "EN" : "ع"}</span>
            </button>

            <button type="button" onClick={toggleSound} onMouseEnter={() => play("hover")} className="text-[#8b8577] hover:text-[#e8c992] transition-colors duration-300" aria-label="Sound">
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button type="button" onClick={() => { setMobileOpen(!mobileOpen); play("click"); }} className="lg:hidden text-[#a39d8e]" aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-b border-[#c8a76b]/10 bg-[#0a0a08]/95 backdrop-blur-xl"
          >
            <div className="px-6 py-6">
              <div className="mb-3 text-[0.46rem] uppercase tracking-[0.32em] text-[#c8a76b]/60" style={{ fontFamily: "var(--font-ibm-mono)" }}>{lang === "ar" ? "أقسام النادي" : "The House"}</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => {
                  const on = section === item.key;
                  const restricted = RESTRICTED.has(item.key);
                  return (
                    <button type="button" key={item.key} onClick={() => go(item.key)} className={`relative text-left py-2.5 pr-6 text-[0.92rem] tracking-[0.06em] transition-colors ${on ? "text-[#e8c992]" : "text-[#8b8577]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                      {t(item.labelKey, lang)}
                      {restricted && <span className="absolute right-1 top-1/2 -translate-y-1/2 h-1 w-1 rotate-45" style={{ background: "#c8a76b" }} />}
                    </button>
                  );
                })}
              </div>
              <div className="my-4 h-px bg-[#c8a76b]/10" />
              <button type="button" onClick={() => { play("reject"); onLogout(); }} className="text-left text-[0.92rem] text-[#57534a]" style={{ fontFamily: "var(--font-luxury)" }}>{t("nav.logout", lang)}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full px-5 py-7 sm:px-8 lg:px-10" style={{ pointerEvents: "auto" }}>
        <div key={section} className="relative z-10" style={{ pointerEvents: "auto" }}>
          {renderSection()}
        </div>
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
