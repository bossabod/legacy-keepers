"use client";
import { Panel, SectionHeading, Reveal } from "@/components/ui";

const RULES = [
  "العضوية عهدٌ يُحمَل، لا امتيازٌ يُمنح.",
  "ما يُقال داخل الدائرة يبقى داخل الدائرة.",
  "كل قرارٍ يُوثّق، وكل خطوةٍ تُسجّل.",
  "لا وعدَ إلا ما يُنفَّذ، ولا عهدَ إلا ما يُصان.",
  "الأثر يُقاس بالصمود، لا بالضجيج.",
  "العلاقات تُبنى بالثقة وتُختبر بالزمن.",
  "رأس المال أمانةٌ تُدار بانضباط.",
  "السرية حقٌّ للجميع وواجبٌ على الجميع.",
  "الباب لا يُفتح إلا لمن اجتاز معيار الأثر.",
  "من خانه العهد، خانته الدائرة.",
];

export default function RulesSection() {
  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeading
        eyebrow="الأثر · القواعد"
        title="ميثاق القواعد"
        desc="عشر قواعد تؤطّر العضوية وتحفظ العهد منذ التأسيس."
      />
      <Reveal>
        <Panel className="p-6 sm:p-8">
          <div className="space-y-0">
            {RULES.map((r, i) => (
              <div key={i}>
                <div className="flex items-start gap-4 py-3.5">
                  <span className="mono mt-0.5 shrink-0 text-[0.72rem] text-[#565d68]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.9rem] leading-relaxed text-[#c3c9d3]">{r}</span>
                </div>
                {i < RULES.length - 1 && <div className="divider" />}
              </div>
            ))}
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}
