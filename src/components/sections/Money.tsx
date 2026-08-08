"use client";
import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Panel, SectionHeading, Reveal, Modal } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { play } from "@/lib/sound";
import type { AppData, Investment } from "@/lib/types";

export default function InvestmentsSection({ data }: { data: AppData }) {
  const { lang, currency } = useApp();
  const ar = lang === "ar";
  const [scope, setScope] = useState<"personal" | "club">("personal");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Investment | null>(null);

  const scoped = data.investments.filter((x) => x.scope === scope);
  const types = ["all", ...Array.from(new Set(scoped.map((x) => x.type)))];
  const list = filter === "all" ? scoped : scoped.filter((x) => x.type === filter);

  const current = scoped.reduce((s, x) => s + x.valueChf, 0);
  const avgChange = scoped.length
    ? scoped.reduce((s, x) => s + x.change, 0) / scoped.length
    : 0;

  return (
    <div className="mx-auto max-w-6xl" dir={ar ? "rtl" : "ltr"}>
      <SectionHeading
        eyebrow={ar ? "الأعمال · الاستثمارات" : "Business · Investments"}
        title={ar ? "المحفظة" : "Portfolio"}
        desc={ar ? "أصولك الشخصية وأصول النادي. القيم محسوبة بالفرنك وقابلة للتحويل الفوري." : "Your personal and club assets. Values are in Swiss francs and instantly convertible."}
      />

      {/* تبديل النطاق + ملخّص */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[auto_1fr]">
        <Panel className="flex items-center gap-1 p-1">
          {(["personal", "club"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setScope(s); setFilter("all"); play("click"); }}
              className={`rounded-lg px-4 py-2 text-[0.78rem] transition ${
                scope === s ? "bg-white/10 text-[#eaeef5]" : "text-[#565d68]"
              }`}
            >
              {s === "personal" ? (ar ? "شخصية" : "Personal") : (ar ? "النادي" : "Club")}
            </button>
          ))}
        </Panel>

        <div className="grid grid-cols-3 gap-3">
          <Summary label={ar ? "القيمة الحالية" : "Current Value"} value={formatMoney(current, currency)} />
          <Summary label={ar ? "عدد الأصول" : "Assets"} value={`${scoped.length}`} />
          <Summary
            label={ar ? "متوسط التغيّر" : "Avg. Change"}
            value={`${avgChange > 0 ? "+" : ""}${avgChange.toFixed(1)}%`}
            up={avgChange >= 0}
          />
        </div>
      </div>

      {/* فلاتر */}
      <div className="mb-4 flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => { setFilter(t); play("click"); }}
            className={`rounded-full border px-3 py-1 text-[0.72rem] transition ${
              filter === t
                ? "border-white/30 bg-white/10 text-[#eaeef5]"
                : "border-white/10 text-[#7f8896] hover:text-[#aeb6c2]"
            }`}
          >
            {t === "all" ? (ar ? "الكل" : "All") : t}
          </button>
        ))}
      </div>

      {/* بطاقات الأصول */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((inv, i) => {
          const up = inv.change >= 0;
          return (
            <Reveal key={inv.id} delay={(i % 6) * 0.04}>
              <button
                onMouseEnter={() => play("hover")}
                onClick={() => { setSelected(inv); play("open"); }}
                className="glass group flex h-full w-full flex-col rounded-xl p-5 text-right transition hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <span className="mono text-[0.6rem] text-[#565d68]">{inv.type} · {inv.status}</span>
                  <span
                    className={`flex items-center gap-1 text-[0.72rem] ${up ? "text-[#c3c9d3]" : "text-[#7f8896]"}`}
                  >
                    {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {up ? "+" : ""}{inv.change}%
                  </span>
                </div>
                <div className="mt-3 text-[0.9rem] text-[#eaeef5]">{inv.title}</div>
                <div className="mono mt-3 text-lg font-semibold text-[#eaeef5]">
                  {formatMoney(inv.valueChf, currency)}
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={ar ? "تفاصيل الأصل" : "Asset Details"}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selected.change >= 0 ? (
                <TrendingUp size={18} className="text-[#c3c9d3]" />
              ) : (
                <TrendingDown size={18} className="text-[#7f8896]" />
              )}
              <span className="text-lg font-semibold text-[#eaeef5]">{selected.title}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Summary label={ar ? "القيمة الحالية" : "Current Value"} value={formatMoney(selected.valueChf, currency)} />
              <Summary label={ar ? "التغيّر" : "Change"} value={`${selected.change > 0 ? "+" : ""}${selected.change}%`} up={selected.change >= 0} />
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-3 text-[0.78rem] text-[#aeb6c2]">
              {ar ? "النوع" : "Type"}: {selected.type} — {ar ? "الحالة" : "Status"}: {selected.status} — {ar ? "النطاق" : "Scope"}: {selected.scope === "personal" ? (ar ? "شخصي" : "Personal") : (ar ? "النادي" : "Club")}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Summary({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <div className="eyebrow text-[0.5rem]">{label}</div>
      <div className={`mono mt-2 text-lg font-semibold ${up === undefined ? "text-[#eaeef5]" : up ? "text-[#c3c9d3]" : "text-[#7f8896]"}`}>
        {value}
      </div>
    </div>
  );
}
