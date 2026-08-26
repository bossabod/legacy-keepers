"use client";
import { useState } from "react";
import { Eye, Lock, ShieldQuestion, Search } from "lucide-react";
import { Panel, SectionHeading, Reveal, Modal } from "@/components/ui";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData, Member } from "@/lib/types";

export default function MembersSection({ data }: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [tab, setTab] = useState<"visible" | "secret">("visible");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);

  const visible = data.members.filter((m) => m.visible);
  const secret = data.members.filter((m) => !m.visible);

  const list = (tab === "visible" ? visible : secret).filter((m) =>
    q.trim() === ""
      ? true
      : m.name.includes(q) || m.rank.includes(q) || m.country.includes(q)
  );

  return (
    <div className="mx-auto max-w-6xl" dir={ar ? "rtl" : "ltr"}>
      <SectionHeading
        eyebrow={ar ? "المجتمع · الأعضاء" : "Community · Members"}
        title={ar ? "دليل الدائرة المغلقة" : "The Closed Circle Directory"}
        desc={ar
          ? "٧٧ عضوًا يتوزّعون على الرتب التسع. قسمٌ منهم معروضٌ للعامة داخل النظام، والآخر سريّ لا يُكشف إلا بصلاحية."
          : "77 members distributed across the nine ranks. Some are visible within the system; the rest are confidential and revealed only with clearance."}
      />

      {/* التبويبات + البحث */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 p-0.5">
          <button
            onClick={() => { setTab("visible"); play("click"); }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[0.78rem] transition ${
              tab === "visible" ? "bg-white/10 text-[#eaeef5]" : "text-[#565d68]"
            }`}
          >
            <Eye size={14} /> {ar ? `متاح للعرض (${visible.length})` : `Visible (${visible.length})`}
          </button>
          <button
            onClick={() => { setTab("secret"); play("click"); }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[0.78rem] transition ${
              tab === "secret" ? "bg-white/10 text-[#eaeef5]" : "text-[#565d68]"
            }`}
          >
            <Lock size={14} /> {ar ? `سري (${secret.length})` : `Secret (${secret.length})`}
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565d68]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "ابحث بالاسم أو الرتبة…" : "Search by name or rank…"}
            className="field w-64 pr-9 text-[0.8rem]"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <Panel className="p-10 text-center text-sm text-[#7f8896]">{ar ? "لا نتائج مطابقة." : "No matching results."}</Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m, i) => (
            <Reveal key={m.id} delay={(i % 9) * 0.03}>
              <button
                onMouseEnter={() => play("hover")}
                onClick={() => {
                  if (m.visible) { setSelected(m); play("open"); }
                  else { play("reject"); setSelected(m); }
                }}
                className="glass group flex h-full w-full items-center gap-3 rounded-xl p-4 text-right transition hover:border-white/15"
              >
                <div
                  className="mono flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[0.72rem] text-[#b0b0b0]"
                  style={{ border: "1px solid rgba(176,176,176,0.18)" }}
                >
                  {m.visible ? m.initials : <Lock size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.86rem] text-[#eaeef5]">
                    {m.visible ? m.name : (ar ? "عضو سري" : "Secret Member")}
                  </div>
                  <div className="mt-0.5 truncate text-[0.7rem] text-[#7f8896]">
                    {m.rank} · {m.visible ? m.city : m.country}
                  </div>
                  <div className="mono mt-1 text-[0.62rem] text-[#565d68]">{m.code}</div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      )}

      {/* ملف العضو */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={ar ? "ملف العضو" : "Member Record"}>
        {selected && (
          selected.visible ? (
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="mono flex h-14 w-14 items-center justify-center rounded-full text-base text-[#b0b0b0]"
                  style={{ border: "1px solid rgba(176,176,176,0.2)" }}
                >
                  {selected.initials}
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#eaeef5]">{selected.name}</div>
                  <div className="mono text-[0.66rem] text-[#565d68]">{selected.code}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.72rem] text-[#b0b0b0]">
                  {ar ? `الرتبة: ${selected.rank}` : `Rank: ${selected.rank}`}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[0.72rem] text-[#aeb6c2]">
                  {selected.role}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[0.72rem] text-[#aeb6c2]">
                  {selected.city} · {selected.country}
                </span>
              </div>
              <p className="mt-4 text-sm leading-loose text-[#9aa3b2]">{selected.bio}</p>
              <div className="divider my-4" />
              <div className="grid grid-cols-2 gap-3 text-[0.78rem]">
                <Info label={ar ? "الإنجازات" : "Achievements"} value={ar ? "أثر ممتد في القرارات التشغيلية" : "Enduring impact in operational decisions"} />
                <Info label={ar ? "صلته بالنادي" : "Role in the Circle"} value={selected.role} />
                <Info label={ar ? "مشاريعه" : "Projects"} value={ar ? "مرتبط بـ ٤ مشاريع" : "Linked to 4 projects"} />
                <Info label={ar ? "عضو منذ" : "Member Since"} value={`${selected.memberSince}`} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <ShieldQuestion size={42} className="text-[#aeb6c2]" />
              <div>
                <div className="text-base font-semibold text-[#eaeef5]">
                  {ar ? "ملف محدود الوصول" : "Restricted Record"}
                </div>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#7f8896]">
                  {ar
                    ? `هذا الملف سريّ ولا يُفتح إلا بصلاحية خاصة من مجلس الميثاق. الرتبة: ${selected.rank} — ${selected.country}.`
                    : `This record is confidential and opens only with special clearance from the Covenant Council. Rank: ${selected.rank} — ${selected.country}.`}
                </p>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <div className="eyebrow text-[0.5rem]">{label}</div>
      <div className="mt-1 text-[0.82rem] text-[#aeb6c2]">{value}</div>
    </div>
  );
}
