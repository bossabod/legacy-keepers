"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, FileLock2 } from "lucide-react";
import { Panel, SectionHeading, Reveal, MetalButton, Field, Stat, Modal } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { play } from "@/lib/sound";
import type { AppData, Bank } from "@/lib/types";

export default function VaultSection({ data }: { data: AppData }) {
  const { currency } = useApp();
  const [locked, setLocked] = useState(true);
  const [opening, setOpening] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [selected, setSelected] = useState<Bank | null>(null);

  const tryOpen = () => {
    if (code === "2012") {
      setErr(false);
      setOpening(true);
      play("vault");
      setTimeout(() => {
        setOpening(false);
        setLocked(false);
        play("granted");
      }, 2200);
    } else {
      setErr(true);
      play("reject");
    }
  };

  const total = data.banks.reduce((s, b) => s + b.balanceChf, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="المال · الخزانة البنكية"
        title="منطقة عالية الحساسية"
        desc="الوصول محمي برمز سرّي. كل بنك أرشيف مصرفي مستقل بملفاته وصلاحياته."
      />

      <AnimatePresence mode="wait">
        {locked ? (
          <motion.div
            key="gate"
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex justify-center"
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl"
              style={{ border: "1px solid rgba(195,201,211,0.14)", background: "rgba(8,10,14,0.6)" }}
            >
              <div
                className="absolute inset-0 opacity-[0.16]"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, #050608), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23090b0f'/%3E%3Cg stroke='%23565d68' stroke-width='1' fill='none'%3E%3Crect x='30' y='30' width='240' height='240'/%3E%3Cline x1='30' y1='80' x2='270' y2='80'/%3E%3Cline x1='30' y1='150' x2='270' y2='150'/%3E%3Cline x1='30' y1='220' x2='270' y2='220'/%3E%3Ccircle cx='150' cy='150' r='26'/%3E%3C/g%3E%3C/svg%3E\")",
                  backgroundSize: "cover",
                }}
              />
              <div className="relative flex flex-col items-center gap-5 px-8 py-12 text-center">
                <div className="eyebrow">منطقة عالية الحساسية</div>
                {/* القرص */}
                <div className="relative" style={{ width: 176, height: 176 }}>
                  <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(195,201,211,0.1)" }} />
                  <div className="absolute inset-4 rounded-full" style={{ border: "1px solid rgba(195,201,211,0.18)" }} />
                  <motion.div
                    className="absolute inset-8 rounded-full"
                    style={{
                      border: "1px solid rgba(195,201,211,0.3)",
                      background:
                        "radial-gradient(circle at 35% 30%, rgba(174,182,194,0.25), rgba(20,24,30,0.9) 70%)",
                    }}
                    animate={opening ? { rotate: 720, scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2.1, ease: "easeInOut" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {opening ? (
                      <ShieldCheck size={34} className="text-[#c3c9d3]" />
                    ) : (
                      <Lock size={30} className="text-[#aeb6c2]" />
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#eaeef5]">الخزانة البنكية</h3>
                  <p className="mt-1 text-[0.78rem] text-[#7f8896]">أدخل رمز الفتح للوصول إلى الأرشيف المصرفي.</p>
                </div>

                {opening ? (
                  <div className="eyebrow anim-pulse-dot">جارٍ فتح الخزانة…</div>
                ) : (
                  <div className="w-full space-y-3">
                    <Field
                      type="password"
                      center
                      placeholder="••••"
                      value={code}
                      onChange={(e) => { setCode(e.target.value); setErr(false); }}
                      style={{ maxWidth: 160, margin: "0 auto", letterSpacing: "0.6em" }}
                    />
                    {err && (
                      <div className="text-[0.72rem] text-[#7f8896]">رمز غير صحيح. تلميح: سنة التأسيس.</div>
                    )}
                    <MetalButton className="w-full" onClick={tryOpen}>فتح الخزانة</MetalButton>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="open" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <Reveal>
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="إجمالي الأرصدة" value={formatMoney(total, currency)} mono />
                <Stat label="عدد البنوك" value={data.banks.length} mono />
                <Stat label="الملفات المصرفية" value={data.banks.reduce((s, b) => s + b.files, 0)} mono />
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.banks.map((b, i) => (
                <Reveal key={b.id} delay={(i % 6) * 0.05}>
                  <button
                    onMouseEnter={() => play("hover")}
                    onClick={() => { setSelected(b); play("open"); }}
                    className="glass group flex h-full w-full flex-col rounded-2xl p-5 text-right transition hover:border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="mono text-[0.64rem] text-[#565d68]">{b.code}</span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[0.6rem] text-[#aeb6c2]">{b.status}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <FileLock2 size={16} className="text-[#7f8896]" />
                      <span className="text-[0.9rem] text-[#eaeef5]">{b.name}</span>
                    </div>
                    <div className="mt-1 text-[0.72rem] text-[#7f8896]">{b.location}</div>
                    <div className="mono mt-4 text-lg font-semibold text-[#eaeef5]">
                      {formatMoney(b.balanceChf, currency)}
                    </div>
                    <div className="mono mt-1 text-[0.62rem] text-[#565d68]">{b.files} ملف مصرفي</div>
                  </button>
                </Reveal>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="الأرشيف المصرفي">
        {selected && (
          <div>
            <div className="text-lg font-semibold text-[#eaeef5]">{selected.name}</div>
            <div className="mono mt-1 text-[0.66rem] text-[#565d68]">{selected.code} · {selected.location}</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat label="الرصيد" value={formatMoney(selected.balanceChf, currency)} mono />
              <Stat label="الملفات" value={selected.files} mono />
            </div>
            <div className="mt-4 space-y-2">
              {Array.from({ length: selected.files > 4 ? 4 : selected.files }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 p-3">
                  <ShieldCheck size={15} className="text-[#aeb6c2]" />
                  <span className="flex-1 text-[0.8rem] text-[#aeb6c2]">ملف مصرفي #{1000 + i}</span>
                  <span className="mono text-[0.62rem] text-[#565d68]">موقّع رقميًا</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
