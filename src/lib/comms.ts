/* ============================================================
   comms.ts — نظام المراسلات الداخلي للنادي.

   أربعة أنواع من الاتصالات، لكل منها معالجة بصرية مختلفة:
     administration — بلاغ رسمي من الإدارة (أحمر، مثبّت)
     mail           — بريد داخلي رسمي
     group          — إرسال جماعي
     direct         — محادثة ثنائية

   البيانات حتمية: نفس البذرة ⇒ نفس السجلّ في كل تحميل، فلا
   يختلف الخادم عن المتصفح.
   ============================================================ */

export type Channel = "administration" | "mail" | "group" | "direct";
export type Priority = "routine" | "elevated" | "critical";
export type Delivery = "SENT" | "DELIVERED" | "READ";

export type FilterKey =
  | "all"
  | "unread"
  | "read"
  | "sent"
  | "inbound"
  | "official"
  | "archived";

export const FILTERS: FilterKey[] = [
  "all",
  "unread",
  "read",
  "sent",
  "inbound",
  "official",
  "archived",
];

export interface Correspondent {
  /** الهوية الرقمية — تحلّ محلّ الصورة الشخصية */
  sigil: string;
  nameEn: string;
  nameAr: string;
  rankEn: string;
  rankAr: string;
  /** رتبة عليا ⇒ وسم أحمر أوضح */
  tier: number;
}

export interface Entry {
  id: string;
  channel: Channel;
  from: Correspondent;
  subjectEn: string;
  subjectAr: string;
  previewEn: string;
  previewAr: string;
  /** الطابع الزمني — سلسلة ثابتة لتفادي اختلاف الخادم والمتصفح */
  stamp: string;
  priority: Priority;
  read: boolean;
  outbound: boolean;
  archived: boolean;
  /** عدد المستلمين — للإرسال الجماعي */
  recipients?: number;
  /** مجرى المحادثة */
  thread: Turn[];
}

export interface Turn {
  id: string;
  mine: boolean;
  stamp: string;
  textEn: string;
  textAr: string;
  delivery: Delivery;
}

/* ------------------------------------------------------------------ */
/*  المراسلون                                                          */
/* ------------------------------------------------------------------ */

export const OPERATOR: Correspondent = {
  sigil: "ID-0417",
  nameEn: "A. Al-Selim",
  nameAr: "أ. السليم",
  rankEn: "Karina",
  rankAr: "كارينا",
  tier: 4,
};

const ADMIN: Correspondent = {
  sigil: "ADM-001",
  nameEn: "Office of the Covenant",
  nameAr: "مكتب الميثاق",
  rankEn: "Administration",
  rankAr: "الإدارة",
  tier: 9,
};

const PEOPLE: Correspondent[] = [
  { sigil: "E-028", nameEn: "R. Al-Harbi", nameAr: "ر. الحربي", rankEn: "Pillars of Creation", rankAr: "أعمدة الخلق", tier: 9 },
  { sigil: "ID-0292", nameEn: "L. Nasser", nameAr: "ل. ناصر", rankEn: "Keys of Creation", rankAr: "مفاتيح الخلق", tier: 8 },
  { sigil: "E-113", nameEn: "F. Al-Dosari", nameAr: "ف. الدوسري", rankEn: "The Covenant", rankAr: "الميثاق", tier: 7 },
  { sigil: "ID-0561", nameEn: "M. Al-Otaibi", nameAr: "م. العتيبي", rankEn: "The Lyre", rankAr: "القيثار", tier: 6 },
  { sigil: "E-074", nameEn: "S. Al-Qahtani", nameAr: "س. القحطاني", rankEn: "The Influencer", rankAr: "المؤثّر", tier: 5 },
  { sigil: "ID-0838", nameEn: "K. Al-Ghamdi", nameAr: "ك. الغامدي", rankEn: "Karina", rankAr: "كارينا", tier: 4 },
  { sigil: "E-206", nameEn: "T. Yildirim", nameAr: "ت. يلديريم", rankEn: "The Chamberlain", rankAr: "الحاجب", tier: 3 },
  { sigil: "ID-0119", nameEn: "N. Al-Shamri", nameAr: "ن. الشمري", rankEn: "Karina", rankAr: "كارينا", tier: 4 },
];

