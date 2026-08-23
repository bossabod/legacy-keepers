/* ============================================================
   projects-registry.ts

   سجلّ مشاريع النادي — مسارٌ رقمي ومسارٌ واقعي.

   النادي ينتقي عدداً محدوداً من المشاريع: مشروعان إلى أربعة في
   الشهر لكل مسار. تدخل مشاريع جديدة كل شهر أو شهرين، ويكتمل
   بعضها فيُنقل إلى الأرشيف.
   ============================================================ */

export type Track = "digital" | "physical";

export type MonthKey =
  | "JANUARY" | "FEBRUARY" | "MARCH" | "APRIL"
  | "MAY" | "JUNE" | "JULY" | "AUGUST";

export const MONTHS: MonthKey[] = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST",
];

export const UPCOMING = ["SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
export const CURRENT_MONTH: MonthKey = "AUGUST";
export const OPEN_YEAR = 2026;
export const YEARS = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020,
  2019, 2018, 2017, 2016, 2015, 2014, 2013,
] as const;

export type Stage = "discovery" | "build" | "scaling" | "delivered";

export interface Project {
  key: string;
  id: string;
  track: Track;
  nameEn: string;
  nameAr: string;
  categoryEn: string;
  categoryAr: string;
  briefEn: string;
  briefAr: string;
  overviewEn: string;
  overviewAr: string;
  started: MonthKey;
  launchEn: string;
  launchAr: string;
  stage: Stage;
  managerEn: string;
  managerAr: string;
  locationEn: string;
  locationAr: string;
  capitalChf: number;
  partners: number;
  /** فرص مفتوحة داخل المشروع */
  positionsEn: string[];
  positionsAr: string[];
  objectivesEn: string[];
  objectivesAr: string[];
  requirementsEn: string[];
  requirementsAr: string[];
  updatesEn: { date: string; text: string }[];
  updatesAr: { date: string; text: string }[];
}

/* ------------------------------------------------------------------ */
/*  المسار الرقمي                                                      */
/* ------------------------------------------------------------------ */

