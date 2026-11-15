"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/* ===================== الشعار — فضي نقي ===================== */
let logoIdCounter = 0;
export function Logo({ size = 30 }: { size?: number }) {
  const id = `lg-silver-${++logoIdCounter}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-label="أصحاب الأثر"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f8fa" />
          <stop offset="0.35" stopColor="#c8cfd8" />
          <stop offset="0.7" stopColor="#9aa3b2" />
          <stop offset="1" stopColor="#6b7686" />
        </linearGradient>
      </defs>
      {/* إطار معيّن خارجي */}
      <rect
        x="9"
        y="9"
        width="30"
        height="30"
        transform="rotate(45 24 24)"
        stroke={`url(#${id})`}
        strokeWidth="1.4"
        opacity="0.9"
      />
      {/* محور رأسي */}
      <line x1="24" y1="6" x2="24" y2="42" stroke={`url(#${id})`} strokeWidth="0.8" opacity="0.5" />
      {/* ثلاثة شيفرونات صاعدة — رمز الأثر المتصاعد */}
      <path d="M14 30 L24 20 L34 30" stroke={`url(#${id})`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 35 L24 25 L34 35" stroke={`url(#${id})`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {/* نقطة القمة المتوهّجة */}
      <circle cx="24" cy="14" r="2" fill={`url(#${id})`} />
    </svg>
  );
}

/* ===================== الكتلة الكتابية للشعار ===================== */
export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <Logo size={size} />
      <div className="leading-tight">
        <div className="text-[0.95rem] font-semibold tracking-wide text-[#eaeef5]">
          أَصحاب الأثر
        </div>
        <div className="eyebrow mt-0.5 text-[0.5rem]">EST. 2012</div>
      </div>
    </div>
  );
}

/* ===================== المؤشّر المخصّص ===================== */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 600, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 600, damping: 40, mass: 0.4 });
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
    };
    const leave = () => setHidden(true);
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, [x, y]);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches)
    return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[70] hidden md:block"
      style={{ x: sx, y: sy }}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="-translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{
          width: 26,
          height: 26,
          borderColor: "rgba(195,201,211,0.4)",
          boxShadow: "0 0 14px rgba(174,182,194,0.25)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 4, height: 4, background: "#c3c9d3" }}
      />
    </motion.div>
  );
}

/* ===================== الساعات العالمية ===================== */
const CITIES: { name: string; tz: string }[] = [
  { name: "نيويورك", tz: "America/New_York" },
  { name: "لندن", tz: "Europe/London" },
  { name: "الرياض", tz: "Asia/Riyadh" },
  { name: "أوسلو", tz: "Europe/Oslo" },
  { name: "برن", tz: "Europe/Zurich" },
];

export function WorldClock({ vertical = false }: { vertical?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (tz: string) =>
    now
      ? new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: tz,
        }).format(now)
      : "--:--";

  return (
    <div className={vertical ? "flex flex-col gap-3" : "flex flex-wrap gap-x-5 gap-y-2"}>
      {CITIES.map((c) => (
        <div key={c.tz} className="flex items-center gap-2">
          <span className="text-[0.6rem] text-[#565d68]">{c.name}</span>
          <span className="mono text-[0.72rem] text-[#aeb6c2]">{fmt(c.tz)}</span>
        </div>
      ))}
    </div>
  );
}

/* ===================== جسيمات عائمة ===================== */
export function Particles({ count = 18 }: { count?: number }) {
  const dots = Array.from({ length: count });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((_, i) => {
        const left = (i * 53) % 100;
        const dur = 14 + (i % 7) * 4;
        const delay = (i % 5) * 2.4;
        const size = 1 + (i % 3);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-[#aeb6c2]"
            style={{
              left: `${left}%`,
              bottom: "-5%",
              width: size,
              height: size,
              opacity: 0.18 + (i % 4) * 0.08,
              animation: `drift ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
