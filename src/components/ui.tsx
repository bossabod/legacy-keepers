"use client";
import {
  motion,
  AnimatePresence,
  type HTMLMotionProps,
} from "framer-motion";
import { X } from "lucide-react";
import {
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  useEffect,
} from "react";
import type { Classification } from "@/lib/types";
import { classificationRank } from "@/lib/format";
import { play } from "@/lib/sound";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ===== زر معدني ===== */
interface MetalBtn extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}
export function MetalButton({ children, className, onMouseEnter, ...rest }: MetalBtn) {
  return (
    <button
      className={cn("btn-metal", className)}
      onMouseEnter={(e) => {
        play("hover");
        onMouseEnter?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ===== زر شبحي ===== */
export function GhostButton({ children, className, onMouseEnter, ...rest }: MetalBtn) {
  return (
    <button
      className={cn("btn-ghost", className)}
      onMouseEnter={(e) => {
        play("hover");
        onMouseEnter?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ===== حقل ===== */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  center?: boolean;
}
export function Field({ label, center, className, style, ...rest }: FieldProps) {
  return (
    <label className="block">
      {label && (
        <span className="eyebrow mb-2 block text-[0.55rem]">{label}</span>
      )}
      <input
        className={cn("field", center && "text-center tracking-[0.4em]", className)}
        style={style}
        {...rest}
      />
    </label>
  );
}

/* ===== لوح زجاجي ===== */
export function Panel({
  children,
  className,
  strong,
  edge,
  ...rest
}: HTMLMotionProps<"div"> & { strong?: boolean; edge?: boolean }) {
  return (
    <motion.div
      className={cn(
        strong ? "glass-strong" : "glass",
        edge && "edge",
        "rounded-2xl",
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ===== عنوان قسم ===== */
export function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-7">
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h1 className="text-3xl font-semibold tracking-tight text-[#eaeef5] md:text-[2.4rem]">
        {title}
      </h1>
      {desc && <p className="mt-3 max-w-2xl text-sm leading-loose text-[#7f8896]">{desc}</p>}
    </div>
  );
}

/* ===== وسم تصنيف السرية ===== */
const TAG_STYLE: Record<number, { border: string; bg: string; text: string; dot: string }> = {
  0: { border: "rgba(195,201,211,0.14)", bg: "rgba(86,93,104,0.12)", text: "#7f8896", dot: "#565d68" },
  1: { border: "rgba(174,182,194,0.22)", bg: "rgba(174,182,194,0.08)", text: "#aeb6c2", dot: "#aeb6c2" },
  2: { border: "rgba(195,201,211,0.4)", bg: "rgba(195,201,211,0.1)", text: "#d6dbe3", dot: "#c3c9d3" },
  3: { border: "rgba(234,238,245,0.55)", bg: "rgba(234,238,245,0.12)", text: "#eef1f6", dot: "#eef1f6" },
};
export function Tag({ level }: { level: Classification }) {
  const r = classificationRank(level);
  const s = TAG_STYLE[r];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.62rem] font-medium"
      style={{ border: `1px solid ${s.border}`, background: s.bg, color: s.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {level}
    </span>
  );
}

/* ===== إحصائية ===== */
export function Stat({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <div className="eyebrow text-[0.5rem]">{label}</div>
      <div
        className={cn("mt-2 text-xl font-semibold text-[#eaeef5]", mono && "mono")}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[0.68rem] text-[#565d68]">{hint}</div>}
    </div>
  );
}

/* ===== نقطة نابضة ===== */
export function Pulse({ color = "#aeb6c2" }: { color?: string }) {
  return (
    <span
      className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

/* ===== حاوية ظهور ===== */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ===== نافذة منبثقة ===== */
export function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (open) play("open");
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="glass-strong relative z-10 w-full max-w-lg rounded-2xl p-6"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.34, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="eyebrow">{title}</span>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-[#7f8896] transition hover:text-[#eaeef5]"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