const DIGITAL: Project[] = [
  {
    key: "NORTHLINE",
    id: "PRJ-2601",
    track: "digital",
    nameEn: "NORTHLINE",
    nameAr: "نورث لاين",
    categoryEn: "Digital Infrastructure",
    categoryAr: "بنية رقمية",
    briefEn: "Private operational platform for the circle's internal systems.",
    briefAr: "منصّة تشغيل خاصة لأنظمة الدائرة الداخلية.",
    overviewEn:
      "Northline consolidates the club's fragmented operational tooling into a single private platform. It handles member records, project governance and internal reporting on infrastructure owned entirely by the circle, with no third-party processors in the data path.",
    overviewAr:
      "يوحّد نورث لاين أدوات التشغيل المتفرّقة في منصّة خاصة واحدة. يدير سجلّات الأعضاء وحوكمة المشاريع والتقارير الداخلية على بنية يملكها النادي بالكامل، دون أي وسيط خارجي في مسار البيانات.",
    started: "JANUARY",
    launchEn: "January 2026",
    launchAr: "يناير ٢٠٢٦",
    stage: "delivered",
    managerEn: "A. Al-Selim",
    managerAr: "أ. السليم",
    locationEn: "Geneva · Riyadh",
    locationAr: "جنيف · الرياض",
    capitalChf: 4_200_000,
    partners: 4,
    positionsEn: [],
    positionsAr: [],
    objectivesEn: [
      "Replace all external operational tooling",
      "Single ledger for member and project records",
      "Zero third-party access to circle data",
    ],
    objectivesAr: [
      "استبدال كل أدوات التشغيل الخارجية",
      "سجلّ موحّد لبيانات الأعضاء والمشاريع",
      "منع أي وصول خارجي لبيانات الدائرة",
    ],
    requirementsEn: ["Tier 5 clearance", "Signed data covenant"],
    requirementsAr: ["تصريح الرتبة ٥", "توقيع ميثاق البيانات"],
    updatesEn: [
      { date: "JUL 2026", text: "Final migration completed. Platform handed to operations." },
      { date: "MAY 2026", text: "Member ledger consolidated; legacy tooling retired." },
    ],
    updatesAr: [
      { date: "يوليو ٢٠٢٦", text: "اكتملت الهجرة النهائية وسُلّمت المنصّة للتشغيل." },
      { date: "مايو ٢٠٢٦", text: "توحيد سجلّ الأعضاء وإيقاف الأدوات القديمة." },
    ],
  },
  {
    key: "VANTA",
    id: "PRJ-2603",
    track: "digital",
    nameEn: "VANTA",
    nameAr: "فانتا",
    categoryEn: "Digital Commerce",
    categoryAr: "تجارة رقمية",
    briefEn: "Closed commerce channel for members' premium goods.",
    briefAr: "قناة تجارية مغلقة لسلع الأعضاء الفاخرة.",
    overviewEn:
      "Vanta is an invitation-only commerce layer where member ventures sell directly to the circle and to a vetted external list. It carries its own payment rails, escrow and authentication service for high-value goods.",
    overviewAr:
      "فانتا طبقة تجارية بالدعوة فقط، تبيع فيها مشاريع الأعضاء مباشرةً للدائرة ولقائمة خارجية موثّقة. تملك قنوات دفع وضمان وخدمة توثيق خاصة بالسلع عالية القيمة.",
    started: "FEBRUARY",
    launchEn: "February 2026",
    launchAr: "فبراير ٢٠٢٦",
    stage: "scaling",
    managerEn: "R. Al-Harbi",
    managerAr: "ر. الحربي",
    locationEn: "Dubai · Digital",
    locationAr: "دبي · رقمي",
    capitalChf: 2_650_000,
    partners: 5,
    positionsEn: ["Commerce Operations Lead", "Authentication Specialist"],
    positionsAr: ["قائد عمليات التجارة", "أخصائي توثيق"],
    objectivesEn: [
      "Onboard twelve member ventures by year end",
      "Settle transactions without external processors",
      "Authenticate every high-value item before dispatch",
    ],
    objectivesAr: [
      "ضمّ اثني عشر مشروعاً للأعضاء قبل نهاية العام",
      "تسوية المعاملات دون معالجات خارجية",
      "توثيق كل سلعة عالية القيمة قبل الشحن",
    ],
    requirementsEn: ["Tier 3 clearance", "Commerce or logistics background"],
    requirementsAr: ["تصريح الرتبة ٣", "خلفية في التجارة أو اللوجستيات"],
    updatesEn: [
      { date: "AUG 2026", text: "Ninth venture onboarded; escrow volume up 34% MoM." },
      { date: "JUN 2026", text: "Authentication service moved in-house." },
    ],
    updatesAr: [
      { date: "أغسطس ٢٠٢٦", text: "ضمّ المشروع التاسع وارتفاع حجم الضمان ٣٤٪ شهرياً." },
      { date: "يونيو ٢٠٢٦", text: "نقل خدمة التوثيق للداخل." },
    ],
  },
  {
    key: "ORBIT",
    id: "PRJ-2606",
    track: "digital",
    nameEn: "ORBIT",
    nameAr: "أوربِت",
    categoryEn: "Applied Intelligence",
    categoryAr: "ذكاء تطبيقي",
    briefEn: "Signal engine that reads the circle's portfolio in real time.",
    briefAr: "محرّك إشارات يقرأ محفظة الدائرة لحظياً.",
    overviewEn:
      "Orbit ingests operational telemetry from every active venture and surfaces early signals — margin drift, delivery slippage, concentration risk — before they appear in quarterly reporting. It advises; it does not decide.",
    overviewAr:
      "يستوعب أوربِت بيانات التشغيل من كل مشروع نشط ويُظهر الإشارات المبكرة — انحراف الهامش، تأخّر التسليم، تركّز المخاطر — قبل ظهورها في التقارير الفصلية. يُشير ولا يقرّر.",
    started: "APRIL",
    launchEn: "April 2026",
    launchAr: "أبريل ٢٠٢٦",
    stage: "build",
    managerEn: "L. Nasser",
    managerAr: "ل. ناصر",
    locationEn: "Zurich · Digital",
    locationAr: "زيورخ · رقمي",
    capitalChf: 1_850_000,
    partners: 3,
    positionsEn: ["Data Engineer", "Risk Analyst"],
    positionsAr: ["مهندس بيانات", "محلّل مخاطر"],
    objectivesEn: [
      "Live telemetry from every active venture",
      "Detect margin drift two quarters early",
      "Keep every recommendation auditable",
    ],
    objectivesAr: [
      "بيانات حيّة من كل مشروع نشط",
      "كشف انحراف الهامش قبل ربعين",
      "إبقاء كل توصية قابلة للتدقيق",
    ],
    requirementsEn: ["Tier 4 clearance", "Quantitative background"],
    requirementsAr: ["تصريح الرتبة ٤", "خلفية كمّية"],
    updatesEn: [
      { date: "AUG 2026", text: "Signal engine live across six ventures." },
      { date: "JUL 2026", text: "Backtest cleared review; false-positive rate under 4%." },
    ],
    updatesAr: [
      { date: "أغسطس ٢٠٢٦", text: "تشغيل محرّك الإشارات على ستة مشاريع." },
      { date: "يوليو ٢٠٢٦", text: "اجتياز الاختبار الرجعي بنسبة إنذار خاطئ دون ٤٪." },
    ],
  },
  {
    key: "HALO",
    id: "PRJ-2609",
    track: "digital",
    nameEn: "HALO",
    nameAr: "هالو",
    categoryEn: "Digital Services",
    categoryAr: "خدمات رقمية",
    briefEn: "Concierge layer serving members across time zones.",
    briefAr: "طبقة خدمة تخدم الأعضاء عبر المناطق الزمنية.",
    overviewEn:
      "Halo is the always-on service desk of the circle. Requests — travel, legal introductions, asset logistics — enter one channel and are routed to vetted providers under club terms, with every interaction logged to the member's private record.",
    overviewAr:
      "هالو مكتب الخدمة الدائم للدائرة. تدخل الطلبات — السفر، التعريفات القانونية، نقل الأصول — من قناة واحدة وتُوجَّه لمزوّدين موثّقين بشروط النادي، مع تسجيل كل تفاعل في السجلّ الخاص للعضو.",
    started: "JUNE",
    launchEn: "June 2026",
    launchAr: "يونيو ٢٠٢٦",
    stage: "build",
    managerEn: "S. Al-Qahtani",
    managerAr: "س. القحطاني",
    locationEn: "Distributed",
    locationAr: "موزّع",
    capitalChf: 940_000,
    partners: 4,
    positionsEn: ["Service Lead", "Provider Relations"],
    positionsAr: ["قائد الخدمة", "علاقات المزوّدين"],
    objectivesEn: [
      "Single channel for every member request",
      "Median first response under nine minutes",
      "Only vetted providers under club terms",
    ],
    objectivesAr: [
      "قناة واحدة لكل طلبات الأعضاء",
      "وسيط زمن أول ردّ دون تسع دقائق",
      "مزوّدون موثّقون فقط بشروط النادي",
    ],
    requirementsEn: ["Tier 2 clearance", "Service or hospitality background"],
    requirementsAr: ["تصريح الرتبة ٢", "خلفية في الخدمة أو الضيافة"],
    updatesEn: [
      { date: "AUG 2026", text: "Provider network at forty-one vetted partners." },
      { date: "JUL 2026", text: "Routing engine live; median response nine minutes." },
    ],
    updatesAr: [
      { date: "أغسطس ٢٠٢٦", text: "شبكة المزوّدين تبلغ ٤١ شريكاً موثّقاً." },
      { date: "يوليو ٢٠٢٦", text: "تشغيل محرّك التوجيه بوسيط ردّ تسع دقائق." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  المسار الواقعي                                                     */
/* ------------------------------------------------------------------ */

const PHYSICAL: Project[] = [
  {
    key: "FORGE",
    id: "PRJ-2602",
    track: "physical",
    nameEn: "FORGE",
    nameAr: "فورج",
    categoryEn: "Manufacturing",
    categoryAr: "تصنيع",
    briefEn: "GMP plant for vitamins and dietary supplements.",
    briefAr: "مصنع فيتامينات ومكمّلات بمواصفات GMP.",
    overviewEn:
      "Forge is a certified production facility outside Jeddah with an automated filling line and Gulf export licensing. It supplies member ventures at internal rates and takes outside contracts to hold utilisation above eighty percent.",
    overviewAr:
      "فورج منشأة إنتاج معتمدة خارج جدة بخط تعبئة آلي وترخيص تصدير خليجي. تزوّد مشاريع الأعضاء بأسعار داخلية وتقبل عقوداً خارجية لإبقاء التشغيل فوق ثمانين بالمئة.",
    started: "JANUARY",
    launchEn: "January 2026",
    launchAr: "يناير ٢٠٢٦",
    stage: "delivered",
    managerEn: "M. Al-Otaibi",
    managerAr: "م. العتيبي",
    locationEn: "Jeddah · Saudi Arabia",
    locationAr: "جدة · السعودية",
    capitalChf: 7_800_000,
    partners: 5,
    positionsEn: [],
    positionsAr: [],
    objectivesEn: [
      "Twelve million units annual capacity",
      "GMP certification before first shipment",
      "Gulf export licensing in year one",
    ],
    objectivesAr: [
      "طاقة إنتاجية اثنا عشر مليون عبوة سنوياً",
      "شهادة GMP قبل أول شحنة",
      "ترخيص التصدير الخليجي في السنة الأولى",
    ],
    requirementsEn: ["Tier 4 clearance", "Industrial background"],
    requirementsAr: ["تصريح الرتبة ٤", "خلفية صناعية"],
    updatesEn: [
      { date: "MAY 2026", text: "Commissioning complete. Plant handed to operations." },
      { date: "MAR 2026", text: "GMP certification granted; filling line accepted." },
    ],
    updatesAr: [
      { date: "مايو ٢٠٢٦", text: "اكتمال التشغيل التجريبي وتسليم المصنع." },
      { date: "مارس ٢٠٢٦", text: "منح شهادة GMP واعتماد خط التعبئة." },
    ],
  },
  {
    key: "BLACKSTONE",
    id: "PRJ-2604",
    track: "physical",
    nameEn: "BLACKSTONE",
    nameAr: "بلاكستون",
    categoryEn: "Hospitality",
    categoryAr: "ضيافة",
    briefEn: "Private dining room and members' house.",
    briefAr: "قاعة طعام خاصة ودار للأعضاء.",
    overviewEn:
      "Blackstone is the circle's physical anchor in Riyadh: a private dining room, three meeting chambers and a cellar, open to members without reservation. It is deliberately unmarked and carries no public listing.",
    overviewAr:
      "بلاكستون مرساة الدائرة المادية في الرياض: قاعة طعام خاصة وثلاث غرف اجتماعات وقبو، مفتوحة للأعضاء بلا حجز. بلا لافتة عمداً وبلا أي إدراج علني.",
    started: "MARCH",
    launchEn: "March 2026",
    launchAr: "مارس ٢٠٢٦",
    stage: "scaling",
    managerEn: "F. Al-Dosari",
    managerAr: "ف. الدوسري",
    locationEn: "Riyadh · Saudi Arabia",
    locationAr: "الرياض · السعودية",
    capitalChf: 5_400_000,
    partners: 6,
    positionsEn: ["House Director", "Executive Chef"],
    positionsAr: ["مدير الدار", "رئيس الطهاة"],
    objectivesEn: [
      "Open the house before the winter assembly",
      "Members seated without reservation",
      "No public listing of any kind",
    ],
    objectivesAr: [
      "افتتاح الدار قبل الجلسة الشتوية",
      "جلوس الأعضاء بلا حجز",
      "عدم الإدراج العلني بأي شكل",
    ],
    requirementsEn: ["Tier 3 clearance", "Hospitality background"],
    requirementsAr: ["تصريح الرتبة ٣", "خلفية في الضيافة"],
    updatesEn: [
      { date: "AUG 2026", text: "Interior complete. Kitchen commissioning underway." },
      { date: "JUN 2026", text: "Cellar stocked; service rehearsals begun." },
    ],
    updatesAr: [
      { date: "أغسطس ٢٠٢٦", text: "اكتمال التشطيب وبدء تشغيل المطبخ." },
      { date: "يونيو ٢٠٢٦", text: "تجهيز القبو وبدء تدريبات الخدمة." },
    ],
  },
  {
    key: "TERRA",
    id: "PRJ-2607",
    track: "physical",
    nameEn: "TERRA",
    nameAr: "تيرّا",
    categoryEn: "Real Estate",
    categoryAr: "عقار",
    briefEn: "Sanctuary estates held under separate entities.",
    briefAr: "عقارات ملاذ مسجّلة تحت كيانات منفصلة.",
    overviewEn:
      "Terra assembles a small portfolio of residences for member use and circle assemblies. Each property sits under its own entity with no registry link between them, and none is ever listed on an open market.",
    overviewAr:
      "تجمّع تيرّا محفظة صغيرة من المساكن لاستخدام الأعضاء وجلسات الدائرة. كل عقار تحت كيان مستقل بلا رابط تسجيلي بينها، ولا يُعرض أي منها في سوق مفتوح.",
    started: "MAY",
    launchEn: "May 2026",
    launchAr: "مايو ٢٠٢٦",
    stage: "build",
    managerEn: "K. Al-Ghamdi",
    managerAr: "ك. الغامدي",
    locationEn: "Three continents",
    locationAr: "ثلاث قارات",
    capitalChf: 22_800_000,
    partners: 7,
    positionsEn: ["Acquisitions Lead", "Estate Counsel"],
    positionsAr: ["قائد الاستحواذ", "مستشار العقار"],
    objectivesEn: [
      "Five residences across three continents",
      "Separate entity per property, no registry link",
      "Never listed on an open market",
    ],
    objectivesAr: [
      "خمسة مساكن في ثلاث قارات",
      "كيان مستقل لكل عقار بلا رابط تسجيلي",
      "عدم الإدراج في أي سوق مفتوح",
    ],
    requirementsEn: ["Tier 6 clearance", "Real estate or legal background"],
    requirementsAr: ["تصريح الرتبة ٦", "خلفية عقارية أو قانونية"],
    updatesEn: [
      { date: "AUG 2026", text: "Third acquisition closed. Two under negotiation." },
      { date: "JUL 2026", text: "Entity structure cleared by counsel in all jurisdictions." },
    ],
    updatesAr: [
      { date: "أغسطس ٢٠٢٦", text: "إغلاق الاستحواذ الثالث واثنان قيد التفاوض." },
      { date: "يوليو ٢٠٢٦", text: "اعتماد هيكل الكيانات قانونياً في كل الولايات." },
    ],
  },
  {
    key: "CARAVAN",
    id: "PRJ-2610",
    track: "physical",
    nameEn: "CARAVAN",
    nameAr: "كارافان",
    categoryEn: "Logistics",
    categoryAr: "لوجستيات",
    briefEn: "Cold-chain corridor between Türkiye and the Gulf.",
    briefAr: "ممرّ مبرَّد بين تركيا والخليج.",
    overviewEn:
      "Caravan runs a refrigerated freight corridor from Istanbul to Riyadh for member ventures moving textiles, food and pharmaceuticals. It bundles customs clearance so a shipment clears under one contract rather than four.",
    overviewAr:
      "يشغّل كارافان ممرّ شحن مبرَّد من إسطنبول إلى الرياض لمشاريع الأعضاء الناقلة للمنسوجات والأغذية والأدوية. يضمّ التخليص الجمركي فتُخلَّص الشحنة بعقد واحد بدل أربعة.",
    started: "JULY",
    launchEn: "July 2026",
    launchAr: "يوليو ٢٠٢٦",
    stage: "discovery",
    managerEn: "T. Yildirim",
    managerAr: "ت. يلديريم",
    locationEn: "Istanbul → Riyadh",
    locationAr: "إسطنبول ← الرياض",
    capitalChf: 3_100_000,
    partners: 2,
    positionsEn: ["Corridor Manager", "Customs Lead"],
    positionsAr: ["مدير الممرّ", "قائد التخليص"],
    objectivesEn: [
      "Weekly departures by the fourth quarter",
      "Single contract from origin to delivery",
      "Unbroken cold chain end to end",
    ],
    objectivesAr: [
      "رحلات أسبوعية بحلول الربع الرابع",
      "عقد واحد من المنشأ إلى التسليم",
      "سلسلة تبريد متّصلة من الطرفين",
    ],
    requirementsEn: ["Tier 3 clearance", "Freight or customs background"],
    requirementsAr: ["تصريح الرتبة ٣", "خلفية في الشحن أو الجمارك"],
    updatesEn: [
      { date: "AUG 2026", text: "First two convoys cleared. Route timing validated." },
      { date: "JUL 2026", text: "Corridor agreement signed with both customs authorities." },
    ],
    updatesAr: [
      { date: "أغسطس ٢٠٢٦", text: "تخليص أول قافلتين والتحقّق من توقيت المسار." },
      { date: "يوليو ٢٠٢٦", text: "توقيع اتفاقية الممرّ مع سلطتَي الجمارك." },
    ],
  },
];

export const ALL_PROJECTS = [...DIGITAL, ...PHYSICAL];

export function projectByKey(key: string) {
  return ALL_PROJECTS.find((p) => p.key === key);
}

/* ------------------------------------------------------------------ */
/*  الخط الزمني — نسب التقدّم شهراً بشهر                               */
/*  المشروع الغائب من شهرٍ يعني أنه لم يبدأ بعد أو نُقل للأرشيف.        */
/* ------------------------------------------------------------------ */

type Row = Record<string, number>;

const TL: Record<Track, Record<MonthKey, Row>> = {
  digital: {
    JANUARY:  { NORTHLINE: 14 },
    FEBRUARY: { NORTHLINE: 27, VANTA: 6 },
    MARCH:    { NORTHLINE: 43, VANTA: 15 },
    APRIL:    { NORTHLINE: 61, VANTA: 27, ORBIT: 8 },
    MAY:      { NORTHLINE: 78, VANTA: 39, ORBIT: 19 },
    JUNE:     { NORTHLINE: 92, VANTA: 53, ORBIT: 31, HALO: 7 },
    JULY:     { NORTHLINE: 100, VANTA: 68, ORBIT: 44, HALO: 16 },
    AUGUST:   { VANTA: 84, ORBIT: 57, HALO: 28 },
  },
  physical: {
    JANUARY:  { FORGE: 11 },
    FEBRUARY: { FORGE: 24 },
    MARCH:    { FORGE: 46, BLACKSTONE: 9 },
    APRIL:    { FORGE: 68, BLACKSTONE: 21 },
    MAY:      { FORGE: 100, BLACKSTONE: 34, TERRA: 6 },
    JUNE:     { BLACKSTONE: 49, TERRA: 17 },
    JULY:     { BLACKSTONE: 66, TERRA: 31, CARAVAN: 5 },
    AUGUST:   { BLACKSTONE: 88, TERRA: 46, CARAVAN: 17 },
  },
};

export interface Snapshot extends Project {
  completion: number;
  status: "COMPLETED" | "ACTIVE";
  isNew: boolean;
}

/** لقطة شهر لمسار محدّد. */
export function snapshot(track: Track, month: MonthKey): Snapshot[] {
  const row = TL[track][month];
  const idx = MONTHS.indexOf(month);
  const prev = idx > 0 ? TL[track][MONTHS[idx - 1]] : {};

  return Object.entries(row)
    .map(([key, completion]) => {
      const meta = ALL_PROJECTS.find((p) => p.key === key)!;
      return {
        ...meta,
        completion,
        status: completion >= 100 ? ("COMPLETED" as const) : ("ACTIVE" as const),
        isNew: !(key in prev),
      };
    })
    .sort((a, b) => b.completion - a.completion);
}

/** إحصاء الشهر: نشط، مكتمل، ومؤرشف (اكتمل في شهر سابق). */
export function tally(track: Track, month: MonthKey) {
  const rows = snapshot(track, month);
  const idx = MONTHS.indexOf(month);

  let archived = 0;
  for (let i = 0; i < idx; i++) {
    const past = TL[track][MONTHS[i]];
    for (const [key, v] of Object.entries(past)) {
      if (v >= 100 && !(key in TL[track][month])) archived++;
    }
  }

  return {
    active: rows.filter((r) => r.status === "ACTIVE").length,
    completed: rows.filter((r) => r.status === "COMPLETED").length,
    archived,
  };
}
