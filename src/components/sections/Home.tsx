"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Users, MailOpen, Layers, ArrowUpRight, ArrowLeft, Eye, EyeOff, TrendingUp, Activity,
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

/* Journey through the house — each chapter opens a room */
const JOURNEY: { key: SectionKey; no: string; en: string; subEn: string; ar: string; subAr: string }[] = [
  { key: "home", no: "01", en: "The House", subEn: "Where the circle began — the covenant, the rooms, the rules.", ar: "البيت", subAr: "حيث بدأت الدائرة — الميثاق، والغرف، والقواعد." },
  { key: "network", no: "02", en: "The Network", subEn: "Five nodes, five cities, one quiet command.", ar: "الشبكة", subAr: "خمس عقد، خمس مدن، قيادة واحدة هادئة." },
  { key: "investments", no: "03", en: "Investments", subEn: "The long game — equity, land, metal, digital.", ar: "الاستثمارات", subAr: "اللعبة الطويلة — أسهم، وعقار، ومعادن، ورقمي." },
  { key: "vip", no: "04", en: "Experiences", subEn: "Private dining, aviation, the yacht, the concierge.", ar: "التجارب", subAr: "مأدبة خاصة، وطيران، ويخت، وخدمة كونسيرج." },
  { key: "archive", no: "05", en: "The Archive", subEn: "Every record, every year, kept sealed.", ar: "الأرشيف", subAr: "كل سجلّ، وكل سنة، محفوظ ومختوم." },
  { key: "vip", no: "06", en: "The Elite", subEn: "Access granted only to those the house admits.", ar: "النخبة", subAr: "دخول لا يُمنح إلا لمن يعرفه البيت." },
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
    <>
      <div className="mx-auto max-w-7xl space-y-12">
        {/* ═══════ The Journey — index into the house ═══════ */}
        <Reveal>
          <div className="border-b border-[#6b9ac8]/10 pb-2 pt-1">
            <div className="mb-7 flex items-end justify-between">
              <div>
                <div className="eyebrow" style={{ color: "#6b9ac8" }}>{ar ? "رحلتك في النادي" : "Your Passage"}</div>
                <h2 className="mt-3 text-[clamp(2rem,5vw,3.4rem)] font-light uppercase tracking-[0.14em] text-[#e6eef8]" style={{ fontFamily: "var(--font-luxury)" }}>
                  {ar ? "منزل أصحاب الأثر" : "The House"}
                </h2>
              </div>
              <span className="hidden sm:block text-[0.46rem] uppercase tracking-[0.3em] text-[#657384]" style={{ fontFamily: "var(--font-ibm-mono)" }}>EST. 2012 · BY COVENANT</span>
            </div>
            <div className="flex flex-col">
              {JOURNEY.map((j, i) => (
                <button type="button"
                  key={`${j.no}-${i}`}
                  onClick={() => { onNavigate(j.key); try { play("open"); } catch {} }}
                  onMouseEnter={() => play("hover")}
                  className="group flex w-full items-center gap-6 border-b border-[#6b9ac8]/[0.08] py-5 text-left transition-colors duration-300 hover:bg-[#6b9ac8]/[0.03] sm:gap-10"
                  style={{ textAlign: ar ? "right" : "left" }}
                >
                  <span className="shrink-0 text-[0.62rem] tracking-[0.2em] text-[#3d6a94]" style={{ fontFamily: "var(--font-ibm-mono)" }}>{j.no}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[clamp(1.1rem,2.4vw,1.6rem)] font-light uppercase tracking-[0.12em] text-[#e6eef8] transition-colors duration-300 group-hover:text-[#a8cfe8]" style={{ fontFamily: "var(--font-luxury)" }}>
                      {ar ? j.ar : j.en}
                    </div>
                    <div className="mt-1 text-[0.68rem] tracking-[0.04em] text-[#657384]" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                      {ar ? j.subAr : j.subEn}
                    </div>
                  </div>
                  <span className="shrink-0 text-[#3d6a94] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" style={{ transform: "translateX(-6px)" }}>
                    {ar ? <ArrowLeft size={16} /> : <ArrowUpRight size={16} />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ═══════ The Rooms ═══════ */}
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 border-b border-[#6b9ac8]/[0.08] pb-5 pt-1">
            {TAB_NAV.map((t2) => {
              const on = activeTab === t2.key;
              return (
                <button type="button"
                  key={t2.key}
                  onMouseEnter={() => { setActiveTab(t2.key); play("hover"); }}
                  onMouseLeave={() => setActiveTab(null)}
                  onClick={() => onNavigate(t2.key)}
                  className="group relative py-2 text-center"
                >
                  <span
                    className={`text-[clamp(0.95rem,1.7vw,1.2rem)] tracking-[0.1em] transition-all duration-300 ${on ? "text-[#a8cfe8]" : "text-[#8b8577] group-hover:text-[#e6eef8]"}`}
                    style={{ fontFamily: "var(--font-luxury)", fontWeight: 600, textShadow: on ? "0 0 18px rgba(126,176,216,0.3)" : "none" }}
                  >
                    {ar ? t2.labelAr : t2.labelEn}
                  </span>
                  <span className="absolute inset-x-0 -bottom-[2px] mx-auto h-px transition-all duration-500"
                    style={{ width: on ? "100%" : "0%", background: "linear-gradient(90deg, transparent, #6b9ac8, transparent)" }} />
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* ═══════ Global Command Globe — the operations heart, full-bleed ═══════ */}
        <Reveal>
          <div
            className="relative overflow-hidden min-h-[560px] lg:min-h-[640px]"
            style={{ background: "radial-gradient(120% 90% at 50% 30%, #0c0a07 0%, #05070c 62%, #030202 100%)", boxShadow: "inset 0 0 160px 40px rgba(126,176,216,0.05)" }}
          >
            <GlobalCommandGlobe className="absolute inset-0 w-full h-full z-0" />

            {/* header row — thin, elegant, over the top */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-7 pt-6 sm:px-9">
              <span className="text-[0.72rem] tracking-[0.26em] uppercase text-[#3d6a94]" style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                {ar ? "شبكة القيادة العالمية" : "Global Command Network"}
              </span>
              <span className="mono text-[0.66rem] text-[#6b9ac8]/80 bg-black/40 px-3 py-1 rounded-full border border-[#6b9ac8]/15">{me.code}</span>
            </div>

            {/* member identity — compact, bottom-left (pointer-events only on interactive bits) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-6 px-7 pb-6 sm:px-9">
              <div className="max-w-md">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-light tracking-tight text-[#e6eef8] sm:text-4xl" style={{ fontFamily: "var(--font-luxury)", textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                    {nameVisible ? me.name : "****************"}
                  </h1>
                  <button
                    type="button"
                    onClick={() => { setNameVisible(!nameVisible); play("click"); }}
                    onMouseEnter={() => play("hover")}
                    className="pointer-events-auto shrink-0 rounded-md p-2 text-[#3d6a94] transition-all duration-300 hover:text-[#a8cfe8] border border-transparent hover:border-[#6b9ac8]/20"
                    aria-label="Toggle name visibility"
                  >
                    {nameVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#8a97a8]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>{me.bio}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem]" style={{ border: "1px solid rgba(126,176,216,0.3)", background: "rgba(8,7,5,0.55)", color: "#a8cfe8" }}>
                    <span className="h-1.5 w-1.5 rotate-45 bg-[#6b9ac8]" /> {ar ? "الرتبة" : "Rank"}: {me.rank}
                  </span>
                  <span className="text-[0.68rem] text-[#8a97a8]" style={{ background: "rgba(8,7,5,0.55)", padding: "2px 10px", borderRadius: 999, border: "1px solid rgba(126,176,216,0.1)" }}>{me.role}</span>
                  <span className="flex items-center gap-1.5 text-[0.68rem] text-[#8b8577]" style={{ background: "rgba(8,7,5,0.55)", padding: "2px 10px", borderRadius: 999, border: "1px solid rgba(126,176,216,0.1)" }}>
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

        {/* ═══════ Operational Performance Dashboard ═══════ */}
        <Reveal delay={0.05}>
          <Panel className="p-6 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="eyebrow" style={{ color: "#6b9ac8" }}>{ar ? "لوحة الأداء التشغيلي" : "Operational Performance"}</div>
                <h3 className="mt-1 text-lg font-light text-[#e6eef8]" style={{ fontFamily: "var(--font-luxury)" }}>
                  {ar ? "الأداء السنوي الحالي" : "Current Yearly Performance"}
                </h3>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-[#6b9ac8]/15 bg-black/20 px-4 py-2">
                <TrendingUp size={15} className="text-[#3d6a94]" />
                <span className="text-2xl font-medium text-[#a8cfe8]" style={{ fontFamily: "var(--font-mono)" }}>+{growth}%</span>
                <span className="flex items-center gap-1 text-[0.7rem] text-[#8b8577]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6b9ac8]" style={{ boxShadow: "0 0 6px #6b9ac8" }} />
                  {ar ? "نمو" : "Growth"}
                </span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-md border border-[#6b9ac8]/10 bg-black/20 p-4">
                  <div className="relative w-full">
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
                      {[0.25, 0.5, 0.75].map((f) => (
                        <line key={f} x1={pl} x2={w - pr} y1={pt + f * (h - pt - pb)} y2={pt + f * (h - pt - pb)} stroke="rgba(126,176,216,0.05)" strokeWidth="1" />
                      ))}
                      <motion.path d={area} fill="url(#perfGrad)" opacity={drawn ? 0.3 : 0} initial={false} animate={{ opacity: drawn ? 0.3 : 0 }} transition={{ duration: 1.4 }} />
                      <defs>
                        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7eb0d8" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#7eb0d8" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <motion.path d={line} fill="none" stroke="#7eb0d8" strokeWidth="1.6" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: drawn ? 1 : 0 }} transition={{ duration: 1.6, ease: "easeInOut" }} />
                      {pts.map(([x, y], i) => (
                        <motion.circle key={i} cx={x} cy={y} r="2.4" fill="#a8cfe8"
                          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: drawn ? 1 : 0, scale: drawn ? 1 : 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + i * 0.12 }} />
                      ))}
                      {MONTHS.map((m, i) => (
                        <text key={m} x={xs(i)} y={h - 6} textAnchor="middle" fill="rgba(124,118,104,0.6)" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>{m}</text>
                      ))}
                      {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
                        <text key={i} x={pl - 5} y={ys(v) + 3} textAnchor="end" fill="rgba(124,118,104,0.5)" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(v)}</text>
                      ))}
                    </svg>
                    <div className="pointer-events-none absolute right-2 top-2 rounded border border-[#6b9ac8]/15 bg-black/60 px-2 py-1 text-[0.62rem] text-[#a8cfe8]" style={{ fontFamily: "var(--font-mono)" }}>
                      {ar ? "الحالي" : "Current"}: +{growth}%
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[0.7rem] text-[#4a5566]">
                  {ar ? "منحنى تصاعدي ثابت عبر الأشهر الثمانية — يعكس نمواً سنوياً +31%" : "Steady upward curve across eight months — reflects +31% annual growth."}
                </p>
              </div>

              <div className="space-y-3">
                <MiniStat label={ar ? "أعلى نقطة" : "Highest Point"} value="+27%" />
                <MiniStat label={ar ? "الانطلاق" : "Start"} value="+4%" />
                <MiniStat label={ar ? "مشاريع نشطة" : "Active Projects"} value={String(data.projects.length)} />
                <MiniStat label={ar ? "رسائل غير مقروءة" : "Unread Messages"} value={String(unread)} />
                <div className="rounded-md border border-[#6b9ac8]/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[0.7rem] text-[#8b8577]">
                    <Activity size={13} /> {ar ? "أحداث تشغيلية" : "Operational Events"}
                  </div>
                  <div className="space-y-2 text-[0.72rem] text-[#8a97a8]">
                    <div className="flex justify-between"><span>{ar ? "تحديث أرشيف" : "Archive update"}</span><span className="mono text-[#4a5566]">02:14</span></div>
                    <div className="flex justify-between"><span>{ar ? "إغلاق مشروع" : "Project closed"}</span><span className="mono text-[#4a5566]">09:40</span></div>
                    <div className="flex justify-between"><span>{ar ? "جلسة مشفّرة" : "Encrypted session"}</span><span className="mono text-[#4a5566]">11:02</span></div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </Reveal>

        {/* ═══════ Quick glance + World clocks ═══════ */}
        <div className="grid gap-7 lg:grid-cols-3">
          <Reveal delay={0.1} className="lg:col-span-2">
            <Panel className="h-full p-6">
              <div className="eyebrow mb-4" style={{ color: "#6b9ac8" }}>{ar ? "نظرة سريعة" : "Quick Glance"}</div>
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
              <div className="eyebrow mb-3" style={{ color: "#6b9ac8" }}>{ar ? "الساعات العالمية" : "World Clocks"}</div>
              <WorldClock />
              <div className="divider my-5" />
              <div className="flex items-center gap-2 text-[0.72rem] text-[#8b8577]">
                <Pulse /> {ar ? "النظام يعمل ضمن القناة المشفّرة" : "System running on encrypted channel"}
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>
    </>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#6b9ac8]/[0.10] bg-[#070a10] ${className ?? ""}`}>{children}</div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[0.62rem] tracking-[0.14em] text-[#4a5566]" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
      <span className={`text-[0.82rem] text-[#b8c5d6] ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#6b9ac8]/[0.10] bg-black/20 px-4 py-3">
      <span className="text-[0.7rem] text-[#8b8577]">{label}</span>
      <span className="text-[0.92rem] text-[#e6eef8]" style={{ fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}

function QuickRow({ icon: Icon, label, value, onClick }: { icon: typeof Users; label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-md border border-[#6b9ac8]/[0.08] bg-black/20 p-3 text-right transition hover:border-[#6b9ac8]/25 hover:bg-[#6b9ac8]/[0.03]">
      <Icon size={15} className="text-[#3d6a94]" />
      <span className="flex-1 text-[0.8rem] text-[#8a97a8]">{label}</span>
      <span className="mono text-[0.78rem] text-[#e6eef8]">{value}</span>
    </button>
  );
}
