"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";

/* ==================================================================
   Investments — professional Investment Terminal (dark / premium /
   institutional / minimal). PERSONAL (empty state) ⇄ CLUB (77 real
   opportunities across 6 categories). Rebuilt from scratch, no Cards.
   ================================================================== */

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

/* بيانات حقيقية للـ CLUB — المجموع 77 */
interface Category {
  id: string;
  num: string;
  title: string;
  available: number;
  tags: string[];
}

const CATEGORIES: Category[] = [
  { id: "stocks", num: "01", title: "Stocks", available: 24, tags: ["US Equities", "Tech", "Semiconductors", "Energy", "Financials", "Healthcare"] },
  { id: "realestate", num: "02", title: "Real Estate", available: 15, tags: ["Residential", "Commercial", "Land", "Development"] },
  { id: "funds", num: "03", title: "Funds", available: 11, tags: ["Index Funds", "ETF", "Private Funds", "Bond Funds"] },
  { id: "cars", num: "04", title: "Cars", available: 7, tags: ["Collector", "Luxury", "Performance", "Classic"] },
  { id: "commodities", num: "05", title: "Commodities", available: 13, tags: ["Gold", "Silver", "Oil", "Energy", "Metals"] },
  { id: "crypto", num: "06", title: "Crypto", available: 7, tags: ["BTC", "ETH", "Major Assets", "Digital Assets"] },
];

/* نموذج أصول افتراضية لكل قسم للعرض الداخلي */
const ITEMS: Record<string, { name: string; category: string; value: string; status: string }[]> = {
  stocks: [
    { name: "Index Equity Pool", category: "US Equities", value: "$12,400", status: "AVAILABLE" },
    { name: "Tech Growth Basket", category: "Tech", value: "$8,900", status: "AVAILABLE" },
    { name: "Semiconductor Fund", category: "Semiconductors", value: "$6,200", status: "AVAILABLE" },
    { name: "Energy Majors", category: "Energy", value: "$4,700", status: "AVAILABLE" },
  ],
  realestate: [
    { name: "Residential Units", category: "Residential", value: "$45,000", status: "AVAILABLE" },
    { name: "Commercial Lease", category: "Commercial", value: "$38,500", status: "AVAILABLE" },
    { name: "Land Plot", category: "Land", value: "$22,000", status: "AVAILABLE" },
  ],
  funds: [
    { name: "Index Fund Series", category: "Index Funds", value: "$9,300", status: "AVAILABLE" },
    { name: "Global ETF", category: "ETF", value: "$5,100", status: "AVAILABLE" },
    { name: "Private Equity Pool", category: "Private Funds", value: "$15,800", status: "AVAILABLE" },
  ],
  cars: [
    { name: "Collector Classic", category: "Collector", value: "$180,000", status: "AVAILABLE" },
    { name: "Luxury Sedan", category: "Luxury", value: "$96,000", status: "AVAILABLE" },
    { name: "Track Performance", category: "Performance", value: "$74,500", status: "AVAILABLE" },
  ],
  commodities: [
    { name: "Gold Bullion", category: "Gold", value: "$6,800", status: "AVAILABLE" },
    { name: "Silver Reserve", category: "Silver", value: "$1,900", status: "AVAILABLE" },
    { name: "Crude Futures", category: "Oil", value: "$3,400", status: "AVAILABLE" },
  ],
  crypto: [
    { name: "Bitcoin Core", category: "BTC", value: "$48,000", status: "AVAILABLE" },
    { name: "Ethereum Pool", category: "ETH", value: "$2,300", status: "AVAILABLE" },
    { name: "Major Digital Assets", category: "Major Assets", value: "$1,100", status: "AVAILABLE" },
  ],
};

const TOTAL = 77;

