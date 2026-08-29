"use client";

export function Pulse({ color = "#aeb6c2" }: { color?: string }) {
  return (
    <span
      className="anim-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}
