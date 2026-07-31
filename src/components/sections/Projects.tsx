"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft, TrendingUp, Shield, Users, Clock, Activity } from "lucide-react";
import { Panel, SectionHeading, Reveal, Modal } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { play } from "@/lib/sound";
import type { AppData, Project } from "@/lib/types";

interface EnhancedProject extends Project {
  category: string;
  priority: string;
  estimatedReturn: string;
  riskLevel: string;
  requiredMembers: number;
  investmentWindow: string;
}

const CATEGORIES = [
  "Strategic Investments",
  "Business Expansion",
  "Global Partnerships",
  "Private Acquisitions",
  "Joint Ventures",
  "Real Estate",
  "Technology",
  "International Operations",
];

export default function ProjectsSection({ data }: { data: AppData }) {
  const { currency } = useApp();
  const [selected, setSelected] = useState<EnhancedProject | null>(null);

  // Enhance projects with premium fields
  const enhanced: EnhancedProject[] = data.projects.map((p, i) => ({
    ...p,
    category: CATEGORIES[i % CATEGORIES.length],
    priority: ["Critical", "High", "High", "Medium", "Critical", "High", "Medium", "Medium"][i % 8],
    estimatedReturn: `${8 + (i * 3) % 18}%`,
    riskLevel: ["Low", "Moderate", "Low", "Elevated", "Low", "Moderate", "Low", "Moderate"][i % 8],
    requiredMembers: Math.floor(p.partnership / 10) + 1,
    investmentWindow: ["Q2 2026", "Q3 2026", "Immediate", "Q4 2026", "Q1 2027", "Q2 2026", "Immediate", "Q3 2026"][i % 8],
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <SectionHeading
        eyebrow="Opportunity Gateway"
        title="Operational Opportunities"
        desc="Strategic opportunities vetted by the inner circle. Each entry represents a pathway to measurable impact."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {enhanced.map((p, i) => (
          <Reveal key={p.id} delay={(i % 6) * 0.05}>
            <button
              onMouseEnter={() => play("hover")}
              onClick={() => { setSelected(p); play("open"); }}
              className="group flex h-full w-full flex-col rounded-2xl border border-[#c3c9d3]/12 bg-gradient-to-b from-[#0e1118]/90 to-[#06080c] p-6 text-left transition-all duration-400 hover:border-[#c3c9d3]/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
            >
              {/* Category + Priority */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[#565d68]" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                  {p.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.58rem] uppercase tracking-wide border ${
                    p.priority === "Critical"
                      ? "border-[#c3c9d3]/30 text-[#eaeef5] bg-[#c3c9d3]/8"
                      : "border-white/8 text-[#8b95a5]"
                  }`}
                >
                  {p.priority}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-[#eaeef5] mb-2" style={{ fontFamily: "var(--font-luxury)" }}>
                {p.title}
              </h3>

              <div className="flex items-center gap-1.5 text-[0.72rem] text-[#7f8896] mb-4">
                <MapPin size={12} /> {p.location}
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Metric icon={TrendingUp} label="Est. Return" value={p.estimatedReturn} />
                <Metric icon={Shield} label="Risk" value={p.riskLevel} />
                <Metric icon={Users} label="Members" value={`${p.requiredMembers}`} />
                <Metric icon={Clock} label="Window" value={p.investmentWindow} />
              </div>

              {/* Value */}
              <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-4">
                <span className="mono text-[0.7rem] text-[#565d68]">VALUATION</span>
                <span className="mono text-lg font-semibold text-[#eaeef5]">{formatMoney(p.valueChf, currency)}</span>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.category}>
        {selected && (
          <div className="space-y-5">
            <div>
              <h3 className="text-2xl font-semibold text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>{selected.title}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-[#7f8896]"><MapPin size={13} /> {selected.location}</div>
            </div>

            <p className="text-sm leading-relaxed text-[#aeb6c2]">{selected.summary}</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Priority", selected.priority],
                ["Estimated Return", selected.estimatedReturn],
                ["Risk Level", selected.riskLevel],
                ["Required Members", `${selected.requiredMembers}`],
                ["Investment Window", selected.investmentWindow],
                ["Status", selected.status],
                ["Valuation", formatMoney(selected.valueChf, currency)],
                ["Partnership", `${selected.partnership}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <div className="text-[0.58rem] uppercase tracking-[0.15em] text-[#565d68]">{label}</div>
                  <div className="mt-1 text-sm text-[#aeb6c2]">{value}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { play("granted"); }}
              onMouseEnter={() => play("hover")}
              className="w-full rounded-xl border border-[#c3c9d3]/30 bg-gradient-to-b from-[#2a313d] to-[#0a0d13] py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#eaeef5] transition-all duration-300 hover:border-[#c3c9d3]/50 hover:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.6)]"
              style={{ fontFamily: "var(--font-luxury)" }}
            >
              Request Participation
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[#565d68] shrink-0" />
      <div>
        <div className="text-[0.56rem] uppercase tracking-wide text-[#565d68]">{label}</div>
        <div className="text-[0.78rem] text-[#aeb6c2]">{value}</div>
      </div>
    </div>
  );
}
