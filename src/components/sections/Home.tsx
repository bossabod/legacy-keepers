"use client";
import { useEffect, useMemo, useState } from "react";
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
      <div className="page-shell space-y-8 sm:space-y-10 lg:space-y-12">
        {/* ═══════ Global Command Globe — full container, complete edges ═══════ */}
        <Reveal>
          <div
            className="relative w-full min-w-0 overflow-hidden rounded-xl border border-[#2a2a2a]"
            style={{
              height: "clamp(360px, 62dvh, 680px)",
              minHeight: "min(360px, 70dvh)",
              background: "radial-gradient(120% 90% at 50% 40%, #0e0e0e 0%, #080808 55%, #050505 100%)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.55)",
            }}
          >
            {/* header inside container */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 border-b border-[#1a1a1a]/80 px-3 py-2.5 sm:px-6 sm:py-3.5 md:px-8">
              <span className="min-w-0 truncate text-[0.62rem] uppercase tracking-[0.12em] text-[#8a8a8a] sm:text-[0.72rem] sm:tracking-[0.2em]" style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                {ar ? "شبكة القيادة العالمية" : "Global Command Network"}
              </span>
              <span className="mono shrink-0 rounded-full border border-[#9a9a9a]/15 bg-black/40 px-2 py-1 text-[0.55rem] text-[#9a9a9a]/80 sm:px-3 sm:text-[0.66rem]">{me.code}</span>
            </div>

            {/* globe fills the box — centered, no overflow */}
            <div className="absolute inset-0 z-0 pb-[min(38%,11rem)] pt-11 sm:pb-28 sm:pt-12">
              <GlobalCommandGlobe className="h-full w-full" />
            </div>

            {/* member identity — bottom overlay */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-3 border-t border-[#1a1a1a]/80 px-3 pb-3 pt-3 sm:gap-6 sm:px-6 sm:pb-5 sm:pt-4 md:px-8">
              <div className="min-w-0 max-w-full sm:max-w-md">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <h1 className="min-w-0 truncate text-xl font-light tracking-tight text-[#e8e8e8] sm:text-3xl md:text-4xl" style={{ fontFamily: "var(--font-luxury)", textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                    {nameVisible ? me.name : "****************"}
                  </h1>
                  <button
                    type="button"
                    onClick={() => { setNameVisible(!nameVisible); play("click"); }}
                    onMouseEnter={() => play("hover")}
                    className="pointer-events-auto shrink-0 rounded-md p-2 text-[#6a6a6a] transition-all duration-300 hover:text-[#c0c0c0] border border-transparent hover:border-[#9a9a9a]/20"
                    aria-label="Toggle name visibility"
                  >
                    {nameVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#8a8a8a]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>{me.bio}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem]" style={{ border: "1px solid rgba(170,170,170,0.3)", background: "rgba(8,8,8,0.55)", color: "#c0c0c0" }}>
                    <span className="h-1.5 w-1.5 rotate-45 bg-[#9a9a9a]" /> {ar ? "الرتبة" : "Rank"}: {me.rank}
                  </span>
                  <span className="text-[0.68rem] text-[#8a8a8a]" style={{ background: "rgba(8,8,8,0.55)", padding: "2px 10px", borderRadius: 999, border: "1px solid rgba(170,170,170,0.1)" }}>{me.role}</span>
                  <span className="flex items-center gap-1.5 text-[0.68rem] text-[#8b8577]" style={{ background: "rgba(8,8,8,0.55)", padding: "2px 10px", borderRadius: 999, border: "1px solid rgba(170,170,170,0.1)" }}>
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
                <div className="eyebrow" style={{ color: "#9a9a9a" }}>{ar ? "لوحة الأداء التشغيلي" : "Operational Performance"}</div>
                <h3 className="mt-1 text-lg font-light text-[#e8e8e8]" style={{ fontFamily: "var(--font-luxury)" }}>
                  {ar ? "الأداء السنوي الحالي" : "Current Yearly Performance"}
                </h3>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-[#9a9a9a]/15 bg-black/20 px-4 py-2">
                <TrendingUp size={15} className="text-[#6a6a6a]" />
                <span className="text-2xl font-medium text-[#c0c0c0]" style={{ fontFamily: "var(--font-mono)" }}>+{growth}%</span>
                <span className="flex items-center gap-1 text-[0.7rem] text-[#8b8577]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9a9a9a]" style={{ boxShadow: "0 0 6px #9a9a9a" }} />
                  {ar ? "نمو" : "Growth"}
                </span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-md border border-[#9a9a9a]/10 bg-black/20 p-4">
                  <div className="relative w-full">
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
                      {[0.25, 0.5, 0.75].map((f) => (
                        <line key={f} x1={pl} x2={w - pr} y1={pt + f * (h - pt - pb)} y2={pt + f * (h - pt - pb)} stroke="rgba(170,170,170,0.05)" strokeWidth="1" />
                      ))}
                      <motion.path d={area} fill="url(#perfGrad)" opacity={drawn ? 0.3 : 0} initial={false} animate={{ opacity: drawn ? 0.3 : 0 }} transition={{ duration: 1.4 }} />
                      <defs>
                        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a8a8a8" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#a8a8a8" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <motion.path d={line} fill="none" stroke="#a8a8a8" strokeWidth="1.6" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: drawn ? 1 : 0 }} transition={{ duration: 1.6, ease: "easeInOut" }} />
                      {pts.map(([x, y], i) => (
                        <motion.circle key={i} cx={x} cy={y} r="2.4" fill="#c0c0c0"
                          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: drawn ? 1 : 0, scale: drawn ? 1 : 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + i * 0.12 }} />
                      ))}
                      {MONTHS.map((m, i) => (
                        <text key={m} x={xs(i)} y={h - 6} textAnchor="middle" fill="rgba(110,110,110,0.6)" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>{m}</text>
                      ))}
                      {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
                        <text key={i} x={pl - 5} y={ys(v) + 3} textAnchor="end" fill="rgba(110,110,110,0.5)" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(v)}</text>
                      ))}
                    </svg>
                    <div className="pointer-events-none absolute right-2 top-2 rounded border border-[#9a9a9a]/15 bg-black/60 px-2 py-1 text-[0.62rem] text-[#c0c0c0]" style={{ fontFamily: "var(--font-mono)" }}>
                      {ar ? "الحالي" : "Current"}: +{growth}%
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[0.7rem] text-[#4a4a4a]">
                  {ar ? "منحنى تصاعدي ثابت عبر الأشهر الثمانية — يعكس نمواً سنوياً +31%" : "Steady upward curve across eight months — reflects +31% annual growth."}
                </p>
              </div>

              <div className="space-y-3">
                <MiniStat label={ar ? "أعلى نقطة" : "Highest Point"} value="+27%" />
                <MiniStat label={ar ? "الانطلاق" : "Start"} value="+4%" />
                <MiniStat label={ar ? "مشاريع نشطة" : "Active Projects"} value={String(data.projects.length)} />
                <MiniStat label={ar ? "رسائل غير مقروءة" : "Unread Messages"} value={String(unread)} />
                <div className="rounded-md border border-[#9a9a9a]/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[0.7rem] text-[#8b8577]">
                    <Activity size={13} /> {ar ? "أحداث تشغيلية" : "Operational Events"}
                  </div>
                  <div className="space-y-2 text-[0.72rem] text-[#8a8a8a]">
                    <div className="flex justify-between"><span>{ar ? "تحديث أرشيف" : "Archive update"}</span><span className="mono text-[#4a4a4a]">02:14</span></div>
                    <div className="flex justify-between"><span>{ar ? "إغلاق مشروع" : "Project closed"}</span><span className="mono text-[#4a4a4a]">09:40</span></div>
                    <div className="flex justify-between"><span>{ar ? "جلسة مشفّرة" : "Encrypted session"}</span><span className="mono text-[#4a4a4a]">11:02</span></div>
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
              <div className="eyebrow mb-4" style={{ color: "#9a9a9a" }}>{ar ? "نظرة سريعة" : "Quick Glance"}</div>
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
              <div className="eyebrow mb-3" style={{ color: "#9a9a9a" }}>{ar ? "الساعات العالمية" : "World Clocks"}</div>
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
    <div className={`rounded-lg border border-[#9a9a9a]/[0.10] bg-[#0a0a0a] ${className ?? ""}`}>{children}</div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[0.62rem] tracking-[0.14em] text-[#4a4a4a]" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
      <span className={`text-[0.82rem] text-[#b0b0b0] ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#9a9a9a]/[0.10] bg-black/20 px-4 py-3">
      <span className="text-[0.7rem] text-[#8b8577]">{label}</span>
      <span className="text-[0.92rem] text-[#e8e8e8]" style={{ fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}

function QuickRow({ icon: Icon, label, value, onClick }: { icon: typeof Users; label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-md border border-[#9a9a9a]/[0.08] bg-black/20 p-3 text-right transition hover:border-[#9a9a9a]/25 hover:bg-[#9a9a9a]/[0.03]">
      <Icon size={15} className="text-[#6a6a6a]" />
      <span className="flex-1 text-[0.8rem] text-[#8a8a8a]">{label}</span>
      <span className="mono text-[0.78rem] text-[#e8e8e8]">{value}</span>
    </button>
  );
}
