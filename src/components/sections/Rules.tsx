"use client";

import Manifesto from "@/components/manifesto/Manifesto";
import { useApp } from "@/lib/store";

export default function RulesSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const branches = ar
    ? [
        { id: "confidentiality", label: "السرية", subtitle: "ما يُقال داخل الدائرة يبقى داخلها.", detail: "السرية حقٌّ للجميع وواجبٌ على الجميع. الصمت هو الطبقة الأخيرة من العهد؛ كل ما يُؤتمن عليه يُحفظ بلا استثناء.", related: ["security"] },
        { id: "respect", label: "الاحترام", subtitle: "ثقة تُبنى وتُختبر بالزمن.", detail: "الاحترام هو الشكل المرئي للعهد. ما يُقدَّم من احترام يُردّ بمثله، والعلاقات تُبنى بالثقة وتُختبر بالزمن.", related: ["behavior"] },
        { id: "communication", label: "التواصل", subtitle: "وضوحٌ دقيق داخل حدود السرية.", detail: "التواصل داخل الدائرة واضح وحاسم، لكنه يبقى مضبوطاً بحدود السرية. لا يُقال إلا ما يخدم العهد.", related: ["confidentiality"] },
        { id: "projects", label: "المشاريع", subtitle: "كل قرارٍ يُوثّق وكل خطوة تُسجّل.", detail: "المشاريع وجهٌ من وجوه العهد. كل مبادرة تحمل هوية النادي وتصون صمته وتُوثَّق بالكامل من البداية إلى التسليم.", related: ["security"] },
        { id: "security", label: "الأمن", subtitle: "صمتٌ يحمي كل شيء آخر.", detail: "الأمن ليس سرّاً لذاته؛ إنه احترام الثقة المؤتمَنة. ما يُسجَّل يُحرس، وما يُعلَم يحمله من أُذن له.", related: ["confidentiality", "digital"] },
        { id: "membership", label: "العضوية", subtitle: "عهدٌ يُحمَل لا امتيازٌ يُمنح.", detail: "العضوية تُكتسب بمعيار الأثر وتُحمل بالسلوك. الباب لا يُفتح إلا لمن اجتاز معيار الأثر ولا يُغلق في وجه من وفّى بعهده.", related: ["promotion"] },
        { id: "promotion", label: "الترقية", subtitle: "الصعود بالأثر لا بالوقت.", detail: "الترقية تُقرَّر ولا تُطلب أبداً. تصعد بالدليل الموثّق على الأثر والثقة والانضباط — اعترافٌ بمسارٍ لا سُلّمُ طموح.", related: ["membership"] },
        { id: "identity", label: "الهوية", subtitle: "حمل هوية النادي في كل فعل.", detail: "كل عضو يحمل هوية الدائرة أينما وُجد. الأفعال تُوزن بهويتها، فلا يُتحدث باسم النادي إلا بما يليق بأثره.", related: ["behavior"] },
        { id: "behavior", label: "السلوك", subtitle: "انضباطٌ يظهر في كل تعامل.", detail: "السلوك هو صورة العهد الظاهرة. الدقة في التعامل والوفاء بالوعد هما واجبٌ يومي لا استثناء فيه.", related: ["respect", "digital"] },
        { id: "digital", label: "السلوك الرقمي", subtitle: "الحذر نفسه في الفضاء الرقمي.", detail: "قواعد السرية والاحترام تمتد إلى كل وسيلة رقمية. الحسابات والمستندات محمية والمراسلات محجوبة عن كل من لا يملك صلاحية.", related: ["security"] },
      ]
    : [
        { id: "confidentiality", label: "Confidentiality", subtitle: "What is said in the circle stays in the circle.", detail: "Confidentiality is a right for all and a duty on all. Silence is the covenant's final layer; everything entrusted is kept, without exception.", related: ["security"] },
        { id: "respect", label: "Respect", subtitle: "Trust built and tested by time.", detail: "Respect is the visible shape of the covenant. Respect shown is respect returned, and relationships are built on trust and proven by time.", related: ["behavior"] },
        { id: "communication", label: "Communication", subtitle: "Precise clarity within the bounds of secrecy.", detail: "Communication within the circle is clear and decisive, yet held within the limits of confidentiality. Nothing is said that does not serve the covenant.", related: ["confidentiality"] },
        { id: "projects", label: "Projects", subtitle: "Every decision documented, every step recorded.", detail: "Projects are a face of the covenant. Every initiative carries the circle's identity, protects its silence, and is fully documented from initiation to delivery.", related: ["security"] },
        { id: "security", label: "Security", subtitle: "A silence that protects everything else.", detail: "Security is not secrecy for its own sake; it is respect for entrusted trust. What is recorded is guarded; what is known is held by those permitted to know it.", related: ["confidentiality", "digital"] },
        { id: "membership", label: "Membership", subtitle: "A covenant carried, not a privilege granted.", detail: "Membership is earned by a standard of impact and held through conduct. The door opens only for those who pass the standard and closes for none who keep their promise.", related: ["promotion"] },
        { id: "promotion", label: "Promotion", subtitle: "Ascension by impact, not by time.", detail: "Promotion is deliberated, never requested. One rises on documented evidence of impact, trust and discipline — recognition of a path, not a ladder of ambition.", related: ["membership"] },
        { id: "identity", label: "Identity", subtitle: "Carrying the circle's identity in every act.", detail: "Every member carries the circle's identity wherever they are. Actions are weighed by it; the circle's name is spoken only in a manner worthy of its impact.", related: ["behavior"] },
        { id: "behavior", label: "Behavior", subtitle: "Discipline made visible in every dealing.", detail: "Behavior is the covenant made visible. Precision in dealings and faithfulness to one's word are daily duties with no exception.", related: ["respect", "digital"] },
        { id: "digital", label: "Digital Conduct", subtitle: "The same caution in the digital space.", detail: "The rules of confidentiality and respect extend to every digital medium. Accounts and documents are protected; communications are withheld from all without clearance.", related: ["security"] },
      ];

  return (
    <Manifesto
      eyebrow={ar ? "الأثر · الميثاق" : "IMPACT · THE COVENANT"}
      title={ar ? "قواعد أصحاب الأثر" : "RULES OF OWNERS OF IMPACT"}
      centerLabel={ar ? "الميثاق" : "THE COVENANT"}
      centerNote={ar ? "انضباطٌ يحفظ الأثر" : "DISCIPLINE THAT KEEPS IMPACT"}
      branches={branches}
      ar={ar}
    />
  );
}
