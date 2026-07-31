"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Mountain } from "lucide-react";
import { play } from "@/lib/sound";

const TRACK_OPTIONS = [
  { id: "ground", ar: "على أرض الواقع", en: "Ground Operation" },
  { id: "online", ar: "على الإنترنت", en: "Digital Venture" },
  { id: "hybrid", ar: "مختلط", en: "Hybrid" },
];

const SCALE_OPTIONS = [
  { id: "seed", ar: "بذرة · أقل من ٥٠٠ ألف", en: "Seed · under 500K" },
  { id: "growth", ar: "نمو · ٥٠٠ ألف – ٥ مليون", en: "Growth · 500K – 5M" },
  { id: "major", ar: "كبير · أكثر من ٥ مليون", en: "Major · above 5M" },
];

export default function RequestVenture({
  isAr,
  onBack,
}: {
  isAr: boolean;
  onBack: () => void;
}) {
  const [title, setTitle] = useState("");
  const [track, setTrack] = useState("");
  const [scale, setScale] = useState("");
  const [summary, setSummary] = useState("");
  const [sent, setSent] = useState(false);

  const Back = isAr ? ArrowRight : ArrowLeft;
  const valid = title.trim() && track && scale && summary.trim().length > 12;

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center text-center"
        dir={isAr ? "rtl" : "ltr"}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 180 }}
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#c3c9d3]/30 bg-[#c3c9d3]/[0.07]"
        >
          <Check size={26} className="text-[#eaeef5]" />
        </motion.div>
        <h3
          className="text-2xl text-[#eaeef5]"
          style={{ fontFamily: "var(--font-luxury)" }}
        >
          {isAr ? "وصل طلبك" : "Request Received"}
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#7f8896]">
          {isAr
            ? "سيُعرض على مجلس الميثاق في الجلسة القادمة. ستصلك الإشارة عبر قناتك الخاصة."
            : "It will be tabled before the covenant council at the next assembly. A signal will reach you through your private channel."}
        </p>
        <button
          onClick={onBack}
          className="mono mt-8 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.22em] text-[#6b7383] transition-colors hover:text-[#c3c9d3]"
        >
          <Back size={12} />
          {isAr ? "رجوع إلى القمم" : "Back to summits"}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-2xl"
      dir={isAr ? "rtl" : "ltr"}
    >
      <button
        onClick={onBack}
        className="mono mb-6 inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.22em] text-[#6b7383] transition-colors hover:text-[#c3c9d3]"
      >
        <Back size={12} />
        {isAr ? "رجوع إلى القمم" : "Back to summits"}
      </button>

      <div className="mb-8 flex items-center gap-3">
        <Mountain size={22} className="text-[#c3c9d3]" />
        <div>
          <h2
            className="text-2xl text-[#eaeef5]"
            style={{ fontFamily: "var(--font-luxury)" }}
          >
            {isAr ? "طلب إنشاء مشروعك الخاص" : "Request Your Own Venture"}
          </h2>
          <p className="mt-1 text-[0.76rem] text-[#7f8896]">
            {isAr
              ? "قمة لم تُبنَ بعد — صِف ما تنوي إقامته."
              : "A summit not yet raised — describe what you intend to build."}
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-[#c3c9d3]/10 bg-gradient-to-b from-[#0b0e14]/90 to-[#050709] p-7">
        {/* الاسم */}
        <div>
          <label className="mono mb-2 block text-[0.56rem] uppercase tracking-[0.2em] text-[#565d68]">
            {isAr ? "اسم المشروع" : "Venture Name"}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAr ? "مثال: مصنع تعبئة زيوت" : "e.g. Oil bottling plant"}
            className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-[#eaeef5] outline-none transition-colors placeholder:text-[#4d545f] focus:border-[#c3c9d3]/35"
          />
        </div>

        {/* المسار */}
        <div>
          <label className="mono mb-2.5 block text-[0.56rem] uppercase tracking-[0.2em] text-[#565d68]">
            {isAr ? "المسار" : "Track"}
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {TRACK_OPTIONS.map((o) => (
              <Choice
                key={o.id}
                active={track === o.id}
                label={isAr ? o.ar : o.en}
                onClick={() => {
                  setTrack(o.id);
                  play("hover");
                }}
              />
            ))}
          </div>
        </div>

        {/* الحجم */}
        <div>
          <label className="mono mb-2.5 block text-[0.56rem] uppercase tracking-[0.2em] text-[#565d68]">
            {isAr ? "حجم رأس المال" : "Capital Scale"}
          </label>
          <div className="grid gap-2">
            {SCALE_OPTIONS.map((o) => (
              <Choice
                key={o.id}
                active={scale === o.id}
                label={isAr ? o.ar : o.en}
                onClick={() => {
                  setScale(o.id);
                  play("hover");
                }}
              />
            ))}
          </div>
        </div>

        {/* الوصف */}
        <div>
          <label className="mono mb-2 block text-[0.56rem] uppercase tracking-[0.2em] text-[#565d68]">
            {isAr ? "الوصف" : "Summary"}
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder={
              isAr
                ? "اشرح الفكرة والسوق والشركاء المطلوبين…"
                : "Describe the idea, the market, the partners required…"
            }
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm leading-relaxed text-[#eaeef5] outline-none transition-colors placeholder:text-[#4d545f] focus:border-[#c3c9d3]/35"
          />
        </div>

        <button
          disabled={!valid}
          onClick={() => {
            play("granted");
            setSent(true);
          }}
          className={[
            "w-full rounded-xl border py-4 text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300",
            valid
              ? "cursor-pointer border-[#c3c9d3]/32 bg-gradient-to-b from-[#2a313d] to-[#0a0d13] text-[#eaeef5] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.6)] hover:border-[#c3c9d3]/55 hover:text-white"
              : "cursor-not-allowed border-white/[0.07] bg-black/30 text-[#3f4550]",
          ].join(" ")}
          style={{ fontFamily: "var(--font-luxury)" }}
        >
          {isAr ? "إرسال الطلب" : "Submit Request"}
        </button>
      </div>
    </motion.div>
  );
}

function Choice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-3 text-start text-[0.78rem] transition-all duration-250",
        active
          ? "border-[#c3c9d3]/40 bg-[#c3c9d3]/[0.07] text-[#eaeef5]"
          : "border-white/[0.07] bg-black/30 text-[#8b95a5] hover:border-white/15 hover:text-[#c3c9d3]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
