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
import ObservatorySection from "@/components/sections/Observatory";
import DestinationPortal from "@/components/DestinationPortal";
import type { DeepLink } from "@/lib/destinations";

export type SectionKey =
  | "home" | "network" | "log"
  | "projects" | "investments"
  | "vault" | "invoices"
  | "members" | "messages"
  | "archive" | "ladder"
  | "identity" | "goals" | "rules"
  | "features" | "payments" | "activity" | "vip"
  | "observatory";

// Primary nav — keep short so labels never collide on laptop widths
const PRIMARY_NAV: { key: SectionKey; labelKey: string }[] = [
  { key: "home", labelKey: "nav.home" },
  { key: "network", labelKey: "nav.network" },
  { key: "observatory", labelKey: "nav.observatory" },
  { key: "projects", labelKey: "nav.projects" },
  { key: "messages", labelKey: "nav.messages" },
  { key: "archive", labelKey: "nav.archive" },
];

// Secondary nav — everything else goes into the "More" dropdown
const SECONDARY_NAV: { key: SectionKey; labelKey: string }[] = [
  { key: "investments", labelKey: "nav.investments" },
  { key: "ladder", labelKey: "nav.ladder" },
  { key: "vip", labelKey: "nav.vip" },
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
const RESTRICTED: Set<SectionKey> = new Set(["archive", "vip", "vault", "invoices", "ladder", "payments", "members", "observatory"]);
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
  /** Hub = first screen after login: no header chrome, command globe only */
  const [hubMode, setHubMode] = useState(true);
  const [portalOpen, setPortalOpen] = useState(false);
  const [deepLink, setDeepLink] = useState<DeepLink | undefined>(undefined);

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

  const go = (k: SectionKey, deep?: DeepLink) => {
    setDeepLink(deep);
    setSection(k);
    setHubMode(false);
    setPortalOpen(false);
    setMobileOpen(false);
    setMoreOpen(false);
    try { play("open"); } catch { /* never block navigation */ }
  };

  const openPortal = () => {
    setPortalOpen(true);
  };

  const returnToHub = () => {
    setPortalOpen(false);
    setHubMode(true);
    setSection("home");
    setDeepLink(undefined);
    setMobileOpen(false);
    setMoreOpen(false);
  };

  const renderSection = () => {
    if (!data) return <LoadingBlock />;
    switch (section) {
      case "home": return <HomeSection data={data} onNavigate={go} onOpenDestinations={openPortal} hubMode={hubMode} />;
      case "network": return <NetworkSection />;
      case "log": return <LogSection data={data} />;
      case "projects": return <ProjectsSection data={data} onNavigate={(k) => go(k as SectionKey)} deepLink={deepLink} />;
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
      case "observatory": return <ObservatorySection deepLink={deepLink} />;
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-clip bg-[#050505]"
      dir={lang === "ar" ? "rtl" : "ltr"}
      data-demo={demoMode ? "true" : "false"}
      data-screen="dashboard"
      style={{ pointerEvents: "auto", position: "relative", zIndex: 10 }}
    >
      {demoMode && (
        <div
          className="relative z-[50] flex items-center justify-center gap-2 border-b border-[#9a9a9a]/20 bg-[#0a0a0a] px-3 py-1.5 sm:px-4"
          role="status"
          style={{ pointerEvents: "none" }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a9a9a]" style={{ boxShadow: "0 0 6px #9a9a9a" }} />
          <span
            className="max-w-full truncate text-[0.5rem] uppercase tracking-[0.16em] text-[#9a9a9a]/90 sm:text-[0.55rem] sm:tracking-[0.22em]"
            style={{ fontFamily: "var(--font-ibm-mono)" }}
          >
            {lang === "ar" ? "نسخة تجريبية · DEMO MODE" : "DEMO MODE · READ-ONLY PREVIEW"}
          </span>
        </div>
      )}
      {/* ===== Top Navigation — hidden on hub (first screen after login) ===== */}
      {!hubMode && (
      <>
      <nav
        className={`sticky top-0 z-[100] w-full max-w-[100vw] transition-all duration-500 ${scrolled ? "border-b border-[#9a9a9a]/10 bg-[#050505]/85 backdrop-blur-xl" : "border-b border-transparent bg-[#050505]/70 backdrop-blur-md"}`}
        style={{ pointerEvents: "auto" }}
        data-nav="primary"
      >
        <div className="relative z-[101] mx-auto flex w-full max-w-[100rem] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5 lg:px-6 xl:px-8" style={{ pointerEvents: "auto" }}>

          {/* Logo / Mark */}
          <button type="button" onClick={() => returnToHub()} className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-3" onMouseEnter={() => play("hover")}>
            <Logo size={22} />
            <div className="hidden min-w-0 text-start leading-none md:block">
              <div className="truncate text-[0.72rem] font-semibold tracking-[0.12em] text-[#e8e8e8] transition-colors duration-300 group-hover:text-white lg:text-[0.82rem] lg:tracking-[0.14em] xl:text-[0.9rem] xl:tracking-[0.16em]" style={{ fontFamily: "var(--font-luxury)" }}>OWNERS OF IMPACT</div>
              <div className="mt-1 truncate text-[0.42rem] uppercase tracking-[0.2em] text-[#9a9a9a]/70 lg:tracking-[0.28em]" style={{ fontFamily: "var(--font-ibm-mono)" }}>EST. 2012 · MEMBERS ONLY</div>
            </div>
          </button>

          {/* Center nav — desktop only; shrink gaps so labels never collide */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex xl:gap-5 2xl:gap-7">
            {PRIMARY_NAV.map((item) => {
              const active = section === item.key;
              const restricted = RESTRICTED.has(item.key);
              return (
                <button type="button" key={item.key} onClick={() => go(item.key)} onMouseEnter={() => play("hover")} className="group relative max-w-[7.5rem] shrink py-2 xl:max-w-none">
                  <span className={`nav-label block text-[0.68rem] uppercase tracking-[0.08em] transition-all duration-300 xl:text-[0.78rem] xl:tracking-[0.12em] 2xl:text-[0.84rem] 2xl:tracking-[0.14em] ${active ? "text-[#c0c0c0]" : "text-[#8b8577] group-hover:text-[#e8e8e8]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 600, textShadow: active ? "0 0 18px rgba(170,170,170,0.28)" : "none" }}>
                    {t(item.labelKey, lang)}
                  </span>
                  {restricted && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rotate-45" style={{ background: "#3a3a3a", boxShadow: "0 0 8px rgba(90,90,90,0.85)" }} />
                  )}
                  {active && <span className="absolute bottom-0 left-0 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #9a9a9a 40%, #c0c0c0 60%, transparent)", boxShadow: "0 0 6px rgba(170,170,170,0.5)" }} />}
                  {!active && <span className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-[#9a9a9a]/60 transition-all duration-300 group-hover:left-0 group-hover:w-full group-hover:translate-x-0" />}
                </button>
              );
            })}

            {/* More dropdown */}
            <div ref={moreRef} className="relative shrink-0">
              <button type="button" onClick={() => { setMoreOpen(!moreOpen); play("click"); }} onMouseEnter={() => play("hover")} className="group relative flex items-center gap-1 py-2 xl:gap-1.5">
                <span className={`text-[0.68rem] uppercase tracking-[0.08em] transition-all duration-300 xl:text-[0.78rem] xl:tracking-[0.12em] 2xl:text-[0.84rem] ${SECONDARY_NAV.some((s) => s.key === section) || moreOpen ? "text-[#c0c0c0]" : "text-[#8b8577] group-hover:text-[#e8e8e8]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                  {t("nav.more", lang)}
                </span>
                <ChevronDown size={13} className={`text-[#9a9a9a]/70 transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`} />
                {(SECONDARY_NAV.some((s) => s.key === section) || moreOpen) && <span className="absolute bottom-0 left-0 h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #9a9a9a 40%, #c0c0c0 60%, transparent)" }} />}
              </button>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                    transition={{ duration: 0.26, ease: [0.2, 0.7, 0.2, 1] }}
                    className="absolute end-0 top-full z-[120] mt-3 max-h-[min(400px,70vh)] w-[min(260px,calc(100vw-2rem))] overflow-y-auto scroll-thin rounded-lg border border-[#9a9a9a]/15 bg-[#0a0a0a]/95 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl"
                  >
                    {SECONDARY_NAV.map((item) => {
                      const active = section === item.key;
                      const restricted = RESTRICTED.has(item.key);
                      return (
                        <button type="button" key={item.key} onClick={() => go(item.key)} onMouseEnter={() => play("hover")}
                          className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[0.8rem] tracking-[0.06em] transition-colors duration-200 ${active ? "bg-[#9a9a9a]/[0.06] text-[#c0c0c0]" : "text-[#8a8a8a] hover:bg-[#9a9a9a]/[0.03] hover:text-[#e8e8e8]"}`}
                          style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                          <span className="min-w-0 truncate">{t(item.labelKey, lang)}</span>
                          {restricted && <span className="shrink-0 text-[0.44rem] uppercase tracking-[0.18em] text-[#9a9a9a]/60" style={{ fontFamily: "var(--font-ibm-mono)" }}>· · ·</span>}
                        </button>
                      );
                    })}
                    <div className="mx-3 my-1.5 h-px bg-[#9a9a9a]/10" />
                    <button type="button" onClick={() => { play("reject"); onLogout(); }} onMouseEnter={() => play("hover")}
                      className="block w-full px-4 py-2.5 text-left text-[0.8rem] tracking-[0.06em] text-[#4a4a4a] transition-colors duration-200 hover:text-[#8a8a8a]"
                      style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                      {t("nav.logout", lang)}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right controls */}
          <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            {MONEY.includes(section) && (
              <div className="hidden items-center gap-0.5 sm:flex">
                {(["CHF", "USD", "BTC"] as const).map((c) => (
                  <button type="button" key={c} onClick={() => setCurrency(c)} className={`px-1.5 py-1 text-[0.62rem] tracking-[0.1em] transition-colors duration-250 sm:px-2 sm:text-[0.66rem] ${currency === c ? "text-[#c0c0c0]" : "text-[#4a4a4a] hover:text-[#8a8a8a]"}`} style={{ fontFamily: "var(--font-ibm-mono)" }}>{c}</button>
                ))}
              </div>
            )}

            <button type="button" onClick={() => { setLang(lang === "en" ? "ar" : "en"); play("click"); }} onMouseEnter={() => play("hover")} className="flex items-center gap-1 rounded-md border border-[#9a9a9a]/15 px-2 py-1.5 text-[0.65rem] tracking-wide text-[#8b8577] transition-colors duration-300 hover:border-[#9a9a9a]/40 hover:text-[#c0c0c0] sm:gap-1.5 sm:px-2.5 sm:text-[0.7rem]">
              <Globe size={13} />
              <span style={{ fontFamily: "var(--font-ibm-mono)" }}>{lang === "en" ? "EN" : "ع"}</span>
            </button>

            <button type="button" onClick={toggleSound} onMouseEnter={() => play("hover")} className="p-1 text-[#8b8577] transition-colors duration-300 hover:text-[#c0c0c0]" aria-label="Sound">
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button type="button" onClick={() => { setMobileOpen(!mobileOpen); play("click"); }} className="p-1 text-[#8a8a8a] lg:hidden" aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile / tablet menu (< lg) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-[#9a9a9a]/10 bg-[#0a0a0a]/95 backdrop-blur-xl lg:hidden"
          >
            <div className="max-h-[min(70vh,560px)] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              <div className="mb-3 text-[0.46rem] uppercase tracking-[0.2em] text-[#9a9a9a]/60 sm:tracking-[0.28em]" style={{ fontFamily: "var(--font-ibm-mono)" }}>{lang === "ar" ? "أقسام النادي" : "The House"}</div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 xs:grid-cols-2 sm:grid-cols-2">
                {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => {
                  const on = section === item.key;
                  const restricted = RESTRICTED.has(item.key);
                  return (
                    <button type="button" key={item.key} onClick={() => go(item.key)} className={`relative min-w-0 py-2.5 pe-5 text-start text-[0.88rem] tracking-[0.04em] transition-colors sm:text-[0.92rem] ${on ? "text-[#c0c0c0]" : "text-[#8b8577]"}`} style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                      <span className="block truncate">{t(item.labelKey, lang)}</span>
                      {restricted && <span className="absolute end-1 top-1/2 h-1 w-1 -translate-y-1/2 rotate-45" style={{ background: "#3a3a3a", boxShadow: "0 0 6px rgba(90,90,90,0.7)" }} />}
                    </button>
                  );
                })}
              </div>
              <div className="my-4 h-px bg-[#9a9a9a]/10" />
              <button type="button" onClick={() => { play("reject"); onLogout(); }} className="text-start text-[0.92rem] text-[#4a4a4a]" style={{ fontFamily: "var(--font-luxury)" }}>{t("nav.logout", lang)}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}

      {/* Main Content */}
      <main className={`relative z-10 w-full min-w-0 flex-1 ${hubMode ? "px-3 py-4 sm:px-5 sm:py-5 md:px-6" : "px-3 py-5 sm:px-5 sm:py-7 md:px-6 lg:px-8 xl:px-10"}`} style={{ pointerEvents: "auto" }}>
        <div key={section} className="relative z-10 mx-auto w-full min-w-0 max-w-[100rem]" style={{ pointerEvents: "auto" }}>
          {renderSection()}
        </div>
      </main>

      {/* Destination portal overlay */}
      <DestinationPortal
        open={portalOpen}
        lang={lang === "ar" ? "ar" : "en"}
        onClose={() => {
          setPortalOpen(false);
          // stay on hub if user backs out without choosing
          if (hubMode) return;
        }}
        onSelect={(section, deep) => go(section as SectionKey, deep)}
      />

      {/* Status Bar — hidden on hub */}
      {!hubMode && (
      <StatusBar
        coordinates={{ lat: camera.lat, lon: camera.lon }}
        zoom={camera.zoom}
        entities={data?.members.length}
        connections={data?.members.reduce((s, m) => s + (m.visible ? 1 : 0), 0)}
        fps={fps}
      />
      )}
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
