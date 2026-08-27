"use client";
import { useEffect, useState } from "react";
import {
  MapPin, Eye, EyeOff,
} from "lucide-react";
import GlobalCommandGlobe from "@/components/GlobalCommandGlobe";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";
import type { SectionKey } from "@/components/Dashboard";

export default function HomeSection({
  data,
  onNavigate,
  onOpenDestinations,
  hubMode = true,
}: {
  data: AppData;
  onNavigate: (k: SectionKey) => void;
  onOpenDestinations?: () => void;
  /** When true: large command globe + single destination CTA (no crowded chrome) */
  hubMode?: boolean;
}) {
  const me = data.members[0];
  const [nameVisible, setNameVisible] = useState(false);
  const { lang } = useApp();
  const ar = lang === "ar";

  // Keep onNavigate referenced so tree-shaking never drops the prop contract
  useEffect(() => {
    void onNavigate;
  }, [onNavigate]);

  return (
    <div className="page-shell flex w-full min-w-0 flex-col items-center">
      {/* ═══════ Command globe — primary stage ═══════ */}
      <div
        className="relative w-full min-w-0 overflow-hidden rounded-xl border border-[#1c2430]"
        style={{
          height: hubMode
            ? "clamp(420px, calc(100dvh - 11rem), 780px)"
            : "clamp(360px, 62dvh, 680px)",
          background:
            "radial-gradient(120% 90% at 50% 38%, #0c121a 0%, #070b10 55%, #04060a 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(140,160,190,0.06), 0 28px 70px rgba(0,0,0,0.65)",
        }}
      >
        {/* top chrome */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 border-b border-white/[0.04] px-3 py-2.5 sm:px-6 sm:py-3.5 md:px-8">
          <span
            className="min-w-0 truncate text-[0.62rem] uppercase tracking-[0.16em] text-[#7a8799] sm:text-[0.72rem] sm:tracking-[0.22em]"
            style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
          >
            {ar ? "شبكة القيادة العالمية" : "Global Command Network"}
          </span>
          <span className="mono shrink-0 rounded-full border border-white/[0.08] bg-black/40 px-2 py-1 text-[0.55rem] text-[#9aa6b5]/90 sm:px-3 sm:text-[0.66rem]">
            {me.code}
          </span>
        </div>

        {/* globe — locked auto-rotate, no user drag/zoom */}
        <div
          className={`absolute inset-0 z-0 ${
            hubMode
              ? "pb-[min(32%,9.5rem)] pt-12 sm:pb-24 sm:pt-14"
              : "pb-[min(38%,11rem)] pt-11 sm:pb-28 sm:pt-12"
          }`}
        >
          <GlobalCommandGlobe className="h-full w-full" />
        </div>

        {/* member identity — bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-3 border-t border-white/[0.04] px-3 pb-3 pt-3 sm:gap-6 sm:px-6 sm:pb-5 sm:pt-4 md:px-8">
          <div className="min-w-0 max-w-full sm:max-w-md">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <h1
                className="min-w-0 truncate text-xl font-light tracking-tight text-[#e8edf4] sm:text-3xl md:text-4xl"
                style={{
                  fontFamily: "var(--font-luxury)",
                  textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                }}
              >
                {nameVisible ? me.name : "****************"}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setNameVisible(!nameVisible);
                  try {
                    play("click");
                  } catch {
                    /* noop */
                  }
                }}
                className="pointer-events-auto shrink-0 rounded-md border border-transparent p-2 text-[#6a7585] transition-all duration-300 hover:border-white/10 hover:text-[#c5cdd8]"
                aria-label="Toggle name visibility"
              >
                {nameVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p
              className="mt-1.5 line-clamp-2 max-w-md text-[0.78rem] leading-relaxed text-[#8a95a5] sm:mt-2 sm:text-sm"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
            >
              {me.bio}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-3">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem]"
                style={{
                  border: "1px solid rgba(140,160,190,0.22)",
                  background: "rgba(6,10,16,0.55)",
                  color: "#c5cdd8",
                }}
              >
                <span className="h-1.5 w-1.5 rotate-45 bg-[#8a9aaf]" />{" "}
                {ar ? "الرتبة" : "Rank"}: {me.rank}
              </span>
              <span
                className="text-[0.68rem] text-[#8a95a5]"
                style={{
                  background: "rgba(6,10,16,0.55)",
                  padding: "2px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(140,160,190,0.1)",
                }}
              >
                {me.role}
              </span>
              <span
                className="flex items-center gap-1.5 text-[0.68rem] text-[#6a7585]"
                style={{
                  background: "rgba(6,10,16,0.55)",
                  padding: "2px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(140,160,190,0.1)",
                }}
              >
                <MapPin size={12} /> {me.city} · {me.country}
              </span>
            </div>
          </div>

          <div className="hidden space-y-1.5 text-end lg:block">
            <MetaRow
              label={ar ? "رقم العضوية" : "Membership No."}
              value={me.code}
              mono
            />
            <MetaRow
              label={ar ? "سنة الانضمام" : "Join Year"}
              value={String(me.memberSince)}
              mono
            />
            <MetaRow
              label={ar ? "مشاريع مرتبطة" : "Related Projects"}
              value={String(data.projects.length)}
              mono
            />
          </div>
        </div>
      </div>

      {/* ═══════ Single destination CTA ═══════ */}
      {hubMode && (
        <div className="mt-10 flex w-full flex-col items-center pb-6 sm:mt-12 sm:pb-8">
          <button
            type="button"
            onClick={() => {
              try {
                play("open");
              } catch {
                /* noop */
              }
              onOpenDestinations?.();
            }}
            onMouseEnter={() => {
              try {
                play("hover");
              } catch {
                /* noop */
              }
            }}
            className="group flex flex-col items-center bg-transparent px-4 py-2"
          >
            <span
              className="text-[clamp(1.05rem,2.6vw,1.45rem)] font-light tracking-[0.18em] text-[#c8cfd8] transition-colors duration-500 group-hover:text-white"
              style={{ fontFamily: "var(--font-luxury)" }}
            >
              {ar ? "الانتقال إلى الأقسام" : "Enter the sections"}
            </span>
            <span
              className="mt-3 block h-px w-[min(14rem,55vw)] origin-center transition-all duration-500 group-hover:w-[min(18rem,65vw)] group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(160,175,200,0.55), transparent)",
                opacity: 0.85,
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        className="text-[0.62rem] tracking-[0.14em] text-[#4a5566]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      <span className={`text-[0.82rem] text-[#b0b8c4] ${mono ? "mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
