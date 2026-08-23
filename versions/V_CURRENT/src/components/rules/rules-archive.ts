/* ============================================================
   rules-archive.ts — المحتوى المعرفي لأرشيف القواعد
   Bilingual knowledge branches for the interactive Rules archive.
   Every branch is one node discovered by the user inside the
   knowledge network. Content is canonical to OWNERS OF IMPACT.
   ============================================================ */

export type Branch = {
  id: string;
  en: { title: string; intro: string; detail: string; related: string[] };
  ar: { title: string; intro: string; detail: string; related: string[] };
};

export const BRANCHES: Branch[] = [
  {
    id: "rules",
    en: {
      title: "Club Rules",
      intro: "The covenant that frames membership since its founding.",
      detail:
        "Every rule in the archive descends from a single principle: the club is a covenant carried, not a privilege granted. Rules are not constraints imposed from above — they are the language the circle uses to protect what it builds. Read them as architecture, not as law.",
      related: ["owners", "conduct"],
    },
    ar: {
      title: "قواعد النادي",
      intro: "العهد الذي يؤطّر العضوية منذ التأسيس.",
      detail:
        "كل قاعدة في هذا الأرشيف تنحدر من مبدأ واحد: النادي عهدٌ يُحمل، لا امتيازٌ يُمنح. القواعد ليست قيوداً مفروضة من الأعلى، بل هي اللغة التي تحمي بها الدائرة ما تبنيه. اقرأها كمعمار، لا كقانون.",
      related: ["owners", "conduct"],
    },
  },
  {
    id: "owners",
    en: {
      title: "Who Are the Owners of Impact",
      intro: "The people behind the circle — builders of enduring effect.",
      detail:
        "Owners of Impact is not a gathering of names but a convergence of individuals who measure their lives by what remains after them. Members are selected for the quality of their intent, the discipline of their action, and the silence of their ambition.",
      related: ["vision", "membership"],
    },
    ar: {
      title: "من هم أصحاب الأثر",
      intro: "الناس خلف الدائرة — بُناتُ أثرٍ يمتد.",
      detail:
        "أصحاب الأثر ليسوا تجمّع أسماء، بل التقاء أشخاص يقيسون حياتهم بما يبقى بعدهم. يُنتقى الأعضاء على جودة النية، وانضباط الفعل، وصمت الطموح.",
      related: ["vision", "membership"],
    },
  },
  {
    id: "vision",
    en: {
      title: "Vision",
      intro: "A horizon carried quietly across generations.",
      detail:
        "The vision is not a slogan displayed on walls; it is the direction the circle keeps when everything else shifts. It speaks of building what endures, acting without noise, and leaving the world slightly more ordered than it was found.",
      related: ["mission", "promotion"],
    },
    ar: {
      title: "الرؤية",
      intro: "أفقٌ يُحمل بصمت عبر الأجيال.",
      detail:
        "الرؤية ليست شعاراً على الجدران؛ بل الاتجاه الذي تحافظ عليه الدائرة حين يتغيّر كل شيء. تتحدث عن بناء ما يدوم، والعمل دون ضجيج، وترك العالم أكثر نظاماً قليلاً مما وُجد عليه.",
      related: ["mission", "promotion"],
    },
  },
  {
    id: "mission",
    en: {
      title: "Mission",
      intro: "What the circle does, quietly and precisely.",
      detail:
        "The mission translates vision into action: curating projects, safeguarding capital, developing members, and preserving a covenant of trust. Every initiative within the circle must serve at least one of these four duties or it does not enter the archive.",
      related: ["projects", "responsibility"],
    },
    ar: {
      title: "الرسالة",
      intro: "ما تفعله الدائرة، بهدوء ودقة.",
      detail:
        "الرسالة تحوّل الرؤية إلى فعل: رعاية المشاريع، وحماية رأس المال، وتطوير الأعضاء، وصون عهد الثقة. كل مبادرة داخل الدائرة يجب أن تخدم واحداً من هذه الواجبات الأربعة وإلا لم تدخل الأرشيف.",
      related: ["projects", "responsibility"],
    },
  },
  {
    id: "membership",
    en: {
      title: "Membership",
      intro: "Entry is by covenant, not coincidence.",
      detail:
        "Membership is earned through a standard of impact, carried through conduct, and renewed through continued alignment with the covenant. It is never inherited, never purchased, and never reduced to a title. It is a standing, held and proven.",
      related: ["promotion", "conduct"],
    },
    ar: {
      title: "العضوية",
      intro: "الدخول بالعهد، لا بالمصادفة.",
      detail:
        "العضوية تُكتسب بمعيار الأثر، وتُحمل بالسلوك، وتتجدد باستمرار الانسجام مع العهد. لا تُورّث، ولا تُشترى، ولا تنحصر في لقب. إنها منزلة تُحمل وتُثبَت.",
      related: ["promotion", "conduct"],
    },
  },
  {
    id: "conduct",
    en: {
      title: "Code of Conduct",
      intro: "The discipline that keeps trust unbroken.",
      detail:
        "Conduct is the visible shape of the covenant. A member's word is their bond, their silence is absolute, and their dealings are governed by precision and fairness. Confidence given is confidence kept; respect shown is respect returned.",
      related: ["forbidden", "security"],
    },
    ar: {
      title: "مدونة السلوك",
      intro: "الانضباط الذي يحفظ الثقة من الكسر.",
      detail:
        "السلوك هو الشكل المرئي للعهد. كلمة العضو هي عهده، وصمته مطلق، وتعاملاته مضبوطة بالدقة والإنصاف. ما يُؤتمن عليه يُحفظ، وما يُقدَّم من احترام يُردّ بمثله.",
      related: ["forbidden", "security"],
    },
  },
  {
    id: "forbidden",
    en: {
      title: "Forbidden Actions",
      intro: "What the circle refuses, without exception.",
      detail:
        "The forbidden is defined with the same care as the permitted. Betraying confidence, misusing capital, breaking a promise, exploiting the circle's name, and acting for self at the expense of the covenant — each is a fracture that the structure cannot tolerate.",
      related: ["conduct", "security"],
    },
    ar: {
      title: "الممنوعات",
      intro: "ما ترفضه الدائرة، بلا استثناء.",
      detail:
        "يُعرَّف الممنوع بنفس العناية التي يُعرَّف بها المباح. خيانة الأمانة، وإساءة استخدام رأس المال، وكسر الوعد، واستغلال اسم الدائرة، والتصرف للذات على حساب العهد — كل ذلك كسرٌ لا تحتمله البنية.",
      related: ["conduct", "security"],
    },
  },
  {
    id: "privileges",
    en: {
      title: "Privileges",
      intro: "Access that follows rank, never precedes it.",
      detail:
        "Privileges are the doors that open as a member ascends — access to records, to projects, to the inner chambers of decision. They are not gifts but responsibilities with a second name: every privilege carries a proportionate obligation.",
      related: ["promotion", "responsibility"],
    },
    ar: {
      title: "الامتيازات",
      intro: "وصول يتبع المرتبة، ولا يسبقها أبداً.",
      detail:
        "الامتيازات هي الأبواب التي تُفتح مع صعود العضو — الوصول إلى السجلات والمشاريع وغرف القرار الداخلية. ليست هدايا بل مسؤوليات باسمٍ ثانٍ: كل امتياز يحمل التزاماً متناسباً.",
      related: ["promotion", "responsibility"],
    },
  },
  {
    id: "responsibility",
    en: {
      title: "Responsibilities",
      intro: "The other half of every privilege.",
      detail:
        "Responsibility is how the circle stays trustworthy. To safeguard what is shared, to act in the interest of the whole, to document every decision and to protect the silence that was entrusted — this is the burden carried by every member who holds the covenant.",
      related: ["privileges", "security"],
    },
    ar: {
      title: "المسؤوليات",
      intro: "النصف الآخر من كل امتياز.",
      detail:
        "المسؤولية هي الطريقة التي تبقى بها الدائرة جديرة بالثقة. صون المشترك، والعمل لمصلحة الكل، وتوثيق كل قرار، وحماية الصمت المؤتمن عليه — هذا هو الحمل الذي يحمله كل عضو يحمل العهد.",
      related: ["privileges", "security"],
    },
  },
  {
    id: "promotion",
    en: {
      title: "Promotion System",
      intro: "Ascension measured by impact, not by time.",
      detail:
        "A member rises through the nine ranks by demonstrating documented impact, earned trust and proven discipline. Promotion is deliberated, never requested. It is the circle's recognition of a life, not a ladder climbed by ambition alone.",
      related: ["privileges", "vision"],
    },
    ar: {
      title: "نظام الترقية",
      intro: "الصعود يُقاس بالأثر، لا بالزمن.",
      detail:
        "يصعد العضو عبر المراتب التسع بإثبات أثر موثّق، وثقة مكتسبة، وانضباط مجرَّب. الترقية تُقرَّر، ولا تُطلب أبداً. إنها اعتراف الدائرة بمسار، لا سُلّم يصعده الطموح وحده.",
      related: ["privileges", "vision"],
    },
  },
  {
    id: "projects",
    en: {
      title: "Projects",
      intro: "The archive's living proof of intent.",
      detail:
        "Projects are how the circle turns the covenant outward. Each one must carry the club's identity, protect its silence, and serve its members or its vision. Every project is a test of the values it claims to advance.",
      related: ["mission", "responsibility"],
    },
    ar: {
      title: "المشاريع",
      intro: "الدليل الحي لنية الأرشيف.",
      detail:
        "المشاريع هي الطريقة التي يحوّل بها النادي العهد إلى الخارج. كل مشروع يجب أن يحمل هوية النادي، ويصون صمته، ويخدم أعضاءه أو رؤيته. كل مشروع اختبار للقيم التي يدّعي النهوض بها.",
      related: ["mission", "responsibility"],
    },
  },
  {
    id: "security",
    en: {
      title: "Security Principles",
      intro: "The silence that protects everything else.",
      detail:
        "Security is the covenant's final layer. What is spoken in the circle stays in the circle; what is recorded is guarded; what is known is held by those permitted to know it. Discretion is not secrecy for its own sake — it is the respect owed to the trust of others.",
      related: ["conduct", "forbidden"],
    },
    ar: {
      title: "مبادئ الأمن",
      intro: "الصمت الذي يحمي كل شيء آخر.",
      detail:
        "الأمن هو الطبقة الأخيرة من العهد. ما يُقال داخل الدائرة يبقى داخلها، وما يُسجَّل يُحرس، وما يُعلَم يحمله من أُذن له. التحفّظ ليس سرّاً لذاته، بل احترامٌ للثقة المؤتمن عليها.",
      related: ["conduct", "forbidden"],
    },
  },
];

export const BRANCH_IDS = BRANCHES.map((b) => b.id);

/** Adjacency used both for "related topics" and for highlighting the final structure. */
export function relatedOf(id: string): string[] {
  const b = BRANCHES.find((x) => x.id === id);
  return b ? b.en.related : [];
}
