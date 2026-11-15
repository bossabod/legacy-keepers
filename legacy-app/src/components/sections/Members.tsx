"use client";
import { useState } from "react";
import { Eye, Lock, ShieldQuestion, Search } from "lucide-react";
import { Panel, SectionHeading, Reveal, Modal } from "@/components/ui";
import { play } from "@/lib/sound";
import type { AppData, Member } from "@/lib/types";

export default function MembersSection({ data }: { data: AppData }) {
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
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="المجتمع · الأعضاء"
        title="دليل الدائرة المغلقة"
        desc="٧٧ عضوًا يتوزّعون على الرتب التسع. قسمٌ منهم معروضٌ للعامة داخل النظام، والآخر سريّ لا يُكشف إلا بصلاحية."
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
            <Eye size={14} /> متاح للعرض ({visible.length})
          </button>
          <button
            onClick={() => { setTab("secret"); play("click"); }}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[0.78rem] transition ${
              tab === "secret" ? "bg-white/10 text-[#eaeef5]" : "text-[#565d68]"
            }`}
          >
            <Lock size={14} /> سري ({secret.length})
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565d68]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو الرتبة…"
            className="field w-64 pr-9 text-[0.8rem]"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <Panel className="p-10 text-center text-sm text-[#7f8896]">لا نتائج مطابقة.</Panel>
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
                  className="mono flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[0.72rem] text-[#c3c9d3]"
                  style={{ border: "1px solid rgba(195,201,211,0.18)" }}
                >
                  {m.visible ? m.initials : <Lock size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.86rem] text-[#eaeef5]">
                    {m.visible ? m.name : "عضو سري"}
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
      <Modal open={!!selected} onClose={() => setSelected(null)} title="ملف العضو">
        {selected && (
          selected.visible ? (
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="mono flex h-14 w-14 items-center justify-center rounded-full text-base text-[#c3c9d3]"
                  style={{ border: "1px solid rgba(195,201,211,0.2)" }}
                >
                  {selected.initials}
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#eaeef5]">{selected.name}</div>
                  <div className="mono text-[0.66rem] text-[#565d68]">{selected.code}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.72rem] text-[#c3c9d3]">
                  الرتبة: {selected.rank}
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
                <Info label="الإنجازات" value="أثر ممتد في القرارات التشغيلية" />
                <Info label="صلته بالنادي" value={selected.role} />
                <Info label="مشاريعه" value="مرتبط بـ ٤ مشاريع" />
                <Info label="عضو منذ" value={`${selected.memberSince}`} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <ShieldQuestion size={42} className="text-[#aeb6c2]" />
              <div>
                <div className="text-base font-semibold text-[#eaeef5]">ملف محدود الوصول</div>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#7f8896]">
                  هذا الملف سريّ ولا يُفتح إلا بصلاحية خاصة من مجلس الميثاق. الرتبة: {selected.rank} — {selected.country}.
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
