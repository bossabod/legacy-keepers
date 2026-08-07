"use client";

import Manifesto from "@/components/manifesto/Manifesto";
import { useApp } from "@/lib/store";

export default function IdentitySection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const branches = ar
    ? [
        { id: "vision", label: "الرؤية", subtitle: "أثرٌ يمتد بعد صاحبه.", detail: "أصحاب الأثر لا يقيسون حياتهم بحجم حضورهم، بل بثقل ما يبقى بعدهم. الرؤية أن يُبنى ما يدوم، وأن يُقال الأثر في صمت، وأن تُترك الدنيا أكثر نظاماً قليلاً مما وُجدت عليه.", related: ["mission"] },
        { id: "identity", label: "الهوية", subtitle: "دائرة مغلقة، نادرة الانتماء.", detail: "الهوية ليست شعاراً بل انتماءً محروساً. النادي دائرة نخبوية مغلقة منذ عام ٢٠١٢، لا تُقاس بحدودها الجغرافية بل بمعيار من تدخل ومن لا يدخل.", related: ["membership"] },
        { id: "mission", label: "الرسالة", subtitle: "رعاية الأثر وصون العهد.", detail: "الرسالة تحوّل الرؤية إلى فعل: حماية رأس المال، ورعاية المشاريع، وتطوير الأعضاء، وصون عهد الثقة. كل خطوة داخل الدائرة تخدم واحدة من هذه الواجبات أو لا تتم.", related: ["vision"] },
        { id: "values", label: "القيم الجوهرية", subtitle: "النُدرة · الانضباط · السرية.", detail: "ثلاث قيم تحكم كل شيء: النُدرة في الاختيار، والانضباط في التنفيذ، والسرية في التعامل. من غادرها غادر الأثر نفسه.", related: ["behavior", "conduct"] },
        { id: "membership", label: "العضوية", subtitle: "عهدٌ يُحمَل، لا امتياز يُمنح.", detail: "العضوية تُكتسب بمعيار الأثر وتُحمل بالسلوك. لا تُورَّث ولا تُشترى ولا تُنقّص بلقب؛ إنها منزلة تُثبت كل يوم.", related: ["identity", "promotion"] },
        { id: "leadership", label: "القيادة", subtitle: "قيادةٌ بالصمت لا بالضجيج.", detail: "القيادة داخل الدائرة تُكتسب بالأثر الموثّق لا بالإعلان. القائد من يحمل العهد ويصونه، ويقدّم المصلحة المشتركة على صوته الخاص.", related: ["responsibility"] },
        { id: "legacy", label: "الإرث", subtitle: "ما يُحفظ للأجيال القادمة.", detail: "كل قرار يُختم وكل خطوة تُسجَّل وكل أثر يُحفظ. الإرث هو مجموع ما تُسلمه الدائرة للأعضاء القادمين: بنية موثّقة من الثقة.", related: ["future"] },
        { id: "influence", label: "النفوذ", subtitle: "حضورٌ هادئ في القرار.", detail: "النفوذ هنا لا يُعلن؛ يُبنى بالعلاقة والانضباط فيتقاطع مع القرار حيث ينبغي. حبكة شبكة نادرة الجودة تفتح أبواباً كانت موصدة.", related: ["leadership"] },
        { id: "responsibility", label: "المسؤولية", subtitle: "النصف الآخر من كل امتياز.", detail: "كل امتياز داخل الدائرة يحمل التزاماً متناسباً: صون المشترك، توثيق القرار، وحماية السرية المؤتمَنة.", related: ["values"] },
        { id: "future", label: "المستقبل", subtitle: "أفقٌ يُحمَل عبر الأجيال.", detail: "المستقبل ليس غاية بعيدة بل اتجاه يُحفظ الآن. كل أثر يُزرع اليوم هو أرضٌ يحصدها الأعضاء القادمون من أصحاب الأثر.", related: ["legacy"] },
      ]
    : [
        { id: "vision", label: "Vision", subtitle: "Impact that outlasts its author.", detail: "Owners of Impact measure their lives not by the size of their presence but by the weight of what remains after them. The vision is to build what endures, to speak through impact in silence, and to leave the world slightly more ordered than it was found.", related: ["mission"] },
        { id: "identity", label: "Identity", subtitle: "A closed circle, rare in belonging.", detail: "Identity is not a slogan but a guarded belonging. The circle is a closed, elite collective since 2012 — measured not by borders but by the standard of who enters and who does not.", related: ["membership"] },
        { id: "mission", label: "Mission", subtitle: "Caring for impact, keeping the covenant.", detail: "The mission turns vision into action: safeguarding capital, curating projects, developing members, and preserving a covenant of trust. Every step serves one of these duties or it does not happen.", related: ["vision"] },
        { id: "values", label: "Core Values", subtitle: "Rarity · Discipline · Secrecy.", detail: "Three values govern everything: rarity in selection, discipline in execution, and secrecy in dealing. To abandon them is to abandon impact itself.", related: ["behavior", "conduct"] },
        { id: "membership", label: "Membership", subtitle: "A covenant carried, not a privilege granted.", detail: "Membership is earned by a standard of impact and held through conduct. It is never inherited, never purchased, never reduced to a title — it is a standing proven every day.", related: ["identity", "promotion"] },
        { id: "leadership", label: "Leadership", subtitle: "Leading in silence, not in noise.", detail: "Leadership within the circle is earned through documented impact, never through announcement. The leader is one who carries and protects the covenant, placing the common interest above their own voice.", related: ["responsibility"] },
        { id: "legacy", label: "Legacy", subtitle: "What is kept for the generations to come.", detail: "Every decision is sealed, every step recorded, every impact preserved. Legacy is the sum the circle hands to future members: a documented architecture of trust.", related: ["future"] },
        { id: "influence", label: "Influence", subtitle: "A quiet presence in decision.", detail: "Influence here is never announced; it is built through relationship and discipline, intersecting decision where it matters. A rare-quality network opens doors once sealed.", related: ["leadership"] },
        { id: "responsibility", label: "Responsibility", subtitle: "The other half of every privilege.", detail: "Every privilege within the circle carries a proportionate obligation: safeguarding the shared, documenting decisions, and protecting entrusted secrecy.", related: ["values"] },
        { id: "future", label: "Future", subtitle: "A horizon carried across generations.", detail: "The future is not a distant goal but a direction kept now. Every impact planted today is ground reaped by the coming members of Owners of Impact.", related: ["legacy"] },
      ];

  return (
    <Manifesto
      eyebrow={ar ? "الأثر · من هم أصحاب الأثر" : "IMPACT · WHO WE ARE"}
      title={ar ? "من هم أصحاب الأثر" : "WHO ARE THE OWNERS OF IMPACT"}
      centerLabel={ar ? "الدائرة" : "THE CIRCLE"}
      centerNote={ar ? "منذ ٢٠١٢ · مغلق · نخبوي" : "EST. 2012 · CLOSED · ELITE"}
      branches={branches}
      ar={ar}
    />
  );
}
