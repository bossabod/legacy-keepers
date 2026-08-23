"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * مكدّس ملفّات بعمق.
 *
 * الملفّ الحالي في المقدمة بوضوح كامل، والملفّات المجاورة تتراجع
 * خلفه بتدرّج بسيط في الحجم والعتامة. لا تدوير ثلاثي الأبعاد عنيف
 * ولا ضبابية تُخفي المعلومة — فقط إحساس بطبقات أرشيف متتابعة.
 */

export interface StackItem {
  id: string;
  node: React.ReactNode;
}

export default function FileStack({
  items,
  index,
  onIndex,
  isAr,
  labelPrev,
  labelNext,
}: {
  items: StackItem[];
  index: number;
  onIndex: (i: number) => void;
  isAr: boolean;
  labelPrev: string;
  labelNext: string;
}) {
  const n = items.length;
  const clamp = (i: number) => Math.max(0, Math.min(n - 1, i));
  const go = (d: number) => onIndex(clamp(index + d));

  /* التنقّل بلوحة المفاتيح — الأسهم تتبع اتجاه الكتابة */
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(isAr ? -1 : 1);
      else if (e.key === "ArrowLeft") go(isAr ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!n) return null;

  /* نعرض الحالي وجارَيه من كل جهة فقط — يبقى الأداء ثابتاً مهما طال السجلّ */
  const WINDOW = 2;

  return (
    <div ref={ref} className="relative w-full">
      {/* المسرح */}
      <div className="relative mx-auto h-[clamp(340px,46vh,440px)] w-full max-w-[720px]">
        <AnimatePresence initial={false}>
          {items.map((it, i) => {
            const d = i - index;
            if (Math.abs(d) > WINDOW) return null;

            const dir = isAr ? -1 : 1;
            const depth = Math.abs(d);

            return (
              <motion.div
                key={it.id}
                initial={false}
                animate={{
                  /* الملفّات الخلفية تنزاح جانباً قليلاً وتصغر */
                  x: d * 54 * dir,
                  y: depth * 16,
                  scale: 1 - depth * 0.07,
                  opacity: d === 0 ? 1 : depth === 1 ? 0.42 : 0.16,
                  zIndex: 40 - depth,
                }}
                transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                exit={{ opacity: 0, pointerEvents: "none" }}
                style={{ pointerEvents: d === 0 ? "auto" : "none" }}
                className="absolute inset-0"
              >
                {it.node}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* أدوات التنقّل */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <Arrow
          dir="prev"
          isAr={isAr}
          label={labelPrev}
          disabled={index === 0}
          onClick={() => go(-1)}
        />

        {/* مؤشّر الموضع */}
        <div className="flex items-center gap-1.5">
          {items.slice(0, 12).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndex(i)}
              className="h-4 w-[3px] rounded-full transition-all duration-400"
              style={{
                background:
                  i === index ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.16)",
                boxShadow: i === index ? "0 0 8px rgba(255,255,255,0.7)" : undefined,
                height: i === index ? 16 : 9,
              }}
            />
          ))}
          {n > 12 && (
            <span
              className="ms-1 text-[0.44rem] tracking-[0.14em] text-[#4f5763]"
              style={{ fontFamily: "var(--font-ibm-mono)" }}
            >
              +{n - 12}
            </span>
          )}
        </div>

        <Arrow
          dir="next"
          isAr={isAr}
          label={labelNext}
          disabled={index === n - 1}
          onClick={() => go(1)}
        />
      </div>

      {/* عدّاد */}
      <div
        className="mt-3 text-center text-[0.46rem] uppercase tracking-[0.24em] text-[#4f5763]"
        style={{ fontFamily: "var(--font-ibm-mono)" }}
      >
        {String(index + 1).padStart(3, "0")} / {String(n).padStart(3, "0")}
      </div>
    </div>
  );
}

function Arrow({
  dir,
  isAr,
  label,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  isAr: boolean;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  /* في RTL يشير سهم "السابق" لليمين */
  const pointsLeft = dir === "prev" ? !isAr : isAr;
  const Icon = pointsLeft ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        "group flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-350",
        disabled
          ? "cursor-not-allowed border-white/[0.05] text-[#33383f]"
          : "cursor-pointer border-white/[0.12] text-[#98a2b1] hover:border-white/35 hover:text-white",
      ].join(" ")}
      style={{
        background: disabled ? "transparent" : "rgba(255,255,255,0.02)",
        boxShadow: disabled ? undefined : "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <Icon size={15} />
    </button>
  );
}
