"use client";

import Manifesto from "@/components/manifesto/Manifesto";
import { useApp } from "@/lib/store";

export default function GoalsSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const branches = ar
    ? [
        { id: "innovation", label: "الابتكار", subtitle: "بناء ما لم يكن يُتخيّل.", detail: "الابتكار داخل الدائرة ليس تجريباً عابراً بل بناءٌ مدروس لما يدوم. فرصةٌ جديدة تُقاس بقدرتها على الصمود لا بحجم ضجيجها.", related: ["projects"] },
        { id: "knowledge", label: "المعرفة", subtitle: "حِكمةٌ تُخزَّن وتُنقل.", detail: "المعرفة أصلٌ يتضاعف بالمشاركة. تُوثَّق الخبرات وتُنقل بين الأعضاء لتُبنى عليه الأجيال القادمة من الدائرة.", related: ["growth"] },
        { id: "influence", label: "النفوذ", subtitle: "حضورٌ هادئ في القرار.", detail: "الهدف أن يتقاطع الأثر مع القرار حيث ينبغي، ببناء حضور هادئ وموثوق يفتح أبواباً كانت موصدة.", related: ["network"] },
        { id: "vision", label: "الرؤية الطويلة", subtitle: "اتجاهٌ يحفظه الزمن.", detail: "كل قرار يُوازن بمداه البعيد. الرؤية الطويلة تعني أن الأثر الذي نزرعه اليوم سيحصد أثره بعد عقود.", related: ["legacy"] },
        { id: "network", label: "الشبكة الخاصة", subtitle: "علاقاتٌ نادرة الجودة.", detail: "بناء شبكة مغلقة من علاقات موثّقة عالية الجودة — حيث يلتقي رأس المال بالفرصة والانضباط في دائرة واحدة.", related: ["community"] },
        { id: "projects", label: "المشاريع الاستراتيجية", subtitle: "أثرٌ قابلٌ للتوريث.", detail: "إطلاق مشاريع استراتيجية تصمد وتُورَّث، تحمل هوية النادي وتخدم أعضاءه ورؤيته معاً.", related: ["innovation"] },
        { id: "growth", label: "النمو الشخصي", subtitle: "تطويرٌ مستمرٌّ للعضو.", detail: "النادي ينمو بنموّ أعضائه. الاستثمار في تطوير كل عضو جزءٌ من العهد: مهارةٌ، وانضباطٌ، ورؤيةٌ أوضح.", related: ["knowledge"] },
        { id: "community", label: "المجتمع", subtitle: "تماسكٌ يحفظ الدائرة.", detail: "المجتمع الداخلي هو نسيج الثقة الذي يحمل كل شيء. علاقات متماسكة تختبر بالزمن وتتصلب بالمحنة.", related: ["network"] },
        { id: "leadership", label: "القيادة", subtitle: "إعداد قادةٍ بالصمت.", detail: "تكوين قادة قادرين على حمل العهد وصيانته، يقودون بالأثر لا بالإعلان، ويقدّمون المصلحة المشتركة على صوتهم الخاص.", related: ["responsibility"] },
        { id: "legacy", label: "الإرث المستقبلي", subtitle: "ما يُسلم للأجيال القادمة.", detail: "الغاية النهائية: ترك أثرٍ مؤسسي موثّق يعيش بعد أعضائه، بنيةٌ من الثقة تُسلَّم كاملةً لمن يأتي بعد.", related: ["vision"] },
      ]
    : [
        { id: "innovation", label: "Innovation", subtitle: "Building what was never imagined.", detail: "Innovation within the circle is not passing experimentation but deliberate construction of what endures. A new opportunity is measured by its capacity to last, not by the volume of its noise.", related: ["projects"] },
        { id: "knowledge", label: "Knowledge", subtitle: "Wisdom stored and passed on.", detail: "Knowledge is an asset that multiplies by sharing. Expertise is documented and passed between members so the circle's coming generations build upon it.", related: ["growth"] },
        { id: "influence", label: "Influence", subtitle: "A quiet presence in decision.", detail: "The aim is for impact to intersect decision where it matters — a quiet, trusted presence that opens doors once sealed.", related: ["network"] },
        { id: "vision", label: "Long-Term Vision", subtitle: "A direction the years preserve.", detail: "Every decision is weighed by its far reach. Long-term vision means the impact we plant today will be reaped decades from now.", related: ["legacy"] },
        { id: "network", label: "Private Network", subtitle: "Relationships of rare quality.", detail: "Building a closed network of documented, high-quality relationships — where capital meets opportunity and discipline within a single circle.", related: ["community"] },
        { id: "projects", label: "Strategic Projects", subtitle: "Impact built to be inherited.", detail: "Launching strategic projects that endure and are inherited, carrying the circle's identity and serving its members and vision together.", related: ["innovation"] },
        { id: "growth", label: "Personal Growth", subtitle: "Continuous development of the member.", detail: "The club grows as its members grow. Investing in each member's development is part of the covenant: a skill, a discipline, a clearer vision.", related: ["knowledge"] },
        { id: "community", label: "Community", subtitle: "A cohesion that keeps the circle.", detail: "The internal community is the fabric of trust that carries everything — resilient relationships tested by time and hardened by challenge.", related: ["network"] },
        { id: "leadership", label: "Leadership", subtitle: "Preparing leaders in silence.", detail: "Forming leaders able to carry and keep the covenant, leading by impact rather than announcement, placing the common interest above their own voice.", related: ["responsibility"] },
        { id: "legacy", label: "Future Legacy", subtitle: "What is handed to the generations to come.", detail: "The ultimate aim: leaving a documented institutional impact that outlives its members — an architecture of trust handed intact to those who follow.", related: ["vision"] },
      ];

  return (
    <Manifesto
      eyebrow={ar ? "الأثر · الأهداف" : "IMPACT · OBJECTIVES"}
      title={ar ? "أهداف أصحاب الأثر" : "OBJECTIVES OF OWNERS OF IMPACT"}
      centerLabel={ar ? "غايتنا" : "OUR PURPOSE"}
      centerNote={ar ? "أثرٌ يصمد ويُورَّث" : "IMPACT THAT ENDURES AND IS INHERITED"}
      branches={branches}
      ar={ar}
    />
  );
}
