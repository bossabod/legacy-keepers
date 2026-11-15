"use client";
import { type ReactNode } from "react";
import { theme } from "@/lib/theme";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-8 py-12 text-center ${className}`}>
      {icon && <div className="text-[var(--color-faint)]">{icon}</div>}
      {title && (
        <h3 className="text-[0.82rem] font-medium text-[var(--color-dim)]" style={{ fontFamily: theme.typography.sans }}>
          {title}
        </h3>
      )}
      {description && (
        <p className="max-w-xs text-[0.68rem] leading-relaxed text-[var(--color-faint)]" style={{ fontFamily: theme.typography.sans }}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
