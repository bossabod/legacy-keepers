"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  MapPin,
  ArrowUpRight,
  MailOpen,
  Users,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react";
import { Panel, Stat, Reveal, Pulse } from "@/components/ui";
import { WorldClock, Logo } from "@/components/brand";
import GlobalCommandGlobe from "@/components/GlobalCommandGlobe";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";
import type { SectionKey } from "@/components/Dashboard";

const VERTICAL_NAV: { key: SectionKey; label: string }[] = [
  { key: "rules", label: "Rules" },
  { key: "goals", label: "Objectives" },
  { key: "identity", label: "Who Are the People of Impact" },
];

const TASKS = [
  { label: "مراجعة طلب علاقة جديد", section: "network", when: "اليوم", prio: "عالية" },
  { label: "اعتماد فاتورة معلّقة", section: "invoices", when: "غدًا", prio: "متوسطة" },
  { label: "متابعة مشروع برج الزمرّد", section: "projects", when: "هذا الأسبوع", prio: "عالية" },
  { label: "معاينة ملف سري في الأرشيف", section: "archive", when: "هذا الأسبوع", prio: "منخفضة" },
];

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

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* ===== لوحة الهوية ومركز القيادة العالمي ===== */}
      <Reveal>
        <Panel className="relative overflow-hidden p-7 sm:p-9 min-h-[560px] lg:min-h-[600px] flex flex-col justify-end border-[#c3c9d3]/20 shadow-[0_30px_70px_rgba(0,0,0,0.85)]">
          {/* محرك قيادة العمليات العالمية 3D (الأرض، خطوط الاتصال الحمراء، وساعات المدن الحية) */}
          <GlobalCommandGlobe className="absolute inset-0 w-full h-full z-0" />

          {/* تدرج داكن عميق لضمان وضوح نصوص العضو أمام الكرة الأرضية بنسبة 100% */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#050608] via-[#050608]/94 via-[#050608]/55 to-transparent z-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/80 to-transparent lg:hidden z-0" />

          {/* ===== التنقل العمودي المتميز على اليمين بجانب الكرة ===== */}
          <div className="absolute right-8 top-[20%] z-20 hidden xl:flex flex-col gap-8 pointer-events-auto">
            {VERTICAL_NAV.map((item) => {
              return (
                <button
                  key={item.key}
                  onClick={() => { onNavigate(item.key); play("open"); }}
                  onMouseEnter={() => play("hover")}
                  className="group relative text-right"
                >
                  <span
                    className="text-[1.1rem] tracking-[0.14em] transition-all duration-300 text-[#7f8896] group-hover:text-[#eaeef5]"
                    style={{ fontFamily: "var(--font-luxury)", fontWeight: 700 }}
                  >
                    {item.label}
                  </span>
                  <span className="absolute -bottom-2 right-0 h-[2px] w-0 bg-gradient-to-l from-[#eaeef5] via-[#c3c9d3] to-transparent transition-all duration-300 group-hover:w-full" style={{ boxShadow: "0 0 6px rgba(195,201,211,0.4)" }} />
                </button>
              );
            })}
          </div>

          <div className="relative z-10 lg:w-[60%] lg:ml-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.78rem] tracking-[0.2em] uppercase text-[#8b95a5]" style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}>
                Owners of Impact Live Network
              </span>
              <span className="mono text-[0.72rem] text-[#c3c9d3] bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.1]">{me.code}</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <h1 className="etched text-4xl font-bold tracking-tight text-[#eaeef5] sm:text-5xl">
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.74rem] font-medium"
                style={{ border: "1px solid rgba(195,201,211,0.4)", background: "rgba(195,201,211,0.1)", color: "#eaeef5" }}
              >
                <span className="h-2 w-2 rotate-45 bg-[#ef4444] shadow-[0_0_8px_#ef4444]" />
                الرتبة: {me.rank}
              </span>
              <span className="text-[0.78rem] text-[#aeb6c2] bg-black/40 px-3 py-1.5 rounded-full border border-white/5">{me.role}</span>
              <span className="flex items-center gap-1.5 text-[0.74rem] text-[#8b95a5] bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                <MapPin size={13} className="text-[#ef4444]" /> {me.city} · {me.country}
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-loose text-[#aeb6c2]">{me.bio}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="الرتبة" value={me.rank} />
              <Stat label="رقم العضوية" value={me.code} mono />
              <Stat label="عضو منذ" value={me.memberSince} mono />
              <Stat label="مشاريع مرتبطة" value={data.projects.length} mono />
            </div>
          </div>
        </Panel>
      </Reveal>

      <div className="grid gap-7 lg:grid-cols-3">
        {/* المهام */}
        <Reveal delay={0.05} className="lg:col-span-2">
          <Panel className="h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="eyebrow">المهام المتاحة</div>
                <h3 className="mt-1 text-lg font-semibold text-[#eaeef5]">قائمة الانتظار</h3>
              </div>
              <span className="mono rounded-full border border-white/10 px-2.5 py-1 text-[0.66rem] text-[#aeb6c2]">
                {TASKS.length} مفتوحة
              </span>
            </div>
            <div className="space-y-2">
              {TASKS.map((t, i) => (
                <button
                  key={i}
                  onMouseEnter={() => {}}
                  onClick={() => onNavigate(t.section as SectionKey)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-3.5 text-right transition hover:border-white/15 hover:bg-white/[0.04]"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background:
                        t.prio === "عالية" ? "#c3c9d3" : t.prio === "متوسطة" ? "#7f8896" : "#3a4049",
                    }}
                  />
                  <span className="flex-1">
                    <span className="block text-[0.86rem] text-[#eaeef5]">{t.label}</span>
                    <span className="mono mt-0.5 block text-[0.62rem] text-[#565d68]">
                      {t.section} · {t.when}
                    </span>
                  </span>
                  <span className="rounded border border-white/5 px-2 py-0.5 text-[0.6rem] text-[#7f8896]">
                    {t.prio}
                  </span>
                  <ChevronLeft
                    size={15}
                    className="text-[#565d68] transition group-hover:-translate-x-1 group-hover:text-[#c3c9d3]"
                  />
                </button>
              ))}
            </div>
          </Panel>
        </Reveal>

        {/* نظرة سريعة */}
        <Reveal delay={0.1}>
          <Panel className="h-full p-6">
            <div className="eyebrow mb-4">نظرة سريعة</div>
            <div className="space-y-3">
              <QuickRow icon={Users} label="إجمالي الأعضاء" value={`${data.members.length} عضوًا`} onClick={() => onNavigate("members")} />
              <QuickRow icon={MailOpen} label="رسائل غير مقروءة" value={`${unread}`} onClick={() => onNavigate("messages")} />
              <QuickRow icon={Layers} label="مشاريع نشطة" value={`${data.projects.length}`} onClick={() => onNavigate("projects")} />
              <QuickRow icon={ArrowUpRight} label="أصول استثمارية" value={`${data.investments.length}`} onClick={() => onNavigate("investments")} />
            </div>
            <div className="divider my-5" />
            <div className="eyebrow mb-3">الساعات العالمية</div>
            <WorldClock />
            <div className="divider my-5" />
            <div className="flex items-center gap-2 text-[0.72rem] text-[#7f8896]">
              <Pulse /> النظام يعمل ضمن القناة المشفّرة
            </div>
          </Panel>
        </Reveal>
      </div>

      {/* المشاريع المرتبطة */}
      <Reveal delay={0.12}>
        <Panel className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Logo size={18} />
            <h3 className="text-lg font-semibold text-[#eaeef5]">المشاريع المرتبطة</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.projects.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate("projects")}
                className="group rounded-xl border border-white/5 bg-black/20 p-4 text-right transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="text-[0.82rem] text-[#eaeef5]">{p.title}</div>
                <div className="mono mt-2 text-[0.66rem] text-[#7f8896]">{p.status}</div>
              </button>
            ))}
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}

function QuickRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg p-2 text-right transition hover:bg-white/[0.04]"
    >
      <Icon size={15} className="text-[#7f8896]" />
      <span className="flex-1 text-[0.8rem] text-[#aeb6c2]">{label}</span>
      <span className="mono text-[0.78rem] text-[#eaeef5]">{value}</span>
    </button>
  );
}
