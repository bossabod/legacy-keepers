// ============================================================
//  بيانات قسم المشاريع — Projects Domain Data
// ============================================================

export type ProjectTrack = "private" | "ground" | "online";

/** أدنى رتبة (ord) مسموح لها بمشاهدة العنصر */
export type RankOrd = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface ClubProject {
  id: string;
  track: ProjectTrack;
  /** قوة المشروع 0–100 — تُستخدم للترتيب من الأقوى للأصغر */
  power: number;
  /** أدنى رتبة تستطيع رؤية المشروع */
  minRank: RankOrd;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  locationAr: string;
  locationEn: string;
  valueChf: number;
  partners: number;
  /** نسبة الاكتمال */
  progress: number;
  statusAr: string;
  statusEn: string;
  tagsAr: string[];
  tagsEn: string[];
  /** للمشاريع الدولية: مسار التبادل */
  routeAr?: string;
  routeEn?: string;
}

// ------------------------------------------------------------
//  مشاريع خاصة — محجوبة عن الرتب الصغيرة
// ------------------------------------------------------------
const PRIVATE: ClubProject[] = [
  {
    id: "p-01",
    track: "private",
    power: 98,
    minRank: 9,
    titleAr: "صندوق العهدة السيادي",
    titleEn: "Sovereign Covenant Fund",
    summaryAr:
      "صندوق مغلق يُدار من جنيف، يجمع رؤوس أموال أعمدة الخلق في أدوات طويلة الأجل خارج الأسواق العامة. الدخول بالتزكية فقط ولا يُفصح عن قائمة الملاك.",
    summaryEn:
      "A closed Geneva-managed fund pooling pillar-tier capital into long-horizon instruments outside public markets. Entry by endorsement only; the cap table is never disclosed.",
    locationAr: "جنيف · سويسرا",
    locationEn: "Geneva · Switzerland",
    valueChf: 84_000_000,
    partners: 2,
    progress: 71,
    statusAr: "نشِط · مغلق",
    statusEn: "Active · Sealed",
    tagsAr: ["سيادي", "طويل الأجل", "بالتزكية"],
    tagsEn: ["Sovereign", "Long-horizon", "By endorsement"],
  },
  {
    id: "p-02",
    track: "private",
    power: 93,
    minRank: 8,
    titleAr: "بوابة الاستحواذ الصامت",
    titleEn: "Silent Acquisition Gateway",
    summaryAr:
      "منصة داخلية لتنفيذ استحواذات على شركات عائلية متعثرة قبل طرحها علنًا. تُدار عبر وسطاء معتمدين ولا يظهر اسم النادي في أي وثيقة.",
    summaryEn:
      "An internal desk executing acquisitions of distressed family businesses before public listing. Run through vetted intermediaries; the circle's name appears on no document.",
    locationAr: "زيورخ · لندن",
    locationEn: "Zurich · London",
    valueChf: 46_500_000,
    partners: 4,
    progress: 58,
    statusAr: "قيد التنفيذ",
    statusEn: "In Execution",
    tagsAr: ["استحواذ", "سرّي", "وسطاء"],
    tagsEn: ["Acquisition", "Confidential", "Brokered"],
  },
  {
    id: "p-03",
    track: "private",
    power: 87,
    minRank: 7,
    titleAr: "خزنة المعادن النادرة",
    titleEn: "Rare Metals Vault",
    summaryAr:
      "مخزون مادي من المعادن النادرة محفوظ في مستودعات حرة، يُستخدم كضمان للعمليات الكبرى داخل الدائرة دون المرور بالنظام المصرفي.",
    summaryEn:
      "A physical rare-metals reserve held in free-trade warehouses, used as collateral for major internal operations without touching the banking system.",
    locationAr: "بازل · سنغافورة",
    locationEn: "Basel · Singapore",
    valueChf: 31_200_000,
    partners: 5,
    progress: 84,
    statusAr: "مؤمَّن",
    statusEn: "Secured",
    tagsAr: ["أصول مادية", "ضمانات", "مستودع حر"],
    tagsEn: ["Hard assets", "Collateral", "Free port"],
  },
  {
    id: "p-04",
    track: "private",
    power: 79,
    minRank: 6,
    titleAr: "شبكة الملاذات العقارية",
    titleEn: "Sanctuary Estates Network",
    summaryAr:
      "محفظة عقارات خاصة في ثلاث قارات مخصّصة لاجتماعات الدائرة وإقامة الأعضاء، مسجّلة تحت كيانات منفصلة لا رابط بينها.",
    summaryEn:
      "A private estate portfolio across three continents for circle assemblies and member residence, registered under unlinked separate entities.",
    locationAr: "متعدد · ٣ قارات",
    locationEn: "Multi-site · 3 continents",
    valueChf: 22_800_000,
    partners: 7,
    progress: 63,
    statusAr: "توسّع",
    statusEn: "Expanding",
    tagsAr: ["عقار", "خصوصية", "متعدد الولايات"],
    tagsEn: ["Real estate", "Privacy", "Multi-jurisdiction"],
  },
  {
    id: "p-05",
    track: "private",
    power: 68,
    minRank: 5,
    titleAr: "مكتب العلاقات السيادية",
    titleEn: "Sovereign Relations Desk",
    summaryAr:
      "قناة اتصال هادئة مع جهات حكومية وشبه حكومية لتسهيل التراخيص والتصاريح لمشاريع الأعضاء دون واجهة إعلامية.",
    summaryEn:
      "A quiet channel to governmental and quasi-governmental bodies, easing licences and permits for member ventures with zero public footprint.",
    locationAr: "الرياض · أبوظبي · الدوحة",
    locationEn: "Riyadh · Abu Dhabi · Doha",
    valueChf: 9_400_000,
    partners: 9,
    progress: 47,
    statusAr: "مفتوح للرتب العليا",
    statusEn: "Open · Upper tiers",
    tagsAr: ["علاقات", "تراخيص", "تسهيل"],
    tagsEn: ["Relations", "Licensing", "Facilitation"],
  },
];

