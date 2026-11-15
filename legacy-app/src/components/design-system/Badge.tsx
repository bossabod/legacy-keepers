"use client";
import { type ReactNode } from "react";
import { theme } from "@/lib/theme";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { border: string; bg: string; text: string }> = {
  default: { border: "border-[var(--color-border)]", bg: "bg-[var(--color-surface)]", text: "text-[var(--color-muted)]" },
  accent: { border: "border-[var(--color-borderActive)]", bg: "bg-[var(--color-accent)]/8", text: "text-[var(--color-ink)]" },
  success: { border: "border-[#1a2a1a]", bg: "bg-[#0e1a0e]", text: "text-[var(--theme-colors-success,#7a9a7a)]" },
  warning: { border: "border-[#2a2418]", bg: "bg-[#1a160e]", text: "text-[#a09070]" },
  danger: { border: "border-[#2a1818]", bg: "bg-[#1a0e0e]", text: "text-[#9a6a6a]" },
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.56rem] font-medium tracking-wide ${s.border} ${s.bg} ${s.text} ${className}`}
      style={{ fontFamily: theme.typography.sans }}
    >
      {children}
    </span>
  );
}
