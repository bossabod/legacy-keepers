"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { theme } from "@/lib/theme";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  size?: number;
  label?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 16, label, className = "", ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-[8px] border border-transparent p-2 text-[${theme.colors.muted}] transition-all duration-[250ms] hover:text-[${theme.colors.ink}] hover:border-[${theme.colors.border}] hover:bg-white/[0.03] disabled:opacity-30 ${className}`}
      style={{ width: size + 16, height: size + 16 }}
      {...props}
    >
      {icon}
    </button>
  )
);
IconButton.displayName = "IconButton";