// ------------------------------------------------------------
//  مشاريع على أرض الواقع
// ------------------------------------------------------------
const GROUND: ClubProject[] = [
  {
    id: "g-01",
    track: "ground",
    power: 95,
    minRank: 4,
    titleAr: "تشارك دولي · استيراد تركيا ← السعودية",
    titleEn: "International Partnership · Türkiye → Saudi Import",
    summaryAr:
      "شراكة مباشرة بين عضو في إسطنبول وعضو في الرياض لاستيراد المنسوجات والجلود التركية عالية الجودة. العضو التركي يتولى المصدر والشحن، والعضو السعودي يتولى التخليص والتوزيع على منافذ البيع.",
    summaryEn:
      "A direct partnership between an Istanbul member and a Riyadh member importing premium Turkish textiles and leather. The Turkish side handles sourcing and freight; the Saudi side handles customs and retail distribution.",
    locationAr: "إسطنبول ← الرياض",
    locationEn: "Istanbul → Riyadh",
    routeAr: "تركيا 🇹🇷 ← السعودية 🇸🇦",
    routeEn: "Türkiye 🇹🇷 → Saudi Arabia 🇸🇦",
    valueChf: 4_200_000,
    partners: 2,
    progress: 76,
    statusAr: "شحنات جارية",
    statusEn: "Shipping Active",
    tagsAr: ["استيراد", "تشارك دولي", "منسوجات"],
    tagsEn: ["Import", "Cross-border", "Textiles"],
  },
  {
    id: "g-02",
    track: "ground",
    power: 89,
    minRank: 4,
    titleAr: "مصنع الفيتامينات والمكمّلات",
    titleEn: "Vitamins & Supplements Plant",
    summaryAr:
      "بناء مصنع لإنتاج الفيتامينات والمكمّلات الغذائية بمواصفات GMP، بطاقة إنتاجية أولية ١٢ مليون عبوة سنويًا، مع خط تعبئة آلي وترخيص تصدير خليجي.",
    summaryEn:
      "Construction of a GMP-certified vitamins and dietary-supplements plant with an initial capacity of 12M units per year, automated filling line and GCC export licensing.",
    locationAr: "جدة · السعودية",
    locationEn: "Jeddah · Saudi Arabia",
    valueChf: 7_800_000,
    partners: 5,
    progress: 41,
    statusAr: "قيد الإنشاء",
    statusEn: "Under Construction",
    tagsAr: ["تصنيع", "صحة", "تصدير"],
    tagsEn: ["Manufacturing", "Health", "Export"],
  },
  {
    id: "g-03",
    track: "ground",
    power: 81,
    minRank: 3,
    titleAr: "سلسلة محلات القهوة المختصة",
    titleEn: "Specialty Coffee Retail Chain",
    summaryAr:
      "سلسلة من ستة محلات قهوة مختصة في مواقع مختارة، بنموذج تشغيل موحّد ومحمصة مركزية تخدم كل الفروع وتبيع للجملة أيضًا.",
    summaryEn:
      "Six specialty coffee outlets in curated locations, running a unified operating model with a central roastery serving all branches plus wholesale.",
    locationAr: "الرياض · جدة · الخبر",
    locationEn: "Riyadh · Jeddah · Khobar",
    valueChf: 2_650_000,
    partners: 4,
    progress: 68,
    statusAr: "تشغيل · توسّع",
    statusEn: "Operating · Scaling",
    tagsAr: ["تجزئة", "أغذية", "سلسلة"],
    tagsEn: ["Retail", "F&B", "Chain"],
  },
  {
    id: "g-04",
    track: "ground",
    power: 74,
    minRank: 3,
    titleAr: "مستودعات لوجستية مبرَّدة",
    titleEn: "Cold-Chain Logistics Hubs",
    summaryAr:
      "شبكة مستودعات مبرّدة قرب الموانئ لخدمة مستوردي الأغذية والأدوية، تُؤجَّر بالمتر المكعب مع خدمة تخليص جمركي مرافقة.",
    summaryEn:
      "A network of refrigerated warehouses near ports serving food and pharma importers, leased by cubic metre with bundled customs clearance.",
    locationAr: "الدمام · جدة",
    locationEn: "Dammam · Jeddah",
    valueChf: 5_100_000,
    partners: 3,
    progress: 55,
    statusAr: "المرحلة الثانية",
    statusEn: "Phase Two",
    tagsAr: ["لوجستيات", "تبريد", "موانئ"],
    tagsEn: ["Logistics", "Cold chain", "Ports"],
  },
  {
    id: "g-05",
    track: "ground",
    power: 66,
    minRank: 2,
    titleAr: "معرض سيارات كلاسيكية",
    titleEn: "Classic Automobile Gallery",
    summaryAr:
      "صالة عرض واقتناء للسيارات الكلاسيكية النادرة مع ورشة ترميم معتمدة، تعمل كأصل استثماري ونقطة التقاء اجتماعية للأعضاء.",
    summaryEn:
      "A rare classic-car showroom and acquisition floor with a certified restoration workshop, doubling as an investment asset and a member social node.",
    locationAr: "دبي · الإمارات",
    locationEn: "Dubai · UAE",
    valueChf: 3_400_000,
    partners: 6,
    progress: 72,
    statusAr: "مفتوح",
    statusEn: "Open",
    tagsAr: ["اقتناء", "ترميم", "أصول"],
    tagsEn: ["Collectibles", "Restoration", "Assets"],
  },
  {
    id: "g-06",
    track: "ground",
    power: 58,
    minRank: 2,
    titleAr: "مزارع صوبات ذكية",
    titleEn: "Smart Greenhouse Farms",
    summaryAr:
      "صوبات زراعية مُدارة بالاستشعار لإنتاج الخضروات الورقية على مدار العام بنسبة استهلاك مياه أقل بـ ٩٠٪ من الزراعة المكشوفة.",
    summaryEn:
      "Sensor-managed greenhouses producing leafy greens year-round at 90% less water consumption than open-field farming.",
    locationAr: "القصيم · السعودية",
    locationEn: "Qassim · Saudi Arabia",
    valueChf: 1_900_000,
    partners: 4,
    progress: 38,
    statusAr: "تجريبي",
    statusEn: "Pilot",
    tagsAr: ["زراعة", "استدامة", "تقنية"],
    tagsEn: ["Agriculture", "Sustainability", "AgTech"],
  },
  {
    id: "g-07",
    track: "ground",
    power: 49,
    minRank: 1,
    titleAr: "مركز لياقة ونادي صحي",
    titleEn: "Fitness & Wellness Club",
    summaryAr:
      "نادٍ صحي متكامل بعضويات سنوية، يضم صالات تدريب وبرامج تغذية وشراكة مع مصنع المكمّلات لتوريد المنتجات حصريًا.",
    summaryEn:
      "A full wellness club on annual memberships with training floors, nutrition programmes and an exclusive supply partnership with the supplements plant.",
    locationAr: "الرياض · السعودية",
    locationEn: "Riyadh · Saudi Arabia",
    valueChf: 1_250_000,
    partners: 3,
    progress: 60,
    statusAr: "تشغيل",
    statusEn: "Operating",
    tagsAr: ["صحة", "عضويات", "تكامل"],
    tagsEn: ["Wellness", "Memberships", "Synergy"],
  },
];

