"use client";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

export function Skeleton({ className = "", width = "100%", height = "14px", rounded = "var(--radius-xs)" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-elevated)] to-[var(--color-surface)] ${className}`}
      style={{ width, height, borderRadius: rounded }}
    />
  );
}