/* ------------------------------------------------------------------ */
/*  السجلّ                                                             */
/* ------------------------------------------------------------------ */

function turn(
  id: string,
  mine: boolean,
  stamp: string,
  textEn: string,
  textAr: string,
  delivery: Delivery = "READ"
): Turn {
  return { id, mine, stamp, textEn, textAr, delivery };
}

export const REGISTRY: Entry[] = [
  /* ---------- بلاغات الإدارة — مثبّتة ---------- */
  {
    id: "MSG-9001",
    channel: "administration",
    from: ADMIN,
    subjectEn: "Covenant Review — Attendance Required",
    subjectAr: "مراجعة الميثاق — الحضور مطلوب",
    previewEn:
      "The winter assembly convenes on the fourteenth. Attendance is recorded against your standing.",
    previewAr:
      "تنعقد الجلسة الشتوية في الرابع عشر. يُسجَّل الحضور في سجلّ مكانتك.",
    stamp: "05 AUG · 09:12",
    priority: "critical",
    read: false,
    outbound: false,
    archived: false,
    thread: [
      turn(
        "t1",
        false,
        "05 AUG · 09:12",
        "The winter assembly convenes on the fourteenth of this month at the Riyadh house. Attendance is recorded against your standing within the circle. Confirm receipt through this channel.",
        "تنعقد الجلسة الشتوية في الرابع عشر من هذا الشهر في دار الرياض. يُسجَّل الحضور في سجلّ مكانتك داخل الدائرة. أكّد الاستلام عبر هذه القناة."
      ),
    ],
  },
  {
    id: "MSG-9002",
    channel: "administration",
    from: ADMIN,
    subjectEn: "Data Covenant — Amendment 4",
    subjectAr: "ميثاق البيانات — التعديل الرابع",
    previewEn:
      "Amendment four takes effect at month end. Review the revised clauses before acknowledging.",
    previewAr:
      "يسري التعديل الرابع نهاية الشهر. راجع البنود المعدّلة قبل الإقرار.",
    stamp: "03 AUG · 17:40",
    priority: "elevated",
    read: false,
    outbound: false,
    archived: false,
    thread: [
      turn(
        "t1",
        false,
        "03 AUG · 17:40",
        "Amendment four to the data covenant takes effect at month end. Clauses seven through eleven have been revised. Review before acknowledging.",
        "يسري التعديل الرابع لميثاق البيانات نهاية الشهر. عُدِّلت البنود من السابع إلى الحادي عشر. راجعها قبل الإقرار."
      ),
    ],
  },

  /* ---------- بريد رسمي ---------- */
  {
    id: "MSG-7431",
    channel: "mail",
    from: PEOPLE[0],
    subjectEn: "VANTA — Quarterly Position",
    subjectAr: "فانتا — الوضع الفصلي",
    previewEn: "Escrow volume up thirty-four percent. Full statement attached to the record.",
    previewAr: "ارتفاع حجم الضمان أربعة وثلاثين بالمئة. البيان الكامل مرفق بالسجلّ.",
    stamp: "04 AUG · 14:05",
    priority: "elevated",
    read: false,
    outbound: false,
    archived: false,
    thread: [
      turn(
        "t1",
        false,
        "04 AUG · 14:05",
        "Escrow volume is up thirty-four percent month over month. The ninth venture completed onboarding this week. Full statement is attached to the project record.",
        "ارتفع حجم الضمان أربعة وثلاثين بالمئة شهرياً. أكمل المشروع التاسع انضمامه هذا الأسبوع. البيان الكامل مرفق بسجلّ المشروع."
      ),
    ],
  },
  {
    id: "MSG-7402",
    channel: "mail",
    from: PEOPLE[2],
    subjectEn: "Blackstone — Commissioning Notice",
    subjectAr: "بلاكستون — إشعار التشغيل",
    previewEn: "Kitchen commissioning begins Monday. The house opens to members thereafter.",
    previewAr: "يبدأ تشغيل المطبخ الاثنين. تُفتح الدار للأعضاء بعده.",
    stamp: "02 AUG · 11:22",
    priority: "routine",
    read: true,
    outbound: false,
    archived: false,
    thread: [
      turn(
        "t1",
        false,
        "02 AUG · 11:22",
        "Kitchen commissioning begins Monday. The house opens to members thereafter, without reservation as agreed.",
        "يبدأ تشغيل المطبخ الاثنين. تُفتح الدار للأعضاء بعده، بلا حجز كما اتُّفق."
      ),
    ],
  },

  /* ---------- إرسال جماعي ---------- */
  {
    id: "MSG-6120",
    channel: "group",
    from: PEOPLE[1],
    subjectEn: "Orbit Working Group — Signal Review",
    subjectAr: "فريق أوربِت — مراجعة الإشارات",
    previewEn: "Six ventures now reporting. Review window closes Thursday.",
    previewAr: "ستة مشاريع ترفع تقاريرها الآن. تُغلق نافذة المراجعة الخميس.",
    stamp: "04 AUG · 08:30",
    priority: "routine",
    read: true,
    outbound: false,
    archived: false,
    recipients: 6,
    thread: [
      turn(
        "t1",
        false,
        "04 AUG · 08:30",
        "Six ventures are now reporting telemetry into Orbit. The review window closes Thursday; submit observations before then.",
        "ستة مشاريع ترفع بياناتها إلى أوربِت الآن. تُغلق نافذة المراجعة الخميس؛ ارفع ملاحظاتك قبلها."
      ),
    ],
  },
  {
    id: "MSG-6088",
    channel: "group",
    from: OPERATOR,
    subjectEn: "Caravan Corridor — Timing Confirmation",
    subjectAr: "ممرّ كارافان — تأكيد التوقيت",
    previewEn: "Confirming weekly departures from the fourth quarter.",
    previewAr: "تأكيد الرحلات الأسبوعية اعتباراً من الربع الرابع.",
    stamp: "01 AUG · 16:47",
    priority: "routine",
    read: true,
    outbound: true,
    archived: false,
    recipients: 3,
    thread: [
      turn(
        "t1",
        true,
        "01 AUG · 16:47",
        "Confirming weekly departures from the fourth quarter. Customs agreement is signed on both sides.",
        "تأكيد الرحلات الأسبوعية اعتباراً من الربع الرابع. اتفاقية الجمارك موقّعة من الطرفين.",
        "DELIVERED"
      ),
    ],
  },

  /* ---------- محادثات ثنائية ---------- */
  {
    id: "MSG-4417",
    channel: "direct",
    from: PEOPLE[3],
    subjectEn: "Forge — Export Licence",
    subjectAr: "فورج — رخصة التصدير",
    previewEn: "Licence cleared. First Gulf shipment moves next week.",
    previewAr: "صدرت الرخصة. أول شحنة خليجية تتحرّك الأسبوع القادم.",
    stamp: "05 AUG · 07:55",
    priority: "routine",
    read: false,
    outbound: false,
    archived: false,
    thread: [
      turn("t1", false, "04 AUG · 19:10",
        "The licence cleared this afternoon. We can move the first Gulf shipment next week.",
        "صدرت الرخصة بعد ظهر اليوم. نستطيع تحريك أول شحنة خليجية الأسبوع القادم."),
      turn("t2", true, "04 AUG · 19:34",
        "Understood. Hold the schedule until the corridor confirms capacity.",
        "مفهوم. أوقف الجدول حتى يؤكّد الممرّ الطاقة الاستيعابية.", "READ"),
      turn("t3", false, "05 AUG · 07:55",
        "Corridor confirmed. Two convoys cleared already. Proceeding.",
        "أكّد الممرّ. تخليص قافلتين بالفعل. نمضي قدماً."),
    ],
  },
  {
    id: "MSG-4390",
    channel: "direct",
    from: PEOPLE[4],
    subjectEn: "Halo — Provider Vetting",
    subjectAr: "هالو — توثيق المزوّدين",
    previewEn: "Forty-one partners vetted. Two pending final review.",
    previewAr: "توثيق واحد وأربعين شريكاً. اثنان بانتظار المراجعة النهائية.",
    stamp: "03 AUG · 13:18",
    priority: "routine",
    read: true,
    outbound: false,
    archived: false,
    thread: [
      turn("t1", false, "03 AUG · 13:18",
        "Forty-one partners are vetted and live. Two remain pending final review.",
        "واحد وأربعون شريكاً موثّقون وفعّالون. اثنان بانتظار المراجعة النهائية."),
      turn("t2", true, "03 AUG · 13:41",
        "Send the two files through the official channel.",
        "أرسل الملفّين عبر القناة الرسمية.", "READ"),
    ],
  },
  {
    id: "MSG-4355",
    channel: "direct",
    from: PEOPLE[5],
    subjectEn: "Terra — Third Acquisition",
    subjectAr: "تيرّا — الاستحواذ الثالث",
    previewEn: "Closed this morning. Entity structure holds in all jurisdictions.",
    previewAr: "أُغلق هذا الصباح. هيكل الكيانات ثابت في كل الولايات.",
    stamp: "01 AUG · 10:02",
    priority: "routine",
    read: true,
    outbound: false,
    archived: false,
    thread: [
      turn("t1", false, "01 AUG · 10:02",
        "The third acquisition closed this morning. Counsel confirms the entity structure holds in all jurisdictions.",
        "أُغلق الاستحواذ الثالث هذا الصباح. يؤكّد المستشار ثبات هيكل الكيانات في كل الولايات."),
    ],
  },
  {
    id: "MSG-4301",
    channel: "direct",
    from: PEOPLE[6],
    subjectEn: "Istanbul — Freight Terms",
    subjectAr: "إسطنبول — شروط الشحن",
    previewEn: "Revised terms attached. Awaiting your position.",
    previewAr: "الشروط المعدّلة مرفقة. بانتظار موقفك.",
    stamp: "29 JUL · 15:26",
    priority: "routine",
    read: true,
    outbound: false,
    archived: true,
    thread: [
      turn("t1", false, "29 JUL · 15:26",
        "Revised freight terms are attached. Awaiting your position before we counter.",
        "الشروط المعدّلة للشحن مرفقة. بانتظار موقفك قبل أن نردّ."),
    ],
  },
  {
    id: "MSG-4288",
    channel: "direct",
    from: PEOPLE[7],
    subjectEn: "Membership Sponsorship",
    subjectAr: "تزكية عضوية",
    previewEn: "Two candidates put forward for the winter intake.",
    previewAr: "مرشّحان لدفعة الشتاء.",
    stamp: "24 JUL · 09:44",
    priority: "routine",
    read: true,
    outbound: false,
    archived: true,
    thread: [
      turn("t1", false, "24 JUL · 09:44",
        "Two candidates put forward for the winter intake. Files are with the covenant office.",
        "مرشّحان لدفعة الشتاء. الملفّان لدى مكتب الميثاق."),
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  مساعدات                                                            */
/* ------------------------------------------------------------------ */

export function isOfficial(e: Entry) {
  return e.channel === "administration" || e.channel === "mail";
}

/** التصفية حسب المفتاح المختار. */
export function applyFilter(list: Entry[], f: FilterKey): Entry[] {
  switch (f) {
    case "unread":
      return list.filter((e) => !e.read && !e.archived);
    case "read":
      return list.filter((e) => e.read && !e.archived);
    case "sent":
      return list.filter((e) => e.outbound && !e.archived);
    case "inbound":
      return list.filter((e) => !e.outbound && !e.archived);
    case "official":
      return list.filter((e) => isOfficial(e) && !e.archived);
    case "archived":
      return list.filter((e) => e.archived);
    default:
      return list.filter((e) => !e.archived);
  }
}

/** ترتيب: بلاغات الإدارة غير المقروءة تبقى مثبّتة في الأعلى. */
export function order(list: Entry[]): Entry[] {
  const pinned = list.filter(
    (e) => e.channel === "administration" && !e.read && !e.archived
  );
  const rest = list.filter((e) => !pinned.includes(e));
  return [...pinned, ...rest];
}

export function counters(list: Entry[]) {
  return {
    unread: list.filter((e) => !e.read && !e.archived).length,
    official: list.filter((e) => isOfficial(e) && !e.archived).length,
    archived: list.filter((e) => e.archived).length,
  };
}

/** المجموعات المتاحة للإرسال الجماعي. */
export const GROUPS = [
  { id: "council", en: "Covenant Council", ar: "مجلس الميثاق", size: 5 },
  { id: "operators", en: "Project Operators", ar: "مشغّلو المشاريع", size: 9 },
  { id: "pillars", en: "Pillars & Keys", ar: "الأعمدة والمفاتيح", size: 4 },
  { id: "all", en: "Full Circle", ar: "الدائرة كاملة", size: 77 },
];

export const DIRECTORY = PEOPLE;
