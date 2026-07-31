"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  MapPin,
  Users,
  TrendingUp,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  filterProjects,
  powerTier,
  type ClubProject,
  type ProjectTrack,
} from "@/lib/projects-data";
import { formatMoney } from "@/lib/format";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";

export default function ProjectList({
  track,
  isAr,
  rankOrd,
  onBack,
}: {
  track: ProjectTrack | "all";
  isAr: boolean;
  rankOrd: number;
  onBack: () => void;
}) {
  const { currency } = useApp();
  const [open, setOpen] = useState<ClubProject | null>(null);

  const { visible, locked } = useMemo(
    () => filterProjects(track, rankOrd),
    [track, rankOrd]
  );

  const titleAr =
    track === "private"
      ? "مشاريع خاصة"
      : track === "ground"
      ? "مشاريع على أرض الواقع"
      : track === "online"
      ? "مشاريع على الإنترنت"
      : "كل المشاريع";
  const titleEn =
    track === "private"
      ? "Private Ventures"
      : track === "ground"
      ? "Ground Operations"
      : track === "online"
      ? "Digital Ventures"
      : "All Ventures";

  const Back = isAr ? ArrowRight : ArrowLeft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[70vh] w-full bg-[#020204]"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* الرأس */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <button
            onClick={() => {
              play("open");
              onBack();
            }}
            className="mono mb-3 inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.22em] text-[#6b7383] transition-colors hover:text-[#c3c9d3]"
          >
            <Back size={12} />
            {isAr ? "رجوع إلى القمم" : "Back to summits"}
          </button>
          <h2
            className="text-3xl font-light text-[#eaeef5]"
            style={{ fontFamily: "var(--font-luxury)" }}
          >
            {isAr ? titleAr : titleEn}
          </h2>
        </div>

        <div className="mono text-[0.6rem] uppercase tracking-[0.2em] text-[#565d68]">
          {isAr
            ? `${visible.length} مشروع متاح`
            : `${visible.length} accessible`}
          {locked.length > 0 && (
            <span className="ms-3 text-[#7a6a4e]">
              {isAr ? `${locked.length} مقفل` : `${locked.length} sealed`}
            </span>
          )}
        </div>
      </div>

      {/* مرتّب من الأقوى للأصغر */}
      <p className="mono mb-5 text-[0.56rem] uppercase tracking-[0.2em] text-[#4d545f]">
        {isAr
          ? "مرتّبة حسب قوة المشروع — من الأقوى إلى الأصغر"
          : "Ordered by venture power — strongest first"}
      </p>

      <div className="space-y-3">
        {visible.map((p, i) => (
          <Row
            key={p.id}
            p={p}
            i={i}
            isAr={isAr}
            currency={currency}
            onOpen={() => {
              setOpen(p);
              play("open");
            }}
          />
        ))}

        {/* المقفلة */}
        {locked.map((p, i) => (
          <LockedRow key={p.id} p={p} i={visible.length + i} isAr={isAr} />
        ))}

        {visible.length === 0 && locked.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-12 text-center">
            <p className="text-sm text-[#6b7383]">
              {isAr ? "لا توجد مشاريع في هذا المسار." : "No ventures in this track."}
            </p>
          </div>
        )}
      </div>

      {/* تفاصيل */}
      {open && (
        <Detail
          p={open}
          isAr={isAr}
          currency={currency}
          onClose={() => setOpen(null)}
        />
      )}
    </motion.div>
  );
}

