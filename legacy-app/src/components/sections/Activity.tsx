"use client";
import { SectionHeading, Reveal } from "@/components/ui";
import type { AppData } from "@/lib/types";

const ACTIVITY_TYPES = [
  { icon: "🔑", label: "Login", category: "System" },
  { icon: "📄", label: "Opened File", category: "Archive" },
  { icon: "💬", label: "Sent Message", category: "Messages" },
  { icon: "🏗", label: "Created Project", category: "Projects" },
  { icon: "🤝", label: "Joined Project", category: "Projects" },
  { icon: "📋", label: "Submitted Request", category: "Features" },
  { icon: "👤", label: "Viewed Member", category: "Members" },
  { icon: "📈", label: "Investment Updated", category: "Finance" },
  { icon: "📊", label: "Opened Reports", category: "System" },
  { icon: "🌍", label: "Language Changed", category: "System" },
  { icon: "🔒", label: "Entered Archive", category: "Archive" },
  { icon: "🚪", label: "Logout", category: "System" },
];

export default function ActivitySection({ data }: { data: AppData }) {
  // Combine DB log with synthetic activity entries
  const entries = [
    ...data.log.map((e) => ({
      time: e.time,
      member: e.actor,
      action: e.action,
      detail: e.detail,
      status: "Completed",
      category: e.section,
    })),
    ...ACTIVITY_TYPES.slice(0, 6).map((a, i) => ({
      time: `Before ${i + 2} hours`,
      member: ["Q-T-971", "A-K-528", "L-B-394", "S-Q-467"][i % 4],
      action: a.label,
      detail: `Action recorded in ${a.category.toLowerCase()} module`,
      status: i % 3 === 0 ? "Pending" : "Completed",
      category: a.category,
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading
        eyebrow="Internal Monitor"
        title="Activity Log"
        desc="Complete record of every action performed within the system."
      />

      <Reveal>
        <div className="rounded-2xl border border-[#c3c9d3]/15 bg-gradient-to-b from-[#0e1118]/90 to-[#06080c] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr] gap-3 px-5 py-3 border-b border-white/[0.06] text-[0.6rem] uppercase tracking-[0.15em] text-[#565d68]" style={{ fontFamily: "var(--font-ibm-mono)" }}>
            <span>Time</span>
            <span>Member</span>
            <span>Action</span>
            <span>Status</span>
            <span>Category</span>
          </div>

          {/* Entries */}
          <div className="divide-y divide-white/[0.04]">
            {entries.map((e, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr] gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors duration-200">
                <span className="text-[0.72rem] text-[#565d68]" style={{ fontFamily: "var(--font-ibm-mono)" }}>{e.time}</span>
                <span className="text-[0.76rem] text-[#aeb6c2]" style={{ fontFamily: "var(--font-ibm-mono)" }}>{e.member}</span>
                <span className="text-[0.76rem] text-[#eaeef5]">
                  <span className="text-[#7f8896]">{e.action}</span>
                  <span className="text-[#565d68]"> — {e.detail}</span>
                </span>
                <span className={`text-[0.68rem] ${e.status === "Completed" ? "text-[#aeb6c2]" : "text-[#c3c9d3]"}`}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full mr-1.5" style={{ background: e.status === "Completed" ? "#7f8896" : "#c3c9d3" }} />
                  {e.status}
                </span>
                <span className="text-[0.68rem] text-[#565d68]">{e.category}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
