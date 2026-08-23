"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { theme } from "@/lib/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: `border-[${theme.colors.borderActive}] bg-gradient-to-b from-[#1e242e] to-[#0d0f14] text-[${theme.colors.ink}] hover:from-[#262d38] hover:to-[#11141a] shadow-[${theme.shadows.inset},${theme.shadows.md}]`,
  secondary: `border-[${theme.colors.border}] bg-[${theme.colors.surface}] text-[${theme.colors.silver}] hover:bg-[${theme.colors.elevated}] hover:text-[${theme.colors.ink}]`,
  ghost: `border-transparent bg-transparent text-[${theme.colors.muted}] hover:text-[${theme.colors.silver}] hover:bg-white/[0.03]`,
  danger: `border-[#2a1818] bg-[#1a0e0e] text-[#9a6a6a] hover:bg-[#241212] hover:text-[#b07878]`,
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[0.68rem]",
  md: "px-4 py-2.5 text-[0.78rem]",
  lg: "px-6 py-3 text-[0.88rem]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", icon, children, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border font-medium tracking-[0.04em] transition-all duration-[250ms] disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: theme.typography.sans }}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
);
Button.displayName = "Button";
