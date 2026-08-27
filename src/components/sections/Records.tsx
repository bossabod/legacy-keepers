"use client";
import { ScrollText, Lock } from "lucide-react";
import { Panel, SectionHeading, Reveal } from "@/components/ui";
import type { AppData } from "@/lib/types";

const ACTION_COLOR: Record<string, string> = {
  "دخول": "#aeb6c2",
  "فتح": "#b0b0b0",
  "تحديث": "#7f8896",
  "معاينة": "#7f8896",
  "إنشاء": "#eaeef5",
  "تحويل": "#565d68",
};

export default function LogSection({ data }: { data: AppData }) {
  return (
    <div className="mx-auto max-w-4xl">
      <SectionHeading
        eyebrow="النظام · السجل"
        title="طبقة المراقبة الداخلية"
        desc="سجلّ موثّق لكل فعل يقع داخل النظام. كل سطر مختوم بالمُنفّذ والقسم والزمن."
      />

      <Reveal>
        <Panel className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ border: "1px solid rgba(176,176,176,0.2)" }}
            >
              <ScrollText size={17} className="text-[#aeb6c2]" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#eaeef5]">سجلّ النشاط الحيّ</div>
              <div className="mono text-[0.64rem] text-[#565d68]">{data.log.length} إدخال · موثّق</div>
            </div>
          </div>

          <div className="space-y-0">
            {data.log.map((e, i) => (
              <div key={e.id}>
                <div className="flex items-start gap-3 py-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: ACTION_COLOR[e.action] ?? "#7f8896" }}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[0.84rem] text-[#eaeef5]">{e.action}</span>
                      <span className="text-[0.74rem] text-[#7f8896]">— {e.detail}</span>
                    </div>
                    <div className="mono mt-0.5 text-[0.64rem] text-[#565d68]">
                      {e.section} · {e.actor} · {e.time}
                    </div>
                  </div>
                </div>
                {i < data.log.length - 1 && <div className="divider" />}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/5 bg-black/20 p-4">
            <Lock size={15} className="text-[#7f8896]" />
            <span className="text-[0.78rem] text-[#7f8896]">
              توجد طبقات أعمق من السجل محمية بصلاحيات أعلى، لا تُعرض ضمن هذه النافذة.
            </span>
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}
