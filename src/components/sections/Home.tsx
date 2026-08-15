"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Users, MailOpen, Layers, ArrowUpRight, Eye, EyeOff, TrendingUp, Activity,
} from "lucide-react";
import { Reveal, Pulse } from "@/components/ui";
import { WorldClock } from "@/components/brand";
import GlobalCommandGlobe from "@/components/GlobalCommandGlobe";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";
import type { SectionKey } from "@/components/Dashboard";

const TAB_NAV: { key: SectionKey; labelEn: string; labelAr: string }[] = [
  { key: "rules", labelEn: "Rules", labelAr: "القواعد" },
  { key: "goals", labelEn: "Objectives", labelAr: "الأهداف" },
  { key: "identity", labelEn: "Who Are the People of Impact", labelAr: "من هم أصحاب الأثر" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
// deterministic growth series ending at +31%
const SERIES = [4, 6, 5, 9, 8, 14, 20, 27, 31];

export default function HomeSection({
  data,
  onNavigate,
}: {
  data: AppData;
  onNavigate: (k: SectionKey) => void;
}) {
  const me = data.members[0];
  const unread = data.messages.filter((m) => !m.read).length;
  const [nameVisible, setNameVisible] = useState(false);
  const { lang } = useApp();
  const ar = lang === "ar";
  const [activeTab, setActiveTab] = useState<SectionKey | null>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 600); return () => clearTimeout(t); }, []);

  const completedProjects = useMemo(() => data.projects.filter((p) => /مكتم|Completed|complete/i.test(p.status || "")).length, [data.projects]);

  const growth = SERIES[SERIES.length - 1];
  const maxV = Math.max(...SERIES) * 1.15;
  const minV = Math.min(...SERIES) * 0.9;
  const w = 640, h = 180, pl = 30, pr = 14, pt = 12, pb = 24;
  const xs = (i: number) => pl + (i / (SERIES.length - 1)) * (w - pl - pr);
  const ys = (v: number) => pt + (1 - (v - minV) / (maxV - minV)) * (h - pt - pb);
  const pts = SERIES.map((v, i) => [xs(i), ys(v)]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${xs(SERIES.length - 1).toFixed(1)} ${h - pb} L ${xs(0).toFixed(1)} ${h - pb} Z`;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ===== Premium Navigation Tabs ===== */}
      <Reveal>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 border-b border-white/[0.06] pb-5 pt-1">
          {TAB_NAV.map((t) => {
            const on = activeTab === t.key;
            return (
              <button
                key={t.key}
                onMouseEnter={() => { setActiveTab(t.key); play("hover"); }}
                onMouseLeave={() => setActiveTab(null)}
                onClick={() => onNavigate(t.key)}
                className="group relative py-2 text-center"
              >
                <span
                  className={`text-[clamp(1.05rem,1.9vw,1.35rem)] tracking-[0.08em] transition-all duration-300 ${
                    on ? "text-white" : "text-[#9aa5b3] group-hover:text-[#eaeef5]"
                  }`}
                  style={{ fontFamily: "var(--font-luxury)", fontWeight: 700, textShadow: on ? "0 0 18px rgba(234,238,245,0.35)" : "none" }}
                >
                  {ar ? t.labelAr : t.labelEn}
                </span>
                <span className="absolute inset-x-0 -bottom-[2px] mx-auto h-[2px] bg-gradient-to-r from-transparent via-[#eaeef5] to-transparent transition-all duration-500"
                  style={{ width: on ? "100%" : "0%", boxShadow: "0 0 8px rgba(195,201,211,0.55)" }} />
                <span className="pointer-events-none absolute inset-x-0 -bottom-2 h-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(60% 100% at 50% 100%, rgba(255,255,255,0.10), transparent 70%)" }} />
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* ===== Command-Center Globe (centered, no surrounding card) ===== */}
      <Reveal>
        <div className="relative overflow-hidden min-h-[560px] lg:min-h-[620px]">
          <GlobalCommandGlobe className="absolute inset-0 w-full h-full z-0" />

          {/* header row — thin, elegant, over the top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-7 pt-6 sm:px-9">
            <span className="text-[0.78rem] tracking-[0.2em] uppercase text-[#8b95a5]" style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
              {ar ? "شبكة أصحاب الأثر الحيّة" : "Owners of Impact Live Network"}
            </span>
            <span className="mono text-[0.72rem] text-[#c3c9d3] bg-black/40 px-3 py-1 rounded-full border border-white/10">{me.code}</span>
          </div>

          {/* member identity — compact elegant overlay, bottom-left, no big box */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-6 px-7 pb-6 sm:px-9">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <h1 className="etched text-3xl font-bold tracking-tight text-[#eaeef5] sm:text-4xl" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                  {nameVisible ? me.name : "****************"}
                </h1>
                <button
                  onClick={() => { setNameVisible(!nameVisible); play("click"); }}
                  onMouseEnter={() => play("hover")}
                  className="shrink-0 rounded-lg p-2 text-[#7f8896] transition-all duration-300 hover:text-[#eaeef5] hover:bg-white/[0.05] border border-transparent hover:border-white/10"
                  aria-label="Toggle name visibility"
                >
                  {nameVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#aeb6c2]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>{me.bio}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.7rem]"
                  style={{ border: "1px solid rgba(195,201,211,0.35)", background: "rgba(5,6,8,0.55)", color: "#eaeef5" }}>
                  <span className="h-1.5 w-1.5 rotate-45 bg-[#c3c9d3]" /> {ar ? "الرتبة" : "Rank"}: {me.rank}
                </span>
                <span className="text-[0.7rem] text-[#aeb6c2]" style={{ background: "rgba(5,6,8,0.55)", padding: "2px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.06)" }}>{me.role}</span>
                <span className="flex items-center gap-1.5 text-[0.7rem] text-[#8b95a5]" style={{ background: "rgba(5,6,8,0.55)", padding: "2px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <MapPin size={12} /> {me.city} · {me.country}
                </span>
              </div>
            </div>

            <div className="hidden lg:block space-y-1.5 text-right">
              <MetaRow label={ar ? "رقم العضوية" : "Membership No."} value={me.code} mono />
              <MetaRow label={ar ? "سنة الانضمام" : "Join Year"} value={String(me.memberSince)} mono />
              <MetaRow label={ar ? "مشاريع مرتبطة" : "Related Projects"} value={String(data.projects.length)} mono />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ===== Operational Performance Dashboard ===== */}
      <Reveal delay={0.05}>
        <Panel className="p-6 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="eyebrow">{ar ? "لوحة الأداء التشغيلي" : "Operational Performance"}</div>
              <h3 className="mt-1 text-lg font-semibold text-[#eaeef5]">
                {ar ? "الأداء السنوي الحالي" : "Current Yearly Performance"}
              </h3>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-4 py-2">
              <TrendingUp size={15} className="text-[#7f8896]" />
              <span className="text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>+{growth}%</span>
              <span className="flex items-center gap-1 text-[0.7rem] text-[#7f8896]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7a9a7a]" style={{ boxShadow: "0 0 6px #7a9a7a" }} />
                {ar ? "نمو" : "Growth"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* line chart */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-white/[0.06] bg-black/20 p-4">
                <div className="relative w-full">
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
                    {/* grid lines */}
                    {[0.25, 0.5, 0.75].map((f) => (
                      <line key={f} x1={pl} x2={w - pr} y1={pt + f * (h - pt - pb)} y2={pt + f * (h - pt - pb)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    ))}
                    {/* area */}
                    <motion.path d={area} fill="url(#perfGrad)" opacity={drawn ? 0.35 : 0} initial={false} animate={{ opacity: drawn ? 0.35 : 0 }} transition={{ duration: 1.4 }} />
                    <defs>
                      <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eaeef5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#eaeef5" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* line */}
                    <motion.path d={line} fill="none" stroke="#dfe8f2" strokeWidth="2" strokeLinecap="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: drawn ? 1 : 0 }} transition={{ duration: 1.6, ease: "easeInOut" }} />
                    {/* data points */}
                    {pts.map(([x, y], i) => (
                      <motion.circle key={i} cx={x} cy={y} r="2.6" fill="#eaeef5"
                        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: drawn ? 1 : 0, scale: drawn ? 1 : 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + i * 0.12 }} />
                    ))}
                    {/* x labels */}
                    {MONTHS.map((m, i) => (
                      <text key={m} x={xs(i)} y={h - 6} textAnchor="middle" fill="rgba(150,160,175,0.55)" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>{m}</text>
                    ))}
                    {/* y labels */}
                    {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
                      <text key={i} x={pl - 5} y={ys(v) + 3} textAnchor="end" fill="rgba(150,160,175,0.4)" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(v)}</text>
                    ))}
                  </svg>
                  {/* current value badge */}
                  <div className="pointer-events-none absolute right-2 top-2 rounded border border-white/10 bg-black/60 px-2 py-1 text-[0.62rem] text-[#eaeef5]" style={{ fontFamily: "var(--font-mono)" }}>
                    {ar ? "الحالي" : "Current"}: +{growth}%
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[0.7rem] text-[#565d68]">
                {ar ? "منحنى تصاعدي ثابت عبر الأشهر الثمانية — يعكس نمواً سنوياً +31%" : "Steady upward curve across eight months — reflects +31% annual growth."}
              </p>
            </div>

            {/* right stats */}
            <div className="space-y-3">
              <MiniStat label={ar ? "أعلى نقطة" : "Highest Point"} value="+27%" />
              <MiniStat label={ar ? "الانطلاق" : "Start"} value="+4%" />
              <MiniStat label={ar ? "مشاريع نشطة" : "Active Projects"} value={String(data.projects.length)} />
              <MiniStat label={ar ? "رسائل غير مقروءة" : "Unread Messages"} value={String(unread)} />
              <div className="rounded-lg border border-white/[0.06] bg-black/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-[0.7rem] text-[#7f8896]">
                  <Activity size={13} /> {ar ? "أحداث تشغيلية" : "Operational Events"}
                </div>
                <div className="space-y-2 text-[0.72rem] text-[#aeb6c2]">
                  <div className="flex justify-between"><span>{ar ? "تحديث أرشيف" : "Archive update"}</span><span className="mono text-[#565d68]">02:14</span></div>
                  <div className="flex justify-between"><span>{ar ? "إغلاق مشروع" : "Project closed"}</span><span className="mono text-[#565d68]">09:40</span></div>
                  <div className="flex justify-between"><span>{ar ? "جلسة مشفّرة" : "Encrypted session"}</span><span className="mono text-[#565d68]">11:02</span></div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </Reveal>

      {/* ===== Quick glance + World clocks ===== */}
      <div className="grid gap-7 lg:grid-cols-3">
        <Reveal delay={0.1} className="lg:col-span-2">
          <Panel className="h-full p-6">
            <div className="eyebrow mb-4">{ar ? "نظرة سريعة" : "Quick Glance"}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickRow icon={Users} label={ar ? "إجمالي الأعضاء" : "Total members"} value={`${data.members.length}`} onClick={() => onNavigate("members")} />
              <QuickRow icon={MailOpen} label={ar ? "رسائل غير مقروءة" : "Unread messages"} value={`${unread}`} onClick={() => onNavigate("messages")} />
              <QuickRow icon={Layers} label={ar ? "مشاريع نشطة" : "Active projects"} value={`${data.projects.length}`} onClick={() => onNavigate("projects")} />
              <QuickRow icon={ArrowUpRight} label={ar ? "أصول استثمارية" : "Investment assets"} value={`${data.investments.length}`} onClick={() => onNavigate("investments")} />
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.15}>
          <Panel className="h-full p-6">
            <div className="eyebrow mb-3">{ar ? "الساعات العالمية" : "World Clocks"}</div>
            <WorldClock />
            <div className="divider my-5" />
            <div className="flex items-center gap-2 text-[0.72rem] text-[#7f8896]">
              <Pulse /> {ar ? "النظام يعمل ضمن القناة المشفّرة" : "System running on encrypted channel"}
            </div>
          </Panel>
        </Reveal>
      </div>
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-[#0a0b0e] ${className ?? ""}`}>{children}</div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[0.62rem] tracking-[0.14em] text-[#565d68]" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
      <span className={`text-[0.82rem] text-[#d6dee7] ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-black/20 px-4 py-3">
      <span className="text-[0.7rem] text-[#7f8896]">{label}</span>
      <span className="text-[0.92rem] text-[#eaeef5]" style={{ fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}

function QuickRow({ icon: Icon, label, value, onClick }: { icon: typeof Users; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg border border-white/[0.05] bg-black/20 p-3 text-right transition hover:border-white/15 hover:bg-white/[0.04]">
      <Icon size={15} className="text-[#7f8896]" />
      <span className="flex-1 text-[0.8rem] text-[#aeb6c2]">{label}</span>
      <span className="mono text-[0.78rem] text-[#eaeef5]">{value}</span>
    </button>
  );
}