/* ---------------- صف مشروع ---------------- */
function Row({
  p,
  i,
  isAr,
  currency,
  onOpen,
}: {
  p: ClubProject;
  i: number;
  isAr: boolean;
  currency: string;
  onOpen: () => void;
}) {
  const tier = powerTier(p.power);
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.45 }}
      onMouseEnter={() => play("hover")}
      onClick={onOpen}
      className="group block w-full rounded-2xl border border-[#c3c9d3]/10 bg-gradient-to-b from-[#0b0e14]/90 to-[#050709] p-5 text-start transition-all duration-300 hover:border-[#c3c9d3]/28 hover:shadow-[0_18px_44px_rgba(0,0,0,0.7)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="mono text-[0.55rem] uppercase tracking-[0.2em] text-[#565d68]">
              {p.id.toUpperCase()}
            </span>
            {p.track === "private" && (
              <span className="rounded-full border border-[#c3c9d3]/25 bg-[#c3c9d3]/[0.06] px-2 py-0.5 text-[0.52rem] uppercase tracking-wide text-[#c3c9d3]">
                {isAr ? "خاص" : "Private"}
              </span>
            )}
            <span className="mono text-[0.55rem] uppercase tracking-[0.16em] text-[#6b7383]">
              {isAr ? tier.ar : tier.en}
            </span>
          </div>

          <h3
            className="truncate text-lg text-[#eaeef5] transition-colors group-hover:text-white"
            style={{ fontFamily: "var(--font-luxury)" }}
          >
            {isAr ? p.titleAr : p.titleEn}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-[#7f8896]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={11} /> {isAr ? p.locationAr : p.locationEn}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={11} /> {p.partners}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={11} /> {isAr ? p.statusAr : p.statusEn}
            </span>
          </div>

          {(p.routeAr || p.routeEn) && (
            <div className="mono mt-2 inline-block rounded-md border border-white/[0.07] bg-black/40 px-2.5 py-1 text-[0.6rem] tracking-wide text-[#8b95a5]">
              {isAr ? p.routeAr : p.routeEn}
            </div>
          )}
        </div>

        {/* قوة المشروع */}
        <div className="shrink-0 text-end">
          <div className="mono text-[0.52rem] uppercase tracking-[0.18em] text-[#4d545f]">
            {isAr ? "القوة" : "Power"}
          </div>
          <div className="mono mt-0.5 text-2xl font-semibold tabular-nums text-[#eaeef5]">
            {p.power}
          </div>
          <div className="mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${p.power}%` }}
              transition={{ delay: 0.15, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#6b7383] to-[#c3c9d3]"
            />
          </div>
          <div className="mono mt-2 text-sm text-[#aeb6c2]">
            {formatMoney(p.valueChf, currency as never)}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ---------------- صف مقفل ---------------- */
function LockedRow({ p, i, isAr }: { p: ClubProject; i: number; isAr: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-dashed border-[#7a6a4e]/25 bg-black/40 p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mono mb-2 text-[0.55rem] uppercase tracking-[0.2em] text-[#4d545f]">
            {p.id.toUpperCase()}
          </div>
          <div
            className="select-none text-lg text-transparent"
            style={{
              fontFamily: "var(--font-luxury)",
              textShadow: "0 0 15px rgba(174,182,194,0.42)",
            }}
          >
            {isAr ? p.titleAr : p.titleEn}
          </div>
          <p className="mt-1.5 text-[0.7rem] text-[#6b7383]">
            {isAr
              ? "هذا المشروع محجوب عن رتبتك الحالية."
              : "This venture is sealed from your current tier."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5 text-[#7a6a4e]">
          <Lock size={17} />
          <span className="mono text-[0.5rem] uppercase tracking-[0.16em]">
            {isAr ? `رتبة ${p.minRank}+` : `TIER ${p.minRank}+`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- نافذة التفاصيل ---------------- */
function Detail({
  p,
  isAr,
  currency,
  onClose,
}: {
  p: ClubProject;
  isAr: boolean;
  currency: string;
  onClose: () => void;
}) {
  const tier = powerTier(p.power);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      dir={isAr ? "rtl" : "ltr"}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#c3c9d3]/15 bg-gradient-to-b from-[#0b0e14] to-[#050709] p-7 shadow-[0_40px_100px_rgba(0,0,0,0.9)]"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mono mb-2 text-[0.55rem] uppercase tracking-[0.22em] text-[#565d68]">
              {p.id.toUpperCase()} · {isAr ? tier.ar : tier.en}
            </div>
            <h3
              className="text-2xl text-[#eaeef5]"
              style={{ fontFamily: "var(--font-luxury)" }}
            >
              {isAr ? p.titleAr : p.titleEn}
            </h3>
            <div className="mt-1.5 flex items-center gap-1.5 text-[0.78rem] text-[#7f8896]">
              <MapPin size={12} /> {isAr ? p.locationAr : p.locationEn}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] p-2 text-[#6b7383] transition-colors hover:border-white/20 hover:text-[#eaeef5]"
          >
            <X size={15} />
          </button>
        </div>

        <p className="text-[0.86rem] leading-relaxed text-[#aeb6c2]">
          {isAr ? p.summaryAr : p.summaryEn}
        </p>

        {/* الوسوم */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(isAr ? p.tagsAr : p.tagsEn).map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/[0.08] bg-black/40 px-3 py-1 text-[0.62rem] text-[#8b95a5]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* المقاييس */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Box
            label={isAr ? "قوة المشروع" : "Venture Power"}
            value={`${p.power}/100`}
          />
          <Box
            label={isAr ? "القيمة" : "Valuation"}
            value={formatMoney(p.valueChf, currency as never)}
          />
          <Box label={isAr ? "الشركاء" : "Partners"} value={`${p.partners}`} />
          <Box
            label={isAr ? "الاكتمال" : "Progress"}
            value={`${p.progress}%`}
          />
          <Box
            label={isAr ? "الحالة" : "Status"}
            value={isAr ? p.statusAr : p.statusEn}
          />
          <Box
            label={isAr ? "أدنى رتبة" : "Min Tier"}
            value={`${p.minRank}`}
          />
        </div>

        {/* شريط الاكتمال */}
        <div className="mt-5">
          <div className="mono mb-2 flex justify-between text-[0.56rem] uppercase tracking-[0.18em] text-[#4d545f]">
            <span>{isAr ? "نسبة الاكتمال" : "Completion"}</span>
            <span className="text-[#8b95a5]">{p.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${p.progress}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#4a5464] via-[#8b95a5] to-[#c3c9d3]"
            />
          </div>
        </div>

        <button
          onClick={() => play("granted")}
          onMouseEnter={() => play("hover")}
          className="mt-7 w-full rounded-xl border border-[#c3c9d3]/30 bg-gradient-to-b from-[#2a313d] to-[#0a0d13] py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#eaeef5] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#c3c9d3]/55 hover:text-white"
          style={{ fontFamily: "var(--font-luxury)" }}
        >
          <TrendingUp size={14} className="me-2 inline" />
          {isAr ? "طلب المشاركة" : "Request Participation"}
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
      <div className="mono text-[0.52rem] uppercase tracking-[0.15em] text-[#565d68]">
        {label}
      </div>
      <div className="mt-1 text-[0.82rem] text-[#dfe4ec]">{value}</div>
    </div>
  );
}
