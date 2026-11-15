"use client";
import { useState } from "react";
import { FileText } from "lucide-react";
import { Panel, SectionHeading, Reveal, Modal } from "@/components/ui";
import { useApp } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { play } from "@/lib/sound";
import type { AppData, Invoice } from "@/lib/types";

export default function InvoicesSection({ data }: { data: AppData }) {
  const { currency } = useApp();
  const [selected, setSelected] = useState<Invoice | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading
        eyebrow="المال · الفواتير"
        title="الوثائق الرسمية"
        desc="فواتير ومستندات مالية معتمدة. الحالات: مسدّدة أو معلّقة."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.invoices.map((inv, i) => {
          const paid = inv.status === "مسدّدة";
          return (
            <Reveal key={inv.id} delay={(i % 6) * 0.04}>
              <button
                onMouseEnter={() => play("hover")}
                onClick={() => { setSelected(inv); play("open"); }}
                className="glass group flex h-full w-full flex-col rounded-xl p-5 text-right transition hover:border-white/20"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ border: "1px solid rgba(195,201,211,0.14)", background: "rgba(195,201,211,0.05)" }}
                  >
                    <FileText size={16} className="text-[#aeb6c2]" />
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[0.62rem]"
                    style={{
                      border: `1px solid ${paid ? "rgba(174,182,194,0.3)" : "rgba(127,136,150,0.3)"}`,
                      color: paid ? "#c3c9d3" : "#7f8896",
                      background: paid ? "rgba(174,182,194,0.08)" : "rgba(127,136,150,0.08)",
                    }}
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="mt-3 text-[0.88rem] text-[#eaeef5]">{inv.title}</div>
                <div className="mt-1 mono text-[0.64rem] text-[#565d68]">{inv.category} · {inv.date}</div>
                <div className="mono mt-4 text-lg font-semibold text-[#eaeef5]">
                  {formatMoney(inv.amountChf, currency)}
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="تفاصيل الفاتورة">
        {selected && (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-[#eaeef5]">{selected.title}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                <div className="eyebrow text-[0.5rem]">المبلغ</div>
                <div className="mono mt-2 text-lg font-semibold text-[#eaeef5]">{formatMoney(selected.amountChf, currency)}</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                <div className="eyebrow text-[0.5rem]">الحالة</div>
                <div className="mt-2 text-base text-[#aeb6c2]">{selected.status}</div>
              </div>
            </div>
            <div className="mono text-[0.7rem] text-[#7f8896]">
              التصنيف: {selected.category} — التاريخ: {selected.date}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
