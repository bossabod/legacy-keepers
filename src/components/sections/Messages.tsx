"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Panel, SectionHeading, Reveal, Pulse } from "@/components/ui";
import { play } from "@/lib/sound";
import type { AppData, Message } from "@/lib/types";

export default function MessagesSection({ data }: { data: AppData }) {
  const [active, setActive] = useState<Message | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(
    new Set(data.messages.filter((m) => m.read).map((m) => m.id))
  );

  const open = (m: Message) => {
    setActive(m);
    setReadIds((s) => new Set(s).add(m.id));
    play("open");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading
        eyebrow="المجتمع · الرسائل"
        title="صندوق الوارد"
        desc="مراسلات رسمية داخل الدائرة. غير المقروء موسوم بشريط فضي."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* القائمة */}
        <Reveal>
          <Panel className="overflow-hidden p-2">
            <div className="space-y-1">
              {data.messages.map((m) => {
                const unread = !readIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    onMouseEnter={() => play("hover")}
                    onClick={() => open(m)}
                    className="relative flex w-full items-start gap-3 rounded-xl p-3 text-right transition hover:bg-white/[0.04]"
                    style={{ background: active?.id === m.id ? "rgba(195,201,211,0.06)" : "transparent" }}
                  >
                    {unread && (
                      <span
                        className="absolute right-0 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-full"
                        style={{ background: "#c3c9d3", boxShadow: "0 0 8px #aeb6c2" }}
                      />
                    )}
                    <div
                      className="mono flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.6rem] text-[#aeb6c2]"
                      style={{ border: "1px solid rgba(195,201,211,0.16)" }}
                    >
                      <Mail size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[0.84rem] ${unread ? "font-medium text-[#eaeef5]" : "text-[#aeb6c2]"}`}>
                        {m.subject}
                      </div>
                      <div className="truncate text-[0.7rem] text-[#7f8896]">{m.sender}</div>
                    </div>
                    <span className="mono shrink-0 text-[0.58rem] text-[#565d68]">{m.date}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </Reveal>

        {/* غلاف القراءة */}
        <Reveal delay={0.08}>
          <Panel className="min-h-[300px] p-6">
            {active ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.62rem] text-[#aeb6c2]">{active.category}</span>
                  <span className="mono text-[0.62rem] text-[#565d68]">{active.date}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#eaeef5]">{active.subject}</h3>
                <div className="mt-1 text-[0.78rem] text-[#7f8896]">من: {active.sender}</div>
                <div className="divider my-5" />
                <p className="text-[0.9rem] leading-loose text-[#c3c9d3]">{active.body}</p>
              </motion.div>
            ) : (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-center">
                <Mail size={28} className="text-[#3a4049]" />
                <span className="text-[0.84rem] text-[#7f8896]">اختر رسالة لعرضها</span>
                <div className="flex items-center gap-2 text-[0.68rem] text-[#565d68]">
                  <Pulse /> {data.messages.length - readIds.size} غير مقروء
                </div>
              </div>
            )}
          </Panel>
        </Reveal>
      </div>
    </div>
  );
}
