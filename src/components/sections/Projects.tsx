"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectsGate from "@/components/projects/ProjectsGate";
import ProjectsDashboard from "@/components/projects/ProjectsDashboard";
import TrackBrowser from "@/components/projects/TrackBrowser";
import SubmitProject from "@/components/projects/SubmitProject";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { AppData } from "@/lib/types";

type Tab = "digital" | "physical" | "submit" | null;

/**
 * قسم المشاريع.
 *
 * بوابة دخول ← لوحة عامة تحمل بطاقة الأداء، مع ثلاثة خيارات
 * متوسّطة أفقياً تفتح كل منها صفحة مستقلة داخل القسم نفسه.
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

  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>(null);

  const TABS: { key: Exclude<Tab, null>; label: string }[] = [
    { key: "digital", label: t("pj.digital", lang) },
    { key: "physical", label: t("pj.physical", lang) },
    { key: "submit", label: t("pj.submit", lang) },
  ];

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <ProjectsGate key="gate" onEnter={() => setEntered(true)} />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[60vh] w-full"
          dir={ar ? "rtl" : "ltr"}
        >
          {/* ===== الخيارات — متوسّطة ===== */}
          <nav className="mb-9 flex flex-wrap items-center justify-center gap-x-12 gap-y-3 border-b border-white/[0.06] pb-5 sm:gap-x-16">
            {TABS.map((x) => {
              const active = tab === x.key;
              return (
                <button
                  key={x.key}
                  type="button"
                  onClick={() => setTab(active ? null : x.key)}
                  className="group relative shrink-0 py-2"
                >
                  <span
                    className={[
                      "text-[clamp(0.85rem,1.8vw,1.12rem)] tracking-[0.2em] transition-all duration-400",
                      active ? "text-white" : "text-[#b3bcc9] group-hover:text-white",
                    ].join(" ")}
                    style={{
                      fontFamily: "var(--font-luxury)",
                      textShadow: active
                        ? "0 0 16px rgba(255,255,255,0.55), 0 0 40px rgba(255,255,255,0.22)"
                        : undefined,
                    }}
                  >
                    {x.label}
                  </span>

                  {active ? (
                    <span
                      className="absolute bottom-0 left-0 h-[2.5px] w-full bg-gradient-to-r from-transparent via-[#eaeef5] to-transparent"
                      style={{ boxShadow: "0 0 8px rgba(195,201,211,0.5)" }}
                    />
                  ) : (
                    <span className="absolute bottom-0 left-1/2 h-[2.5px] w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c3c9d3] to-transparent transition-all duration-250 group-hover:left-0 group-hover:w-full group-hover:translate-x-0" />
                  )}

                  {/* توهج خفيف عند التحويم */}
                  <span
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-6 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(60% 100% at 50% 100%, rgba(255,255,255,0.10), transparent 70%)",
                    }}
                  />
                </button>
              );
            })}
          </nav>

          {/* ===== المحتوى ===== */}
          <AnimatePresence mode="wait">
            {tab === "digital" || tab === "physical" ? (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <SubmitProject />
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProjectsDashboard
                  data={_data}
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
