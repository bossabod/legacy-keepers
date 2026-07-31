"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

/**
 * شاشة سوداء تظهر عند دخول قسم المشاريع.
 * تعرض رتبة المستخدم وتفتح له المشاريع المسموحة لرتبته.
 */
export default function RankGate({
  rankName,
  rankOrd,
  isAr,
  onDone,
}: {
  rankName: string;
  rankOrd: number;
  isAr: boolean;
  onDone: () => void;
}) {
  const [pct, setPct] = useState(0);
  const [mounted, setMounted] = useState(false);

  // نحتفظ بأحدث onDone دون إعادة تشغيل المؤقّت عند كل إعادة رسم للأب
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const started = Date.now();
    const DURATION = 2600;
    let raf = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      const p = Math.min(1, (Date.now() - started) / DURATION);
      // منحنى تسارع ثم تباطؤ
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setPct(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else timeout = setTimeout(() => doneRef.current(), 420);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-[#010102] px-6 py-16"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* توهج خلفي خافت */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 50%, rgba(195,201,211,0.07), transparent 70%)",
        }}
      />

      <div className="relative m-auto flex w-full max-w-lg flex-col items-center px-2 text-center">
        {/* خط علوي */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="mb-9 h-px w-32 bg-gradient-to-r from-transparent via-[#c3c9d3]/50 to-transparent"
        />

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mono text-[0.6rem] uppercase tracking-[0.42em] text-[#4d545f]"
        >
          {isAr ? "التحقق من الصلاحية" : "Verifying Clearance"}
        </motion.p>

        {/* الرتبة */}
        <motion.h2
          initial={{ opacity: 0, y: 14, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.06em" }}
          transition={{ delay: 0.4, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 text-4xl font-light text-[#eaeef5] sm:text-5xl"
          style={{ fontFamily: "var(--font-luxury)" }}
        >
          {rankName}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.7 }}
          className="mono mt-3 text-[0.62rem] uppercase tracking-[0.3em] text-[#565d68]"
        >
          {isAr ? `الرتبة ${rankOrd} من 9` : `TIER ${rankOrd} OF 9`}
        </motion.div>

        {/* الرسالة */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.8 }}
          className="mt-10 text-base leading-relaxed text-[#98a1af] sm:text-lg"
          style={{ fontFamily: "var(--font-luxury)" }}
        >
          {isAr
            ? "فتح مشاريع خاصة لرتبتك"
            : "Unlocking private ventures for your tier"}
        </motion.p>

        {/* شريط التقدّم */}
        <div className="mt-11 w-full max-w-xs">
          <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#6b7383] via-[#c3c9d3] to-[#6b7383]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mono mt-3 flex items-center justify-between text-[0.58rem] tracking-[0.2em] text-[#4d545f]">
            <span>{isAr ? "جارٍ الفتح" : "DECRYPTING"}</span>
            <span className="tabular-nums text-[#8b95a5]">
              {String(pct).padStart(3, "0")}%
            </span>
          </div>
        </div>

        {/* نقاط نابضة */}
        <div className="mt-9 flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.15, 0.85, 0.15] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.22,
                ease: "easeInOut",
              }}
              className="h-1 w-1 rounded-full bg-[#c3c9d3]"
            />
          ))}
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
