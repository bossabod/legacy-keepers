"use client";
import { Panel, SectionHeading, Reveal } from "@/components/ui";

const GOALS = [
  { n: "01", t: "الأثر", d: "أن يبقى الأثر بعد صاحبه، راسخًا وموثّقًا." },
  { n: "02", t: "العلاقات", d: "حياكة شبكة علاقات نادرة الجودة والموثوقية." },
  { n: "03", t: "المال", d: "إدارة رأس المال بانضباط وحِنكة وحفظ." },
  { n: "04", t: "النفوذ", d: "بناء حضور هادئ ذي أثر حقيقي في القرار." },
  { n: "05", t: "المشاريع", d: "إطلاق مشاريع تصمد وتُورَّث." },
  { n: "06", t: "الشراكة", d: "دمج القوى في شراكات متينة وعادلة." },
  { n: "07", t: "الاستثمار", d: "استثمارٌ مدروس يحمي وينمو معًا." },
  { n: "08", t: "الامتداد", d: "توسيع الأثر عبر الأجيال والحدود." },
];

export default function GoalsSection() {
  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading
        eyebrow="الأثر · الأهداف"
        title="أركان النادي"
        desc="ثمانية أهداف تجمعها رؤية واحدة: الأثر الذي يصمد."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GOALS.map((g, i) => (
          <Reveal key={g.n} delay={(i % 4) * 0.05}>
            <Panel className="h-full p-5">
              <div className="mono text-[0.7rem] text-[#565d68]">{g.n}</div>
              <div className="mt-2 text-lg font-semibold text-[#eaeef5]">{g.t}</div>
              <p className="mt-2 text-[0.8rem] leading-relaxed text-[#7f8896]">{g.d}</p>
            </Panel>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
