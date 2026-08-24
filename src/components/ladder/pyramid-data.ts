export type TierCopy = {
  name: string;
  overview: string;
  description: string;
  requirements: string;
  access: string;
  privileges: string;
  status: string;
  membership: string;
};

export type Tier = {
  ar: TierCopy;
  en: TierCopy;
};

/* The names and ordinal sequence here are deliberately canonical, rather than
   database-driven, so the institutional hierarchy can never be reordered by data. */
export const LADDER: Tier[] = [
  {
    ar: {
      name: "الزائر",
      overview: "عتبة الدخول إلى الدائرة؛ حضورٌ مراقب ومساحة أولى لفهم لغة الأثر.",
      description: "الزائر هو أوّل درجات الاطّلاع داخل النادي. حضورٌ يُرصَد بصمت، وقدرة على قراءة الرموز قبل أن تُقال الكلمات. لا امتيازَ له بعد، لكن البابَ يُفتح على مهل لمن يُحسن الوقوف.",
      requirements: "دعوة موثّقة · تعريف بالميثاق",
      access: "OBSERVATION",
      privileges: "دخول القاعة · لا صوت ولا تصويت",
      status: "INITIALIZED",
      membership: "تُجدَّد ربعياً حسب تقدير الحارس.",
    },
    en: {
      name: "The Visitor",
      overview: "The threshold of the circle — a witnessed entry into the language of impact.",
      description: "The Visitor is the first degree of notice within the club — a presence observed in silence, granted the ability to read the symbols before a word is spoken. No privilege is yet theirs, yet the door opens slowly for those who know how to stand.",
      requirements: "Verified invitation · Covenant orientation",
      access: "OBSERVATION",
      privileges: "Entry to the hall · No voice, no vote",
      status: "INITIALIZED",
      membership: "Renewed quarterly at the keeper's discretion.",
    },
  },
  {
    ar: {
      name: "أفق التكوين",
      overview: "مرحلة بناء البصيرة؛ حيث تتحول النية إلى اتجاه يمكن قياسه.",
      description: "في أفق التكوين تُبنى الرؤية من شظايا الملاحظة. يتعلّم الحامل قراءة الإشارات وتوجيه الحضور نحو غاية واضحة. هنا لا يُكتب الأثر بعد، لكن تُرسَم خطوطُه الأولى.",
      requirements: "سجل حضور · إشارة موثوقة",
      access: "FORMATION",
      privileges: "الاطّلاع على المبادئ · حضور الجلسات التمهيدية",
      status: "IN FORMATION",
      membership: "مرحلة انتقالية؛ تُقيَّم فيها النية قبل الترقية.",
    },
    en: {
      name: "Horizon of Formation",
      overview: "A stage of building perspective, where intent becomes a measurable direction.",
      description: "Within the Horizon of Formation, vision is assembled from fragments of observation. The bearer learns to read the signals and to steer their presence toward a clear end. Impact is not yet written here — but its first lines are drawn.",
      requirements: "Attendance record · Trusted signal",
      access: "FORMATION",
      privileges: "Access to principles · Preliminary sessions",
      status: "IN FORMATION",
      membership: "A transitional stage; intent is weighed before elevation.",
    },
  },
  {
    ar: {
      name: "الحاجب",
      overview: "حارس العتبات؛ يميّز بين الإشارة العابرة والالتزام الذي يستحق المرور.",
      description: "الحاجب يملك مفاتيح العبور. عينُه تفرّق بين الصدى الزائل والحضور الجادّ، وبينَ يدِه تُوزَّع الدعوات النادرة. ليس حارساً فحسب، بل ميزانٌ تُعاير به جودة الدخول.",
      requirements: "تزكية داخلية · انضباط مثبت",
      access: "GATEKEEPER",
      privileges: "ترشيح الأعضاء · الاطلاع على السجلّ الأولي",
      status: "VERIFIED",
      membership: "ثابتة؛ تُحفظ بالإخلاص ويُؤمَّن بقيادته.",
    },
    en: {
      name: "The Chamberlain",
      overview: "Keeper of thresholds, distinguishing a passing signal from a commitment worth passage.",
      description: "The Chamberlain holds the keys of passage. Their eye separates the fleeting echo from the serious presence, and through their hand the rare invitations are distributed. More than a guard, they are the measure by which the quality of entry is weighed.",
      requirements: "Internal endorsement · Proven discipline",
      access: "GATEKEEPER",
      privileges: "Sponsoring members · Primary record access",
      status: "VERIFIED",
      membership: "Enduring; held by loyalty and secured by leadership.",
    },
  },
  {
    ar: {
      name: "كارينا",
      overview: "مدارٌ يجمع المسارات المتباعدة ويمنح العمل المشترك اتجاهاً هادئاً.",
      description: "كارينا هي المدار الذي تدور حوله المبادرات المشتركة. تجمع الأطراف المتباعدة في إيقاعٍ واحد، وتمنح الفوضى المنتجة نظاماً خفياً. حضورُها رابطٌ بين الرؤية والتنفيذ.",
      requirements: "مبادرة مشتركة · أثر موثّق",
      access: "ORBITAL",
      privileges: "قيادة فرق عمل · تنظيم مبادرات موسمية",
      status: "ALIGNED",
      membership: "مستقرة؛ تتجدد بإنجاز أثر موثّق.",
    },
    en: {
      name: "Karina",
      overview: "An orbit that brings distant paths together and gives shared work a quiet direction.",
      description: "Karina is the orbit around which shared initiatives revolve. It draws the distant threads into a single rhythm and lends a hidden order to productive chaos. Its presence is the link between vision and execution.",
      requirements: "Joint initiative · Documented impact",
      access: "ORBITAL",
      privileges: "Leading workstreams · Seasonal initiatives",
      status: "ALIGNED",
      membership: "Stable; renewed by documented impact.",
    },
  },
  {
    ar: {
      name: "المؤثر",
      overview: "صاحب بصمة تتجاوز حضوره؛ يحرّك القرار ويترك أثراً قابلاً للاستمرار.",
      description: "المؤثر لا يُقاس بحضوره بل بأثره الباقي. كلمته توزّن القرارات داخل الدائرة، وبصمته تفتح أبواباً كانت موصدة. إنه الصوت الذي يُرسّم الاتجاه حين تتقاطع الآراء.",
      requirements: "أثر مثبت · رعاية عضوين",
      access: "INFLUENCE",
      privileges: "توجيه القرار · رعاية المرشّحين",
      status: "ACTIVE",
      membership: "دائمة؛ تُحفظ ببقاء الأثر وتُعزَّز بالرعاية.",
    },
    en: {
      name: "The Influencer",
      overview: "A signature beyond presence: moving decisions and leaving impact built to remain.",
      description: "The Influencer is measured not by their presence but by the impact that outlasts them. Their word weighs upon decisions within the circle, and their signature opens doors once sealed. They are the voice that fixes direction when opinions converge.",
      requirements: "Proven impact · Two member sponsors",
      access: "INFLUENCE",
      privileges: "Shaping decisions · Sponsoring candidates",
      status: "ACTIVE",
      membership: "Permanent; held by enduring impact and strengthened by sponsorship.",
    },
  },
  {
    ar: {
      name: "القيثار",
      overview: "صانع الانسجام بين القوة والمعنى؛ يحوّل المبادرات إلى نغمة مؤسسية واحدة.",
      description: "القيثار يعزف على أوتار المؤسسة فيجعل المتنافرَ متناغماً. يوازن بين الطموح والتزامن، ويحوّل المبادرات المتفرقة إلى نغمةٍ واحدة تحمل هوية النادي. صوته الحارسُ للجمال داخل الحسم.",
      requirements: "قيادة مسار · مراجعة الميثاق",
      access: "HARMONIC",
      privileges: "صياغة الإيقاع المؤسسي · إحياء الطقوس",
      status: "RESONANT",
      membership: "ممتدّة؛ تُحفظ بانضباط النغمة.",
    },
    en: {
      name: "The Lyre",
      overview: "Maker of harmony between force and meaning, bringing initiatives into one institutional note.",
      description: "The Lyre plays upon the strings of the institution, making the discordant harmonious. It balances ambition with timing, turning scattered initiatives into a single note that carries the club's identity. Its voice is the guardian of grace within decision.",
      requirements: "Track leadership · Covenant review",
      access: "HARMONIC",
      privileges: "Shaping institutional rhythm · Reviving rituals",
      status: "RESONANT",
      membership: "Extended; held by discipline of the note.",
    },
  },
  {
    ar: {
      name: "الميثاق",
      overview: "حامل الوعد المشترك؛ تُصان عنده استمرارية النادي وميزان الثقة.",
      description: "الميثاق هو العمود الذي لا يظهر في الواجهة لكنه يحمل البناء كله. يُحفظ عنده النصّ المؤسس والميزان الذي لا يُماس. من يبلغ هذه المرتبة لا يملك قراراً فحسب، بل عهداً يحرسه جيلاً بعد جيل.",
      requirements: "إجماع المجلس · سجلّ خدمة",
      access: "COVENANT",
      privileges: "حماية العهد · مراجعة المبادئ",
      status: "ENTRUSTED",
      membership: "مُسندة؛ تُنتقل بالعهد لا بالمصادفة.",
    },
    en: {
      name: "The Covenant",
      overview: "Bearer of the shared promise, entrusted with continuity and the balance of trust.",
      description: "The Covenant is the column that never shows at the front yet carries the whole structure. Within it are guarded the founding text and the balance that must not be touched. To reach this rank is to hold not merely a decision but a promise kept across generations.",
      requirements: "Council consensus · Service record",
      access: "COVENANT",
      privileges: "Guarding the pact · Reviewing principles",
      status: "ENTRUSTED",
      membership: "Entrusted; transferred by covenant, never by chance.",
    },
  },
  {
    ar: {
      name: "مفاتيح الخلق",
      overview: "يفتح الإمكانات التي لا تُمنح إلا لمن يحسن بناء ما يدوم.",
      description: "مفاتيح الخلق تفتح ما لا يُفتح سوى للقادرين على البناء. من يحملها يملك إذناً نادراً لإنشاء أثر متعدد المجالات، وإحياء أفق كان موصداً. إنها بداية الفعل الكامل قبل الاكتمال.",
      requirements: "أثر متعدد المجالات · تفويض خاص",
      access: "CREATION",
      privileges: "إنشاء برامج جديدة · تفويض استثنائي",
      status: "CLEARED",
      membership: "مميّزة؛ تُمنح لمن أثبت القدرة على الخلق.",
    },
    en: {
      name: "Keys of Creation",
      overview: "Opens possibilities reserved for those who know how to build what endures.",
      description: "The Keys of Creation open what is opened only to those who know how to build. To bear them is to hold a rare mandate to create cross-domain impact and revive a horizon once sealed. It is the beginning of the complete act before completion.",
      requirements: "Cross-domain impact · Special mandate",
      access: "CREATION",
      privileges: "Instituting new programs · Exceptional mandate",
      status: "CLEARED",
      membership: "Distinguished; granted to those proven in creation.",
    },
  },
  {
    ar: {
      name: "أعمدة الخلق",
      overview: "القمة الحارسة للأفق؛ حضورها يثبت البنية ويمنح الأثر امتداده.",
      description: "أعمدة الخلق هي قمة الهرم المقلوب، النقطة التي يستقر عليها كل الأثر. من يقف عليها لا يمثّل النادي؛ بل يثبّت بنيته ويضمن امتداده. حضورها نادر، وثمنه إرثٌ لا ينتهي.",
      requirements: "إجماع كامل · إرث مستمر",
      access: "FOUNDATION",
      privileges: "الحماية المطلقة للرؤية · رسم الأفق",
      status: "SOVEREIGN",
      membership: "نادرة؛ تُخلَّد بالإرث لا بالزمن.",
    },
    en: {
      name: "Pillars of Creation",
      overview: "The summit that guards the horizon: a presence that steadies the structure and extends impact.",
      description: "The Pillars of Creation are the summit of the inverted pyramid — the point upon which all impact rests. Those who stand there do not represent the club; they steady its structure and ensure its reach. Their presence is rare, and its price is an enduring legacy.",
      requirements: "Full consensus · Enduring legacy",
      access: "FOUNDATION",
      privileges: "Absolute guardianship of vision · Drawing the horizon",
      status: "SOVEREIGN",
      membership: "Rare; immortalized by legacy, not by time.",
    },
  },
];
