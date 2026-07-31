"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, SectionHeading, Reveal } from "@/components/ui";
import { play } from "@/lib/sound";
import type { AppData, Rank } from "@/lib/types";

export default function LadderSection({ data }: { data: AppData }) {
  // data.ranks: 1..9 من القاعدة للقمة
  const tiers = data.ranks; // index 0 = الزائر (قاعدة)
  const [selected, setSelected] = useState<Rank | null>(null);
  const [spin, setSpin] = useState(true);

  const pick = (r: Rank) => {
    setSelected(r);
    setSpin(false);
    play("select");
  };

  const N = tiers.length;
  const baseW = 300;
  const topW = 70;

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="الأثر · سلم الأثر"
        title="مسرح الرتب"
        desc="تسعة مستويات تصعد من القاعدة العريضة إلى القمة الضيقة. اختر مستوى لتتجه الكاميرا نحوه ويتكشّف وصفه."
      />

      <div className="grid gap-7 lg:grid-cols-[1.2fr_1fr]">
        {/* ===== المسرح ===== */}
        <Reveal>
          <Panel className="relative overflow-hidden p-4" style={{ minHeight: 560 }}>
            {/* إضاءة قمرية */}
            <motion.div
              className="pointer-events-none absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(174,182,194,0.14), transparent 70%)" }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* غبار عائم */}
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="pointer-events-none absolute rounded-full bg-[#aeb6c2]"
                style={{
                  left: `${(i * 37) % 100}%`,
                  bottom: "-4%",
                  width: 1.5,
                  height: 1.5,
                  opacity: 0.1 + (i % 4) * 0.06,
                  animation: `drift ${16 + (i % 6) * 3}s linear ${i * 1.4}s infinite`,
                }}
              />
            ))}

            {/* المنصّة + الهرم */}
            <div
              className="absolute inset-x-0 bottom-12 flex flex-col items-center"
              style={{ perspective: 1000 }}
            >
              {/* قاعدة أرضية */}
              <div
                className="mb-[-6px] rounded-[50%]"
                style={{
                  width: baseW + 60,
                  height: 34,
                  background: "radial-gradient(ellipse at center, rgba(195,201,211,0.18), transparent 70%)",
                  transform: "rotateX(70deg)",
                }}
              />
              <div
                className="mb-1 rounded-[50%] border"
                style={{
                  width: baseW + 30,
                  height: 26,
                  borderColor: "rgba(195,201,211,0.16)",
                  transform: "rotateX(70deg)",
                }}
              />

              {/* عمود الرتب (قاعدة→قمة) */}
              <motion.div
                className="relative flex flex-col-reverse items-center"
                animate={{ rotateY: spin ? [0, 6, 0, -6, 0] : 0 }}
                transition={{ duration: 18, repeat: spin ? Infinity : 0, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d", transform: "rotateX(6deg)" }}
              >
                {tiers.map((t, i) => {
                  const w = baseW - ((baseW - topW) * i) / (N - 1);
                  const h = 34;
                  const isSel = selected?.id === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      onClick={() => pick(t)}
                      onMouseEnter={() => play("hover")}
                      animate={{
                        scale: isSel ? 1.06 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      className="group relative flex items-center justify-center"
                      style={{
                        width: w,
                        height: h,
                        marginTop: -4,
                        borderRadius: "50%",
                        background: isSel
                          ? "radial-gradient(ellipse at 50% 25%, #eaeef5, #7c8593 60%, #2a2f37 100%)"
                          : "radial-gradient(ellipse at 50% 25%, #6b7280, #353b45 55%, #1c2027 100%)",
                        borderTop: "1px solid rgba(255,255,255,0.28)",
                        boxShadow: isSel
                          ? "0 0 26px rgba(174,182,194,0.55), inset 0 2px 6px rgba(255,255,255,0.18)"
                          : "0 6px 14px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.06)",
                        zIndex: N - i,
                      }}
                      aria-label={t.name}
                    >
                      <span
                        className="mono text-[0.5rem] transition"
                        style={{ color: isSel ? "#0a0c10" : "#9aa3b2", transform: "translateY(-2px)" }}
                      >
                        {String(t.ord).padStart(2, "0")}
                      </span>
                    </motion.button>
                  );
                })}
                {/* القمة المتوهّجة */}
                <div
                  className="z-50 mb-1 h-3 w-3 rotate-45"
                  style={{
                    background: "#eaeef5",
                    boxShadow: "0 0 16px 4px rgba(174,182,194,0.7)",
                  }}
                />
              </motion.div>
            </div>

            {/* عنوان المسرح */}
            <div className="absolute right-4 top-4 text-right">
              <div className="eyebrow text-[0.5rem]">سلم الأثر · {N} مستويات</div>
              <div className="mt-1 text-[0.78rem] text-[#aeb6c2]">
                {spin ? "دوران تلقائي" : "مستوى محدد"}
              </div>
            </div>
          </Panel>
        </Reveal>

        {/* ===== قائمة الرتب + المحتوى ===== */}
        <div className="space-y-5">
          <Reveal delay={0.06}>
            <Panel className="p-4">
              <div className="eyebrow mb-3">الرتب · من القاعدة للقمة</div>
              <div className="scroll-thin max-h-[300px] space-y-1 overflow-y-auto">
                {tiers.map((t) => {
                  const isSel = selected?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => pick(t)}
                      onMouseEnter={() => play("hover")}
                      className="flex w-full items-center gap-3 rounded-lg p-2.5 text-right transition"
                      style={{
                        background: isSel ? "rgba(195,201,211,0.1)" : "transparent",
                        border: `1px solid ${isSel ? "rgba(195,201,211,0.35)" : "transparent"}`,
                      }}
                    >
                      <span className="mono w-6 text-[0.66rem] text-[#565d68]">
                        {String(t.ord).padStart(2, "0")}
                      </span>
                      <span className={`flex-1 text-[0.84rem] ${isSel ? "text-[#eaeef5]" : "text-[#aeb6c2]"}`}>
                        {t.name}
                      </span>
                      <span className="mono text-[0.64rem] text-[#7f8896]">{t.holders} حامل</span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          </Reveal>

          <AnimatePresence mode="wait">
            <motion.div
              key={selected?.id ?? "none"}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
            >
              <Panel className="p-6" strong>
                {selected ? (
                  <div>
                    <div className="eyebrow">المستوى {String(selected.ord).padStart(2, "0")}</div>
                    <h3 className="mt-1 text-2xl font-semibold text-[#eaeef5]">{selected.name}</h3>
                    <p className="mt-3 text-sm leading-loose text-[#aeb6c2]">{selected.description}</p>
                    <div className="divider my-4" />
                    <div className="mono text-[0.72rem] text-[#7f8896]">
                      عدد الحاملين: <span className="text-[#eaeef5]">{selected.holders}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[0.84rem] text-[#7f8896]">
                    اختر مستوى من الهرم أو من القائمة لعرض وصفه.
                  </div>
                )}
              </Panel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
