"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectsGate from "@/components/projects/ProjectsGate";
import PerformanceCard from "@/components/projects/PerformanceCard";
import DigitalProjects from "@/components/projects/DigitalProjects";
import type { AppData } from "@/lib/types";

type Tab = "digital" | "physical" | "submit" | null;

const TABS: { key: Exclude<Tab, null>; label: string }[] = [
  { key: "digital", label: "Digital Projects" },
  { key: "physical", label: "Physical Projects" },
  { key: "submit", label: "Submit a Project" },
];

/**
 * قسم المشاريع.
 *
 * بوابة دخول ← لوحة المشاريع. اللوحة تحتوي على ثلاثة خيارات أفقية
 * بأسلوب القائمة العلوية نفسه، وبطاقة الأداء مثبّتة في أقصى اليسار.
 * اختيار أحد الخيارات يفتح صفحة مستقلة داخل القسم نفسه.
 */
export default function ProjectsSection({
  data: _data,
  onNavigate,
}: {
  data: AppData;
  onNavigate?: (section: string) => void;
}) {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<Tab>(null);

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
          dir="ltr"
        >
          {/* ===== الخيارات الثلاثة ===== */}
          <nav className="mb-8 flex flex-wrap items-center gap-x-9 gap-y-3 border-b border-white/[0.06] pb-5">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(active ? null : t.key)}
                  className="group relative shrink-0 py-2"
                >
                  <span
                    className={[
                      "text-[clamp(0.72rem,1.5vw,0.95rem)] tracking-[0.2em] transition-colors duration-300",
                      active
                        ? "text-white"
                        : "text-[#aab3c1] group-hover:text-[#eaeef5]",
                    ].join(" ")}
                    style={{
                      fontFamily: "var(--font-luxury)",
                      textShadow: active
                        ? "0 0 14px rgba(255,255,255,0.5)"
                        : undefined,
                    }}
                  >
                    {t.label}
                  </span>

                  {/* نفس معالجة التبويب النشط في القائمة العلوية */}
                  {active ? (
                    <span
                      className="absolute bottom-0 left-0 h-[2.5px] w-full bg-gradient-to-r from-transparent via-[#eaeef5] to-transparent"
                      style={{ boxShadow: "0 0 8px rgba(195,201,211,0.5)" }}
                    />
                  ) : (
                    <span className="absolute bottom-0 left-1/2 h-[2.5px] w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c3c9d3] to-transparent transition-all duration-250 group-hover:left-0 group-hover:w-full group-hover:translate-x-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ===== المحتوى ===== */}
          <AnimatePresence mode="wait">
            {tab === "digital" ? (
              <motion.div
                key="digital"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <DigitalProjects onGoArchive={() => onNavigate?.("archive")} />
              </motion.div>
            ) : tab === "physical" || tab === "submit" ? (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-[36vh] items-center justify-center"
              >
                <p
                  className="text-[0.55rem] uppercase tracking-[0.32em] text-[#5d6675]"
                  style={{ fontFamily: "var(--font-ibm-mono)" }}
                >
                  Section pending
                </p>
              </motion.div>
            ) : (
              /* اللوحة الافتراضية — بطاقة الأداء في أقصى اليسار */
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="grid auto-rows-min grid-cols-1 gap-5 md:grid-cols-8 lg:grid-cols-12"
              >
                <div className="md:col-span-5 lg:col-span-4">
                  <PerformanceCard />
                </div>
                {/* الأعمدة المتبقية محجوزة لبطاقات قادمة */}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
