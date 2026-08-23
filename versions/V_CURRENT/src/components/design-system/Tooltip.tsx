"use client";
import { type ReactNode, useState } from "react";
import { theme } from "@/lib/theme";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [show, setShow] = useState(false);
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute z-50 pointer-events-none whitespace-nowrap rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-charcoal)]/95 px-2.5 py-1.5 text-[0.62rem] text-[var(--color-silver)] shadow-lg backdrop-blur-md ${positions[side]}`} style={{ fontFamily: theme.typography.sans }}>
          {content}
        </div>
      )}
    </div>
  );
}