// ------------------------------------------------------------
//  مشاريع على الإنترنت
// ------------------------------------------------------------
const ONLINE: ClubProject[] = [
  {
    id: "o-01",
    track: "online",
    power: 91,
    minRank: 4,
    titleAr: "منصة بيع السيجار الفاخر",
    titleEn: "Premium Cigar Commerce Platform",
    summaryAr:
      "متجر إلكتروني متخصص في السيجار الفاخر والإكسسوارات، بعضوية مغلقة لصناديق الاشتراك الشهري وشحن مبرّد يحافظ على الرطوبة.",
    summaryEn:
      "A specialty e-commerce house for premium cigars and accessories, with a closed monthly subscription tier and humidity-controlled shipping.",
    locationAr: "رقمي · شحن عالمي",
    locationEn: "Digital · Global shipping",
    valueChf: 2_300_000,
    partners: 3,
    progress: 82,
    statusAr: "مربح",
    statusEn: "Profitable",
    tagsAr: ["تجارة إلكترونية", "اشتراكات", "فاخر"],
    tagsEn: ["E-commerce", "Subscription", "Luxury"],
  },
  {
    id: "o-02",
    track: "online",
    power: 85,
    minRank: 3,
    titleAr: "براند ملابس مستقل",
    titleEn: "Independent Apparel Brand",
    summaryAr:
      "علامة ملابس بإصدارات محدودة تُباع مباشرة للمستهلك، بتصنيع في تركيا وتسويق يعتمد على الندرة وقوائم الانتظار.",
    summaryEn:
      "A limited-drop direct-to-consumer apparel label, manufactured in Türkiye and marketed on scarcity and waitlist mechanics.",
    locationAr: "رقمي · تصنيع تركي",
    locationEn: "Digital · Turkish production",
    valueChf: 1_650_000,
    partners: 4,
    progress: 74,
    statusAr: "إصدار نشط",
    statusEn: "Drop Active",
    tagsAr: ["أزياء", "D2C", "إصدارات محدودة"],
    tagsEn: ["Fashion", "D2C", "Limited drops"],
  },
  {
    id: "o-03",
    track: "online",
    power: 77,
    minRank: 3,
    titleAr: "سوق العطور النادرة",
    titleEn: "Rare Fragrance Marketplace",
    summaryAr:
      "منصة وساطة لبيع وشراء العطور النادرة والمقتنيات العطرية بين هواة موثّقين، مع خدمة توثيق أصالة قبل الشحن.",
    summaryEn:
      "A brokerage marketplace for rare fragrances and collectible bottles between verified enthusiasts, with pre-shipment authentication.",
    locationAr: "رقمي · الخليج وأوروبا",
    locationEn: "Digital · Gulf & Europe",
    valueChf: 980_000,
    partners: 5,
    progress: 51,
    statusAr: "نمو",
    statusEn: "Growing",
    tagsAr: ["سوق", "توثيق", "مقتنيات"],
    tagsEn: ["Marketplace", "Authentication", "Collectibles"],
  },
  {
    id: "o-04",
    track: "online",
    power: 70,
    minRank: 2,
    titleAr: "أكاديمية تداول مغلقة",
    titleEn: "Closed Trading Academy",
    summaryAr:
      "برنامج تعليمي مدفوع بعضوية محدودة يغطي إدارة رأس المال وقراءة السيولة، مع غرفة تحليل مباشرة للأعضاء فقط.",
    summaryEn:
      "A paid, capacity-capped education programme covering capital management and liquidity reading, with a live members-only analysis room.",
    locationAr: "رقمي · عربي/إنجليزي",
    locationEn: "Digital · AR/EN",
    valueChf: 720_000,
    partners: 3,
    progress: 88,
    statusAr: "دفعة مكتملة",
    statusEn: "Cohort Full",
    tagsAr: ["تعليم", "عضويات", "مالي"],
    tagsEn: ["Education", "Membership", "Finance"],
  },
  {
    id: "o-05",
    track: "online",
    power: 62,
    minRank: 2,
    titleAr: "استوديو محتوى وإنتاج رقمي",
    titleEn: "Content & Digital Production Studio",
    summaryAr:
      "استوديو ينتج هوية بصرية ومحتوى تسويقي لمشاريع الأعضاء بأسعار داخلية، ويعمل مع عملاء خارجيين لتغطية تكاليفه.",
    summaryEn:
      "A studio producing brand identity and marketing content for member ventures at internal rates, taking outside clients to cover its own cost base.",
    locationAr: "رقمي · فريق موزّع",
    locationEn: "Digital · Distributed team",
    valueChf: 540_000,
    partners: 6,
    progress: 65,
    statusAr: "تشغيل",
    statusEn: "Operating",
    tagsAr: ["إبداع", "خدمات", "داخلي"],
    tagsEn: ["Creative", "Services", "Internal"],
  },
  {
    id: "o-06",
    track: "online",
    power: 54,
    minRank: 1,
    titleAr: "تطبيق حجوزات الخدمات المنزلية",
    titleEn: "Home Services Booking App",
    summaryAr:
      "تطبيق يربط مقدّمي خدمات الصيانة المنزلية بالعملاء بنموذج عمولة، مع تحقّق من هوية الفني وضمان على العمل.",
    summaryEn:
      "A commission-based app connecting home-maintenance providers with customers, featuring technician identity verification and a work guarantee.",
    locationAr: "رقمي · الخليج",
    locationEn: "Digital · Gulf region",
    valueChf: 430_000,
    partners: 4,
    progress: 44,
    statusAr: "إطلاق تجريبي",
    statusEn: "Beta Launch",
    tagsAr: ["تطبيق", "عمولة", "خدمات"],
    tagsEn: ["App", "Commission", "Services"],
  },
];

