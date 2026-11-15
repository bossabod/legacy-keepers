"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const LINES = [
  "تهيئة القناة المشفّرة",
  "التحقّق من بصمة العضوية",
  "مزامنة الطبقة التشغيلية",
  "تحميل سجلّ الأثر",
  "فكّ تشفير شبكة العلاقات",
  "استدعاء محفظة المشاريع",
  "تأمين بوابة الخزانة",
  "ترتيب الأرشيف السرّي",
  "معايرة سلم الأثر",
  "تثبيت صلاحيات الرتبة",
  "Access granted",
];

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState<string[]>([]);
  const doneRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  // التقدّم العام
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const total = 6200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      // منحنى يتنفّس قليلًا لتبدو حيّة
      const eased = p < 1 ? p * (1 - 0.12 * Math.sin(p * Math.PI * 3)) : 1;
      setPct(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setTimeout(onDone, 850);
  };

  // الكتابة الحيّة للأسطر
  useEffect(() => {
    if (step >= LINES.length) return;
    const line = LINES[step];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(line.slice(0, i));
      if (i % 2 === 0) {
        // نقرة كتابة خفيفة (تُشغَّل ضمنيًا)
      }
      if (i >= line.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShown((s) => [...s, line]);
          setTyped("");
          setStep((s) => s + 1);
        }, step === LINES.length - 1 ? 260 : 150 + (step % 3) * 90);
      }
    }, 26 + (step % 4) * 10);
    return () => clearInterval(interval);
  }, [step]);

  // إعادة الضبط عند آخر سطر
  useEffect(() => {
    if (step === LINES.length) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: 9999 });
  }, [shown, typed]);

  const circumference = 2 * Math.PI * 70;
  const arc = (pct / 100) * circumference;

  return (
    <motion.div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 45%, transparent 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* رأس الشاشة */}
      <div className="absolute inset-x-0 top-6 flex items-center justify-between px-8">
        <span className="eyebrow" style={{ letterSpacing: "0.42em" }}>
          ATHAR · LOADING
        </span>
        <span className="mono text-sm text-[#aeb6c2]">
          {String(pct).padStart(3, "0")}%
        </span>
      </div>

      {/* الدوائر */}
      <div className="relative flex items-center justify-center" style={{ width: 288, height: 288 }}>
        {/* حلقة خارجية ثابتة */}
        <div
          className="absolute rounded-full"
          style={{ width: 260, height: 260, border: "1px solid rgba(195,201,211,0.06)" }}
        />
        {/* حلقة منقّطة تدور ببطء */}
        <div
          className="anim-spin-cw absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            border: "1px dashed rgba(195,201,211,0.18)",
          }}
        />
        {/* حلقة رئيسية ثابتة */}
        <div
          className="absolute rounded-full"
          style={{ width: 180, height: 180, border: "1px solid rgba(195,201,211,0.22)" }}
        />
        {/* قوس التقدّم */}
        <svg className="absolute -rotate-90" width={180} height={180} viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r="70"
            fill="none"
            stroke="rgba(195,201,211,0.85)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
            style={{ filter: "drop-shadow(0 0 6px rgba(174,182,194,0.5))" }}
          />
        </svg>
        {/* حلقة عكسية */}
        <div
          className="anim-spin-ccw absolute rounded-full"
          style={{ width: 140, height: 140, border: "1px solid rgba(195,201,211,0.14)" }}
        />
        {/* نواة نابضة */}
        <div
          className="anim-breathe absolute flex flex-col items-center justify-center rounded-full"
          style={{
            width: 76,
            height: 76,
            background: "rgba(195,201,211,0.08)",
            border: "1px solid rgba(195,201,211,0.4)",
          }}
        >
          <span className="mono text-sm text-[#eaeef5]">
            {String(Math.min(step + 1, 11)).padStart(2, "0")} / 11
          </span>
          <span className="eyebrow mt-0.5 text-[0.45rem]">PROCESSING</span>
        </div>
        {/* نقاط مدارية */}
        {[8, 10, 12, 14].map((d, i) => (
          <div key={i} className="absolute" style={{ width: 180, height: 180 }}>
            <motion.div
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{ width: 6, height: 6, borderRadius: 99, background: "#aeb6c2", boxShadow: "0 0 8px #aeb6c2" }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: d, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      {/* سجلّ التحميل */}
      <div className="relative mt-10 w-[min(90vw,460px)]">
        <div className="divider mb-3" />
        <div
          ref={logRef}
          className="scroll-thin h-[150px] overflow-y-auto px-1 font-mono text-[0.72rem]"
        >
          {shown.map((l, i) => (
            <div key={i} className="mb-1.5 flex items-center justify-between gap-3 text-[#7f8896]">
              <span className="flex gap-2">
                <span className="text-[#3a4049]">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[#aeb6c2]">{l}</span>
              </span>
              <span className="text-[#aeb6c2]">✓</span>
            </div>
          ))}
          {step < LINES.length && (
            <div className="mb-1.5 flex gap-2 text-[#eaeef5]">
              <span className="text-[#3a4049]">{String(step + 1).padStart(2, "0")}</span>
              <span>
                {typed}
                <span className="blink">▌</span>
              </span>
            </div>
          )}
        </div>
        <div className="divider mt-3" />
      </div>

      <AnimatePresence>
        {step >= LINES.length && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mono mt-5 text-[0.8rem] tracking-widest text-[#eaeef5]"
          >
            ✓ منح صلاحية الدخول
          </motion.p>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-5 flex items-center justify-between px-8">
        <span className="eyebrow text-[0.5rem]">NADY AL-ATHAR</span>
        <span className="eyebrow text-[0.5rem]">ENCRYPTED CHANNEL</span>
      </div>
    </motion.div>
  );
}
