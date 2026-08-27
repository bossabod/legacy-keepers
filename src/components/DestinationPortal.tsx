"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { DESTINATIONS, type DestinationLeaf, type DestinationNode, type DeepLink } from "@/lib/destinations";
import { play } from "@/lib/sound";

type Stage = "root" | "branch";

export default function DestinationPortal({
  open,
  lang,
  onClose,
  onSelect,
}: {
  open: boolean;
  lang: "en" | "ar";
  onClose: () => void;
  onSelect: (section: string, deep?: DeepLink) => void;
}) {
  const ar = lang === "ar";
  const [stage, setStage] = useState<Stage>("root");
  const [branch, setBranch] = useState<DestinationNode | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  // Reset + staggered reveal whenever the portal opens
  useEffect(() => {
    if (!open) return;
    setStage("root");
    setBranch(null);
    setVisibleCount(0);
    const timers: number[] = [];
    // reveal destinations one by one
    DESTINATIONS.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => setVisibleCount(i + 1), 420 + i * 90),
      );
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [open]);

  useEffect(() => {
    if (!open || stage !== "branch" || !branch) return;
    setVisibleCount(0);
    const timers: number[] = [];
    branch.children.forEach((_, i) => {
      timers.push(window.setTimeout(() => setVisibleCount(i + 1), 280 + i * 80));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [open, stage, branch]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (stage === "branch") {
          setStage("root");
          setBranch(null);
        } else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, stage, onClose]);

  const pickBranch = (node: DestinationNode) => {
    try { play("open"); } catch { /* noop */ }
    setBranch(node);
    setStage("branch");
  };

  const pickLeaf = (leaf: DestinationLeaf) => {
    try { play("select"); } catch { /* noop */ }
    onSelect(leaf.section, leaf.deep);
  };

  const back = () => {
    try { play("click"); } catch { /* noop */ }
    if (stage === "branch") {
      setStage("root");
      setBranch(null);
      return;
    }
    onClose();
  };

  const items =
    stage === "root"
      ? DESTINATIONS.map((d) => ({
          id: d.id,
          label: ar ? d.labelAr : d.labelEn,
          onClick: () => pickBranch(d),
        }))
      : (branch?.children ?? []).map((c) => ({
          id: c.id,
          label: ar ? c.labelAr : c.labelEn,
          onClick: () => pickLeaf(c),
        }));

  const title =
    stage === "root"
      ? ar
        ? "أين تريد وجهتك؟"
        : "Where is your destination?"
      : ar
        ? branch?.promptAr
        : branch?.promptEn;

  const subtitle =
    stage === "branch"
      ? ar
        ? branch?.labelAr
        : branch?.labelEn
      : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="destination-portal"
          className="fixed inset-0 z-[200] flex flex-col bg-[#030303]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          dir={ar ? "rtl" : "ltr"}
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Destinations"}
        >
          {/* soft vignette */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 55% at 50% 42%, rgba(20,28,40,0.55) 0%, rgba(3,3,3,0.92) 70%, #000 100%)",
            }}
          />

          {/* back */}
          <div className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
            <button
              type="button"
              onClick={back}
              className="group inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.22em] text-[#7a7a7a] transition-colors hover:text-[#e8e8e8]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <ArrowLeft
                size={14}
                className={`transition-transform duration-300 ${ar ? "rotate-180 group-hover:translate-x-0.5" : "group-hover:-translate-x-0.5"}`}
              />
              {ar ? "العودة" : "Return"}
            </button>
            <span
              className="text-[0.5rem] uppercase tracking-[0.28em] text-[#3a3a3a]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {ar ? "نظام الوجهات" : "DESTINATION SYSTEM"}
            </span>
          </div>

          {/* center content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
            <motion.div
              key={stage + (branch?.id ?? "root")}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl text-center"
            >
              {subtitle && (
                <div
                  className="mb-3 text-[0.55rem] uppercase tracking-[0.32em] text-[#5a5a5a]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {subtitle}
                </div>
              )}
              <h2
                className="text-[clamp(1.5rem,4.5vw,2.6rem)] font-light tracking-[0.06em] text-[#ececec]"
                style={{ fontFamily: "var(--font-luxury)" }}
              >
                {title}
              </h2>
              <div
                className="mx-auto mt-5 h-px w-24 origin-center"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(160,175,200,0.45), transparent)",
                }}
              />
            </motion.div>

            <ul className="mt-10 flex w-full max-w-md flex-col gap-1 sm:mt-12">
              {items.map((item, i) => {
                const show = i < visibleCount;
                return (
                  <motion.li
                    key={item.id}
                    initial={false}
                    animate={{
                      opacity: show ? 1 : 0,
                      y: show ? 0 : 10,
                    }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <button
                      type="button"
                      onClick={item.onClick}
                      onMouseEnter={() => {
                        try { play("hover"); } catch { /* noop */ }
                      }}
                      className="group flex w-full items-center justify-between gap-4 rounded-md px-4 py-3.5 text-start transition-colors duration-300 hover:bg-white/[0.03]"
                      disabled={!show}
                    >
                      <span
                        className="text-[clamp(1rem,2.4vw,1.25rem)] font-light tracking-[0.08em] text-[#b8b8b8] transition-colors duration-300 group-hover:text-[#f0f0f0]"
                        style={{ fontFamily: "var(--font-luxury)" }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-[0.55rem] uppercase tracking-[0.28em] text-[#3f3f3f] transition-colors duration-300 group-hover:text-[#8a8a8a]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {ar ? "اختيار" : "SELECT"}
                      </span>
                    </button>
                    <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