export const ALL_PROJECTS: ClubProject[] = [...PRIVATE, ...GROUND, ...ONLINE];

// ------------------------------------------------------------
//  تعريف المسارات (الجبال)
// ------------------------------------------------------------
export interface TrackMeta {
  key: ProjectTrack | "all" | "request";
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  /** أدنى رتبة للدخول */
  minRank: RankOrd;
}

export const TRACKS: TrackMeta[] = [
  {
    key: "private",
    labelAr: "مشاريع خاصة",
    labelEn: "Private Ventures",
    descAr: "محجوبة عن الرتب الصغيرة · بالتزكية فقط",
    descEn: "Shielded from lower tiers · By endorsement",
    minRank: 5,
  },
  {
    key: "ground",
    labelAr: "مشاريع على أرض الواقع",
    labelEn: "Ground Operations",
    descAr: "تصنيع · تجارة · تشارك دولي",
    descEn: "Manufacturing · Trade · Cross-border",
    minRank: 1,
  },
  {
    key: "online",
    labelAr: "مشاريع على الإنترنت",
    labelEn: "Digital Ventures",
    descAr: "تجارة إلكترونية · علامات · منصات",
    descEn: "E-commerce · Brands · Platforms",
    minRank: 1,
  },
  {
    key: "request",
    labelAr: "طلب إنشاء مشروعك الخاص",
    labelEn: "Request Your Own Venture",
    descAr: "قمة لم تكتمل بعد — اكتب اسمك عليها",
    descEn: "An unfinished summit — carve your name",
    minRank: 1,
  },
  {
    key: "all",
    labelAr: "الكل",
    labelEn: "All Tracks",
    descAr: "عرض كل ما تسمح به رتبتك",
    descEn: "Everything your rank permits",
    minRank: 1,
  },
];

/** ترتيب من الأقوى للأصغر */
export function sortByPower(list: ClubProject[]): ClubProject[] {
  return [...list].sort((a, b) => b.power - a.power);
}

/** فلترة حسب المسار والرتبة */
export function filterProjects(
  track: ProjectTrack | "all",
  rankOrd: number
): { visible: ClubProject[]; locked: ClubProject[] } {
  const pool =
    track === "all" ? ALL_PROJECTS : ALL_PROJECTS.filter((p) => p.track === track);
  const sorted = sortByPower(pool);
  return {
    visible: sorted.filter((p) => rankOrd >= p.minRank),
    locked: sorted.filter((p) => rankOrd < p.minRank),
  };
}

/** تصنيف القوة */
export function powerTier(power: number): { ar: string; en: string } {
  if (power >= 90) return { ar: "قوة قصوى", en: "Apex" };
  if (power >= 75) return { ar: "قوة عالية", en: "High" };
  if (power >= 60) return { ar: "قوة متوسطة", en: "Moderate" };
  return { ar: "قوة ناشئة", en: "Emerging" };
}
