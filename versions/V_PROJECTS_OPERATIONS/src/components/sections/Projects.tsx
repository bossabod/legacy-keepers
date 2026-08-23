"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectsGate from "@/components/projects/ProjectsGate";
import ProjectOperations from "@/components/projects/ProjectOperations";
import TrackBrowser from "@/components/projects/TrackBrowser";
import SubmitProject from "@/components/projects/SubmitProject";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { AppData } from "@/lib/types";

type Tab = "operations" | "digital" | "physical" | "submit";

/**
 * PROJECTS lands on the real Project Operations page (globe + dashboards).
 * Gate and track browsers stay available; they are not deleted.
 */
export default function ProjectsSection({
  data: _data,
  onNavigate,
}: {
  data: AppData;
  onNavigate?: (section: string) => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";

  /* Navbar → PROJECTS opens operations immediately. Gate remains reachable. */
  const [showGate, setShowGate] = useState(false);
  const [tab, setTab] = useState<Tab>("operations");

  const tracks: { key: Tab; label: string }[] = [
    { key: "operations", label: ar ? "عمليات المشاريع" : "Project Operations" },
    { key: "digital", label: t("pj.digital", lang) },
    { key: "physical", label: t("pj.physical", lang) },
    { key: "submit", label: t("pj.submit", lang) },
  ];

  return (
    <AnimatePresence mode="wait">
      {showGate ? (
        <ProjectsGate key="gate" onEnter={() => { setShowGate(false); setTab("operations"); }} />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[60vh] w-full"
          dir={ar ? "rtl" : "ltr"}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {tracks.map((item) => {
                const on = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.18em] transition-colors ${
                      on ? "text-[#eef2f7] border-b border-white/40" : "text-[#6d7685] hover:text-[#cdd5e0]"
                    }`}
                    style={{ fontFamily: "var(--font-ibm-mono)" }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowGate(true)}
              className="text-[0.48rem] uppercase tracking-[0.2em] text-[#4a515e] hover:text-[#8b95a5]"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              {ar ? "البوابة" : "Gate"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "digital" || tab === "physical" ? (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <TrackBrowser
                  track={tab}
                  onGoArchive={() => onNavigate?.("archive")}
                  onOpenMessages={() => onNavigate?.("messages")}
                />
              </motion.div>
            ) : tab === "submit" ? (
              <motion.div
                key="submit"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <SubmitProject />
              </motion.div>
            ) : (
              <motion.div
                key="operations"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProjectOperations
                  data={_data}
                  onNavigate={onNavigate}
                  onOpenTrack={(track) => setTab(track)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
