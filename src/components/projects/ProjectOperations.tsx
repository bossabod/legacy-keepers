"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Users, MailOpen, Layers, ArrowUpRight, Eye, EyeOff, TrendingUp, Activity,
} from "lucide-react";
import { Reveal, Pulse } from "@/components/ui";
import { WorldClock } from "@/components/brand";
import GlobalCommandGlobe from "@/components/GlobalCommandGlobe";
import ProjectsDashboard from "@/components/projects/ProjectsDashboard";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";
import type { SectionKey } from "@/components/Dashboard";

/* Transferred as-is from Home — globe, operational dashboard, glance, clocks. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const SERIES = [4, 6, 5, 9, 8, 14, 20, 27, 31];

export default function ProjectOperations({
  data,
  onNavigate,
  onOpenTrack,
}: {
  data: AppData;
  onNavigate?: (k: SectionKey | string) => void;
  onOpenTrack: (track: "digital" | "physical") => void;
}) {
  const me = data.members[0];
  const unread = data.messages.filter((m) => !m.read).length;
  const [nameVisible, setNameVisible] = useState(false);
  const { lang } = useApp();
  const ar = lang === "ar";
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 600); return () => clearTimeout(t); }, []);

  const completedProjects = useMemo(() => data.projects.filter((p) => /مكتم|Completed|complete/i.test(p.status || "")).length, [data.projects]);
  void completedProjects;

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
    <div className="mx-auto max-w-7xl space-y-12">
      <Reveal>
        <div
          className="relative overflow-hidden min-h-[560px] lg:min-h-[640px]"
          style={{ background: "radial-gradient(120% 90% at 50% 30%, #0c0a07 0%, #060604 62%, #030202 100%)", boxShadow: "inset 0 0 160px 40px rgba(216,180,120,0.05)" }}
        >
          <GlobalCommandGlobe className="absolute inset-0 w-full h-full z-0" />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-7 pt-6 sm:px-9">
            <span className="text-[0.72rem] tracking-[0.26em] uppercase text-[#8a7044]" style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
              {ar ? "شبكة القيادة العالمية" : "Global Command Network"}
            </span>
            <span className="mono text-[0.66rem] text-[#c8a76b]/80 bg-black/40 px-3 py-1 rounded-full border border-[#c8a76b]/15">{me.code}</span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-6 px-7 pb-6 sm:px-9">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-light tracking-tight text-[#ece9e0] sm:text-4xl" style={{ fontFamily: "var(--font-luxury)", textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}>
                  {nameVisible ? me.name : "****************"}
                </h1>
                <button
                  onClick={() => { setNameVisible(!nameVisible); play("click"); }}
                  onMouseEnter={() => play("hover")}
                  className="shrink-0 rounded-md p-2 text-[#8a7044] transition-all duration-300 hover:text-[#e8c992] border border-transparent hover:border-[#c8a76b]/20"
                  aria-label="Toggle name visibility"
                >
                  {nameVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#a39d8e]" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}>{me.bio}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.68rem]" style={{ border: "1px solid rgba(216,180,120,0.3)", background: "rgba(8,7,5,0.55)", color: "#e8c992" }}>
                  <span className="h-1.5 w-1.5 rotate-45 bg-[#c8a76b]" /> {ar ? "الرتبة" : "Rank"}: {me.rank}
                </span>
                <span className="text-[0.68rem] text-[#a39d8e]" style={{ background: "rgba(8,7,5,0.55)", padding: "2px 10px", borderRadius: 999, border: "1px solid rgba(216,180,120,0.1)" }}>{me.role}</span>
                <span className="flex items-center gap-1.5 text-[0.68rem] text-[#8b8577]" style={{ background: "rgba(8,7,5,0.55)", padding: "2px 10px", borderRadius: 999, border: "1px solid rgba(216,180,120,0.1)" }}>
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

      <Reveal delay={0.05}>
        <Panel className="p-6 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="eyebrow" style={{ color: "#c8a76b" }}>{ar ? "لوحة الأداء التشغيلي" : "Operational Performance"}</div>
              <h3 className="mt-1 text-lg font-light text-[#ece9e0]" style={{ fontFamily: "var(--font-luxury)" }}>
                {ar ? "الأداء السنوي الحالي" : "Current Yearly Performance"}
              </h3>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#c8a76b]/15 bg-black/20 px-4 py-2">
              <TrendingUp size={15} className="text-[#8a7044]" />
              <span className="text-2xl font-medium text-[#e8c992]" style={{ fontFamily: "var(--font-mono)" }}>+{growth}%</span>
              <span className="flex items-center gap-1 text-[0.7rem] text-[#8b8577]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8a76b]" style={{ boxShadow: "0 0 6px #c8a76b" }} />
                {ar ? "نمو" : "Growth"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-md border border-[#c8a76b]/10 bg-black/20 p-4">
                <div className="relative w-full">
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
                    {[0.25, 0.5, 0.75].map((f) => (
                      <line key={f} x1={pl} x2={w - pr} y1={pt + f * (h - pt - pb)} y2={pt + f * (h - pt - pb)} stroke="rgba(216,180,120,0.05)" strokeWidth="1" />
                    ))}
                    <motion.path d={area} fill="url(#perfGradOps)" opacity={drawn ? 0.3 : 0} initial={false} animate={{ opacity: drawn ? 0.3 : 0 }} transition={{ duration: 1.4 }} />
                    <defs>
                      <linearGradient id="perfGradOps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d8b478" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#d8b478" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path d={line} fill="none" stroke="#d8b478" strokeWidth="1.6" strokeLinecap="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: drawn ? 1 : 0 }} transition={{ duration: 1.6, ease: "easeInOut" }} />
                    {pts.map(([x, y], i) => (
                      <motion.circle key={i} cx={x} cy={y} r="2.4" fill="#e8c992"
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
                  <div className="pointer-events-none absolute right-2 top-2 rounded border border-[#c8a76b]/15 bg-black/60 px-2 py-1 text-[0.62rem] text-[#e8c992]" style={{ fontFamily: "var(--font-mono)" }}>
                    {ar ? "الحالي" : "Current"}: +{growth}%
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[0.7rem] text-[#57534a]">
                {ar ? "منحنى تصاعدي ثابت عبر الأشهر الثمانية — يعكس نمواً سنوياً +31%" : "Steady upward curve across eight months — reflects +31% annual growth."}
              </p>
            </div>

            <div className="space-y-3">
              <MiniStat label={ar ? "أعلى نقطة" : "Highest Point"} value="+27%" />
              <MiniStat label={ar ? "الانطلاق" : "Start"} value="+4%" />
              <MiniStat label={ar ? "حالة المشاريع" : "Project Status"} value={`${completedProjects}/${data.projects.length}`} />
              <MiniStat label={ar ? "الإنفاق التقديري" : "Estimated Spend"} value={`${data.investments.length * 12}k`} />
              <MiniStat label={ar ? "مشاريع نشطة" : "Active Projects"} value={String(data.projects.length)} />
              <MiniStat label={ar ? "رسائل غير مقروءة" : "Unread Messages"} value={String(unread)} />
              <div className="rounded-md border border-[#c8a76b]/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-[0.7rem] text-[#8b8577]">
                  <Activity size={13} /> {ar ? "أحداث تشغيلية" : "Operational Events"}
                </div>
                <div className="space-y-2 text-[0.72rem] text-[#a39d8e]">
                  <div className="flex justify-between"><span>{ar ? "تحديث أرشيف" : "Archive update"}</span><span className="mono text-[#57534a]">02:14</span></div>
                  <div className="flex justify-between"><span>{ar ? "إغلاق مشروع" : "Project closed"}</span><span className="mono text-[#57534a]">09:40</span></div>
                  <div className="flex justify-between"><span>{ar ? "جلسة مشفّرة" : "Encrypted session"}</span><span className="mono text-[#57534a]">11:02</span></div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </Reveal>

      <div className="grid gap-7 lg:grid-cols-3">
        <Reveal delay={0.1} className="lg:col-span-2">
          <Panel className="h-full p-6">
            <div className="eyebrow mb-4" style={{ color: "#c8a76b" }}>{ar ? "نظرة سريعة" : "Quick Glance"}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickRow icon={Users} label={ar ? "إجمالي الأعضاء" : "Total members"} value={`${data.members.length}`} onClick={() => onNavigate?.("members")} />
              <QuickRow icon={MailOpen} label={ar ? "رسائل غير مقروءة" : "Unread messages"} value={`${unread}`} onClick={() => onNavigate?.("messages")} />
              <QuickRow icon={Layers} label={ar ? "مشاريع نشطة" : "Active projects"} value={`${data.projects.length}`} onClick={() => onNavigate?.("projects")} />
              <QuickRow icon={ArrowUpRight} label={ar ? "أصول استثمارية" : "Investment assets"} value={`${data.investments.length}`} onClick={() => onNavigate?.("investments")} />
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.15}>
          <Panel className="h-full p-6">
            <div className="eyebrow mb-3" style={{ color: "#c8a76b" }}>{ar ? "الساعات العالمية" : "World Clocks"}</div>
            <WorldClock />
            <div className="divider my-5" />
            <div className="flex items-center gap-2 text-[0.72rem] text-[#8b8577]">
              <Pulse /> {ar ? "النظام يعمل ضمن القناة المشفّرة" : "System running on encrypted channel"}
            </div>
          </Panel>
        </Reveal>
      </div>

      <ProjectsDashboard data={data} onOpenTrack={onOpenTrack} />
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#c8a76b]/[0.10] bg-[#0a0a08] ${className ?? ""}`}>{children}</div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[0.62rem] tracking-[0.14em] text-[#57534a]" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
      <span className={`text-[0.82rem] text-[#cdc8b9] ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-[#c8a76b]/[0.10] bg-black/20 px-4 py-3">
      <span className="text-[0.7rem] text-[#8b8577]">{label}</span>
      <span className="text-[0.92rem] text-[#ece9e0]" style={{ fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}

function QuickRow({ icon: Icon, label, value, onClick }: { icon: typeof Users; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-md border border-[#c8a76b]/[0.08] bg-black/20 p-3 text-right transition hover:border-[#c8a76b]/25 hover:bg-[#c8a76b]/[0.03]">
      <Icon size={15} className="text-[#8a7044]" />
      <span className="flex-1 text-[0.8rem] text-[#a39d8e]">{label}</span>
      <span className="mono text-[0.78rem] text-[#ece9e0]">{value}</span>
    </button>
  );
}