export default function InvestmentsSection({ data: _data }: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [scope, setScope] = useState<"personal" | "club">("club");
  const [openCat, setOpenCat] = useState<string | null>(null);

  const t = (en: string, arText?: string) => (ar ? (arText ?? en) : en);

  const switchScope = (s: "personal" | "club") => {
    setScope(s);
    setOpenCat(null);
    play("click");
  };

  const openCategory = (id: string) => {
    setOpenCat(id);
    play("open");
  };

  const goBack = () => {
    setOpenCat(null);
    play("click");
  };

  return (
    <div className="mx-auto max-w-6xl px-1" dir={ar ? "rtl" : "ltr"}>
      {/* ═══ HEADER / SWITCHER ═══ */}
      <header className="mb-8">
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-semibold uppercase tracking-[0.12em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
          {t("Portfolio")}
        </h1>
        {/* Switcher */}
        <div className="mt-5 flex items-center gap-7 border-b border-white/[0.07]">
          {(["personal", "club"] as const).map((s) => {
            const on = scope === s;
            return (
              <button
                key={s}
                onClick={() => switchScope(s)}
                className="relative pb-2.5 text-[0.78rem] uppercase tracking-[0.25em] transition-colors duration-300"
                style={{ fontFamily: MONO, color: on ? "#eef2f7" : "#5d6675" }}
              >
                {t(s === "personal" ? "Personal" : "Club")}
                {on && (
                  <motion.span layoutId="scope-underline" className="absolute inset-x-0 bottom-0 h-px bg-[#7fb0ff]" style={{ boxShadow: "0 0 8px #7fb0ff" }} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {scope === "personal" ? (
          <motion.div key="personal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {/* PERSONAL — حالة فارغة */}
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>
              Personal Portfolio
            </div>

            <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-3">
              <Metric label="Balance" value="$0" />
              <Metric label="Active Positions" value="0" />
              <Metric label="Total Investments" value="0" />
            </div>

            <div className="mt-10 flex flex-col items-center border-t border-white/[0.06] pt-10 text-center">
              <div className="text-[0.95rem] uppercase tracking-[0.3em] text-[#9aa5b3]" style={{ fontFamily: MONO }}>
                No Personal Investments
              </div>
              <p className="mt-2 max-w-[46ch] text-[0.72rem] leading-relaxed text-[#5d6675]" style={{ fontFamily: MONO }}>
                Your personal portfolio is currently empty.
              </p>
            </div>
          </motion.div>
        ) : openCat ? (
          /* ═══ INSIDE A CATEGORY ═══ */
          <motion.div key="cat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <button onClick={goBack} className="mb-6 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-[#7fb0ff] hover:text-sky-200" style={{ fontFamily: MONO }}>
              <ArrowLeft size={13} /> {t("Back")}
            </button>
            {CATEGORIES.filter((c) => c.id === openCat).map((c) => (
              <div key={c.id}>
                <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-4">
                  <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
                    {c.title}
                  </h2>
                  <span className="text-[0.7rem] uppercase tracking-[0.2em] text-[#7fb0ff]" style={{ fontFamily: MONO }}>
                    {c.available} Available
                  </span>
                </div>
                {/* Terminal rows */}
                <div className="mt-4">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-white/[0.05] pb-2 text-[0.5rem] uppercase tracking-[0.2em] text-[#454d5a]" style={{ fontFamily: MONO }}>
                    <span>Asset</span><span>Category</span><span>Value</span><span>Status</span>
                  </div>
                  {(ITEMS[c.id] || []).map((it, i) => (
                    <Row key={i} it={it} i={i} />
                  ))}
                  <div className="mt-4 text-[0.55rem] uppercase tracking-[0.25em] text-[#454d5a]" style={{ fontFamily: MONO }}>
                    {c.available} total entries · {c.tags.length} sub-categories
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          /* ═══ CLUB ═══ */
          <motion.div key="club" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>
              Club Portfolio
            </div>

            {/* ملخص */}
            <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] sm:grid-cols-2">
              <Metric label="Total Available" value={String(TOTAL)} highlight />
              <Metric label="Available Categories" value="6" />
            </div>

            {/* AVAILABLE INVESTMENTS */}
            <div className="mb-5 mt-8 text-[0.6rem] uppercase tracking-[0.3em] text-[#7b8494]" style={{ fontFamily: MONO }}>
              Available Investments
            </div>

            {/* شبكة الأقسام — صفوف 2 × 3 */}
            <div className="grid grid-cols-1 gap-px border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2">
              {CATEGORIES.map((c) => (
                <CategoryCell key={c.id} c={c} onClick={() => openCategory(c.id)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── components ─────────── */

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-[#07080a] px-4 py-5">
      <div className="text-[0.52rem] uppercase tracking-[0.24em] text-[#5d6675]" style={{ fontFamily: MONO }}>{label}</div>
      <div className="mt-1.5 text-[1.5rem] leading-none" style={{ fontFamily: MONO, color: highlight ? "#7fb0ff" : "#eef2f7" }}>{value}</div>
    </div>
  );
}

function CategoryCell({ c, onClick }: { c: Category; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start justify-between gap-4 bg-[#07080a] px-5 py-5 text-left transition-colors duration-300 hover:bg-[#0a0d12]"
    >
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-[0.55rem] tracking-[0.2em] text-[#454d5a]" style={{ fontFamily: MONO }}>{c.num}</span>
          <span className="text-[0.95rem] uppercase tracking-[0.14em] text-[#e8ecf1] transition-colors group-hover:text-white" style={{ fontFamily: LUX }}>
            {c.title}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {c.tags.slice(0, 3).map((tg) => (
            <span key={tg} className="text-[0.5rem] tracking-[0.08em] text-[#5d6675]" style={{ fontFamily: MONO }}>{tg.toUpperCase()}</span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-[0.6rem] uppercase tracking-[0.15em] text-[#7fb0ff]" style={{ fontFamily: MONO }}>{c.available}</span>
        <span className="text-[0.5rem] uppercase tracking-[0.2em] text-[#5d6675] transition-colors group-hover:text-[#7fb0ff]" style={{ fontFamily: MONO }}>OPEN →</span>
      </div>
    </button>
  );
}

function Row({ it, i }: { it: { name: string; category: string; value: string; status: string }; i: number }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 border-b border-white/[0.04] py-2.5 transition-colors hover:bg-[#0a0d12]">
      <span className="text-[0.7rem] tracking-[0.05em] text-[#cfd7e1]" style={{ fontFamily: MONO }}>{it.name}</span>
      <span className="text-[0.62rem] text-[#6d7685]" style={{ fontFamily: MONO }}>{it.category}</span>
      <span className="text-[0.7rem] text-[#eef2f7]" style={{ fontFamily: MONO }}>{it.value}</span>
      <button className="flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.2em] text-[#7fb0ff] hover:text-sky-200" style={{ fontFamily: MONO }}>
        <span className="h-1 w-1 rounded-full bg-[#7fb0ff]" /> VIEW
      </button>
    </div>
  );
}
