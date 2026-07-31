"use client";
import { type HTMLAttributes, type ReactNode } from "react";
import { theme } from "@/lib/theme";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glass?: boolean;
  title?: string;
  actions?: ReactNode;
}

export function Panel({ children, glass = false, title, actions, className = "", ...props }: PanelProps) {
  return (
    <div
      className={`rounded-[10px] border overflow-hidden ${glass ? "border-[var(--color-border)] bg-[var(--color-charcoal)]/85 backdrop-blur-lg" : "border-[var(--color-border)] bg-[var(--color-charcoal)]"} ${className}`}
      style={{ boxShadow: theme.shadows.md }}
      {...props}
    >
      {(title || actions) && (
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          {title && (
            <h3 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[var(--color-steel)]" style={{ fontFamily: theme.typography.mono }}>
              {title}
            </h3>
          )}
          {actions && <div className="flex items-center gap-1.5">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
