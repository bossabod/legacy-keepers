"use client";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { theme } from "@/lib/theme";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, label, className = "", ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-[0.58rem] uppercase tracking-[0.16em] text-[var(--color-muted)]" style={{ fontFamily: theme.typography.mono }}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-slate)] py-2.5 ${icon ? "pl-9" : "pl-3.5"} pr-3 text-[0.78rem] text-[var(--color-ink)] outline-none transition-all duration-[250ms] focus:border-[var(--color-borderActive)] placeholder:text-[var(--color-faint)] ${className}`}
          style={{ fontFamily: theme.typography.sans }}
          {...props}
        />
      </div>
    </div>
  )
);
Input.displayName = "Input";
