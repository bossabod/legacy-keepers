"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Lock, ShieldCheck, Check, Loader2, X } from "lucide-react";
import { SectionHeading, Reveal, Tag } from "@/components/ui";
import { play } from "@/lib/sound";
import type { AppData, ArchiveFile, Classification } from "@/lib/types";

const FILTERS: (Classification | "الكل")[] = [
  "الكل", "عام داخلي", "محدود", "سري", "سري جدًا",
];

export default function ArchiveSection({ data }: { data: AppData }) {
  const [filter, setFilter] = useState<Classification | "الكل">("الكل");
  const [selected, setSelected] = useState<ArchiveFile | null>(null);
  const [reason, setReason] = useState("");
  const [purpose, setPurpose] = useState("");
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const list = filter === "الكل" ? data.archive : data.archive.filter((a) => a.classification === filter);

  const submitAccess = () => {
    setStatus("submitting");
    play("vault");
    setTimeout(() => { setStatus("done"); play("granted"); }, 1600);
  };

  const closeModal = () => {
    setSelected(null);
    setStatus("idle");
    setReason(""); setPurpose(""); setComments("");
  };

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="Classified Archive"
        title="Intelligence Archive"
        desc="Every file is individually classified and locked. Click any file to submit a formal access request."
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); play("click"); }}
            className={`rounded-full border px-3.5 py-1.5 text-[0.78rem] tracking-wide transition-all duration-250 ${
              filter === f
                ? "border-[#c3c9d3]/35 bg-[#c3c9d3]/8 text-[#eaeef5]"
                : "border-white/10 text-[#7f8896] hover:text-[#aeb6c2] hover:border-[#c3c9d3]/20"
            }`}
            style={{ fontFamily: "var(--font-luxury)", fontWeight: 500 }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* File Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a, i) => (
          <Reveal key={a.id} delay={(i % 6) * 0.04}>
            <button
              onMouseEnter={() => play("hover")}
              onClick={() => { setSelected(a); play("open"); }}
              className="group flex h-full w-full flex-col rounded-xl border border-[#c3c9d3]/12 bg-gradient-to-b from-[#0e1118]/90 to-[#06080c] p-5 text-left transition-all duration-400 hover:border-[#c3c9d3]/30 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-[#7f8896]" />
                  <FileText size={16} className="text-[#7f8896]" />
                </div>
                <Tag level={a.classification} />
              </div>
              <div className="text-[0.92rem] font-medium text-[#eaeef5] mb-2" style={{ fontFamily: "var(--font-luxury)" }}>{a.title}</div>
              <div className="mt-auto pt-3 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-[0.66rem] text-[#565d68]" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                  {a.custodian} · {a.pages}p · {a.date}
                </span>
                <span className="text-[0.6rem] uppercase tracking-wide text-[#565d68]">Locked</span>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      {/* Access Request Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Blurred vault/document background */}
            <div
              className="absolute inset-0 backdrop-blur-xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(8,10,14,0.92), rgba(2,3,5,0.96)), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%230a0c10'/%3E%3Cg stroke='%23565d68' stroke-width='1' fill='none'%3E%3Crect x='30' y='30' width='240' height='240'/%3E%3Cline x1='30' y1='80' x2='270' y2='80'/%3E%3Cline x1='30' y1='150' x2='270' y2='150'/%3E%3Cline x1='30' y1='220' x2='270' y2='220'/%3E%3Ccircle cx='150' cy='150' r='26'/%3E%3C/g%3E%3C/svg%3E\")",
                backgroundSize: "cover",
              }}
              onClick={closeModal}
            />
            <motion.div
              className="glass-strong relative z-10 w-full max-w-md rounded-2xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <button onClick={closeModal} className="absolute top-5 right-5 text-[#8b95a5] hover:text-[#eaeef5] transition-colors">
                <X size={18} />
              </button>

              {status === "done" ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c3c9d3]/30 bg-gradient-to-b from-[#1e2430] to-[#0a0d12]">
                    <Check size={24} className="text-[#c3c9d3]" />
                  </div>
                  <p className="max-w-xs text-sm leading-relaxed text-[#aeb6c2]">
                    Your access request has been submitted. A custodian will review your clearance level and respond via encrypted channel.
                  </p>
                  <button onClick={closeModal} className="mt-2 text-[0.72rem] uppercase tracking-[0.2em] text-[#565d68] hover:text-[#aeb6c2] transition-colors" style={{ fontFamily: "var(--font-luxury)" }}>
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c3c9d3]/20 bg-[#c3c9d3]/5">
                      <ShieldCheck size={18} className="text-[#c3c9d3]" />
                    </div>
                    <div>
                      <div className="text-[0.6rem] uppercase tracking-[0.2em] text-[#565d68]" style={{ fontFamily: "var(--font-ibm-mono)" }}>Access Request</div>
                      <h3 className="text-lg font-semibold text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>{selected.title}</h3>
                    </div>
                  </div>

                  <div className="mb-5"><Tag level={selected.classification} /></div>

                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-[0.68rem] uppercase tracking-[0.2em] text-[#aeb6c2]">Reason</label>
                      <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/60 rounded-xl px-4 py-3 text-[#eaeef5] text-sm outline-none transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block mb-2 text-[0.68rem] uppercase tracking-[0.2em] text-[#aeb6c2]">Purpose</label>
                      <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/60 rounded-xl px-4 py-3 text-[#eaeef5] text-sm outline-none transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block mb-2 text-[0.68rem] uppercase tracking-[0.2em] text-[#aeb6c2]">Comments</label>
                      <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/60 rounded-xl px-4 py-3 text-[#eaeef5] text-sm outline-none transition-all duration-300 resize-none" />
                    </div>
                    <button
                      onClick={submitAccess}
                      disabled={status === "submitting"}
                      onMouseEnter={() => play("hover")}
                      className="w-full rounded-xl border border-[#c3c9d3]/30 bg-gradient-to-b from-[#2a313d] to-[#0a0d13] py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#eaeef5] transition-all duration-300 hover:border-[#c3c9d3]/50 hover:text-white disabled:opacity-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.6)]"
                      style={{ fontFamily: "var(--font-luxury)" }}
                    >
                      {status === "submitting" ? (
                        <span className="flex items-center justify-center gap-2 mono text-xs tracking-widest">
                          <Loader2 className="animate-spin text-[#c3c9d3]" size={16} /> SUBMITTING...
                        </span>
                      ) : "Submit Request"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
