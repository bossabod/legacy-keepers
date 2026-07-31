"use client";
import { Panel, SectionHeading, Reveal } from "@/components/ui";
import { Logo } from "@/components/brand";

const PILLARS = [
  { label: "التأسيس", value: "٢٠١٢" },
  { label: "الطبيعة", value: "مغلق نخبوي" },
  { label: "المدى", value: "أثر ممتد" },
  { label: "المنهج", value: "الانضباط" },
];

export default function IdentitySection() {
  return (
    <div className="mx-auto max-w-4xl">
      <SectionHeading eyebrow="الأثر · الهوية" title="وثيقة الهوية · رسمية" />

      <Reveal>
        <Panel className="relative overflow-hidden p-8 sm:p-10">
          <div
            className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(174,182,194,0.18), transparent 70%)" }}
          />
          <div className="relative flex items-center gap-4">
            <div style={{ filter: "drop-shadow(0 0 14px rgba(174,182,194,0.5))" }}>
              <Logo size={42} />
            </div>
            <div className="eyebrow">وثيقة معتمدة · مجلس الميثاق</div>
          </div>

          <h2 className="etched mt-6 text-3xl font-bold text-[#eaeef5] sm:text-4xl">
            من هم أصحاب الأثر؟
          </h2>

          <div className="mt-6 space-y-4 text-[0.94rem] leading-loose text-[#b9c0cc]">
            <p>
              أصحاب الأثر ليسوا جمعًا عابرًا، بل دائرة مغلوبة على أمرها بالنّدرة. يجمعهم هاجسٌ واحد:
              أن يتركوا في العالم أثرًا أعمق من ضجيجهم. هنا لا تُقاس الأسماء بحجمها، بل بثقل ما تتركه خلفها.
            </p>
            <p>
              منذ عام ٢٠١٢، والنادي يصون عتبته: لا يُفتح الباب إلا لمن اجتاز معيار الأثر، ولا يُغلق في وجه من
              وفّى بعهده. العضوية ليست امتيازًا يُمنح، بل عهدٌ يُحمَل.
            </p>
            <p>
              داخل الدائرة، يلتقي رأس المال بالعلاقة، والفرصة بالانضباط، في شبكةٍ موثّقة لا تُرى إلا لأهلها.
              كل قرارٍ يُختم، وكل خطوةٍ تُسجّل، وكل أثرٍ يُحفظ للأجيال القادمة من الأعضاء.
            </p>
          </div>

          <div className="divider my-8" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.label} className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                <div className="text-base font-semibold text-[#eaeef5]">{p.value}</div>
                <div className="eyebrow mt-1 text-[0.5rem]">{p.label}</div>
              </div>
            ))}
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}
