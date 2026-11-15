/* ============================================================
   archive-registry.ts — قاعدة بيانات الأرشيف الداخلي.

   البنية هرمية:
     VAULTS → YEARS → MONTHS → RECORDS → RECORD DETAIL

   وحدة واحدة فقط مفتوحة (أرشيف المشاريع)؛ الباقي يتطلّب
   كلمة مرور الأرشيف.
   ============================================================ */

export type VaultKey =
  | "projects"
  | "operations"
  | "members"
  | "research"
  | "internal"
  | "restricted"
  | "classified";

export interface Vault {
  key: VaultKey;
  codeEn: string;
  codeAr: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  /** عدد السجلّات المفهرسة */
  volume: number;
  locked: boolean;
  /** تصنيف الحساسية */
  gradeEn: string;
  gradeAr: string;
}

export const VAULTS: Vault[] = [
  {
    key: "projects",
    codeEn: "ARC-P",
    codeAr: "ARC-P",
    titleEn: "Project Archive",
    titleAr: "أرشيف المشاريع",
    descEn: "Complete record of every venture undertaken by the circle.",
    descAr: "سجلّ كامل لكل مشروع تولّته الدائرة.",
    volume: 412,
    locked: false,
    gradeEn: "Internal",
    gradeAr: "داخلي",
  },
  {
    key: "operations",
    codeEn: "ARC-O",
    codeAr: "ARC-O",
    titleEn: "Operations Archive",
    titleAr: "أرشيف العمليات",
    descEn: "Field operations, logistics corridors and settlement records.",
    descAr: "العمليات الميدانية وممرّات الشحن وسجلّات التسوية.",
    volume: 268,
    locked: true,
    gradeEn: "Restricted",
    gradeAr: "محدود",
  },
  {
    key: "members",
    codeEn: "ARC-M",
    codeAr: "ARC-M",
    titleEn: "Members Archive",
    titleAr: "أرشيف الأعضاء",
    descEn: "Standing, sponsorship chains and covenant signatures.",
    descAr: "المكانة وسلاسل التزكية وتواقيع الميثاق.",
    volume: 77,
    locked: true,
    gradeEn: "Confidential",
    gradeAr: "سرّي",
  },
  {
    key: "research",
    codeEn: "ARC-R",
    codeAr: "ARC-R",
    titleEn: "Research Archive",
    titleAr: "أرشيف الأبحاث",
    descEn: "Market studies and opportunity assessments held in reserve.",
    descAr: "دراسات السوق وتقييمات الفرص المحفوظة احتياطاً.",
    volume: 143,
    locked: true,
    gradeEn: "Restricted",
    gradeAr: "محدود",
  },
  {
    key: "internal",
    codeEn: "ARC-I",
    codeAr: "ARC-I",
    titleEn: "Internal Records",
    titleAr: "السجلّات الداخلية",
    descEn: "Assembly minutes, rulings and amendments to the covenant.",
    descAr: "محاضر الجلسات والأحكام وتعديلات الميثاق.",
    volume: 331,
    locked: true,
    gradeEn: "Confidential",
    gradeAr: "سرّي",
  },
  {
    key: "restricted",
    codeEn: "ARC-X",
    codeAr: "ARC-X",
    titleEn: "Restricted Files",
    titleAr: "الملفّات المقيّدة",
    descEn: "Sealed by ruling of the covenant council.",
    descAr: "مختومة بقرار من مجلس الميثاق.",
    volume: 58,
    locked: true,
    gradeEn: "Sealed",
    gradeAr: "مختوم",
  },
  {
    key: "classified",
    codeEn: "ARC-Z",
    codeAr: "ARC-Z",
    titleEn: "Classified Archive",
    titleAr: "الأرشيف المحجوب",
    descEn: "Access limited to the pillars. No index is published.",
    descAr: "الوصول للأعمدة فقط. لا يُنشر لها فهرس.",
    volume: 19,
    locked: true,
    gradeEn: "Pillars Only",
    gradeAr: "للأعمدة فقط",
  },
];

/* ------------------------------------------------------------------ */
/*  السنوات والأشهر                                                    */
/* ------------------------------------------------------------------ */

export const ARCHIVE_YEARS = [2026, 2025, 2024, 2023] as const;

export const MONTH_KEYS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
] as const;

export type MonthName = (typeof MONTH_KEYS)[number];

/** آخر شهر فيه سجلّات لكل سنة (٢٠٢٦ جارية). */
const LAST_ACTIVE: Record<number, number> = {
  2026: 8,
  2025: 12,
  2024: 12,
  2023: 12,
};

export function monthHasRecords(year: number, monthIndex: number) {
  return monthIndex < LAST_ACTIVE[year];
}

/* ------------------------------------------------------------------ */
/*  السجلّات                                                           */
/* ------------------------------------------------------------------ */

export interface ArchiveRecord {
  /** ARC-P/2026/08/004 */
  ref: string;
  seq: number;
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  gradeEn: string;
  gradeAr: string;
  custodianEn: string;
  custodianAr: string;
  pages: number;
  /** ملخّص السجلّ */
  abstractEn: string;
  abstractAr: string;
  /** بنود السجلّ */
  entriesEn: string[];
  entriesAr: string[];
  /** سلسلة الحيازة */
  chainEn: { stamp: string; text: string }[];
  chainAr: { stamp: string; text: string }[];
  statusEn: string;
  statusAr: string;
  hash: string;
}

/* مولّد حتمي: نفس البذرة ⇒ نفس السجلّ في كل تحميل */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUBJECTS: [string, string, string, string][] = [
  ["Venture Commissioning Report", "تقرير تشغيل مشروع", "Commissioning", "تشغيل"],
  ["Capital Deployment Schedule", "جدول ضخّ رأس المال", "Capital", "رأس مال"],
  ["Partner Vetting Dossier", "ملف توثيق شريك", "Vetting", "توثيق"],
  ["Corridor Clearance Certificate", "شهادة تخليص ممرّ", "Logistics", "لوجستيات"],
  ["Entity Structure Opinion", "رأي في هيكل الكيانات", "Legal", "قانوني"],
  ["Quarterly Position Statement", "بيان الوضع الفصلي", "Reporting", "تقارير"],
  ["Acquisition Closing Memorandum", "مذكّرة إغلاق استحواذ", "Acquisition", "استحواذ"],
  ["Facility Certification Record", "سجلّ اعتماد منشأة", "Certification", "اعتماد"],
  ["Provider Network Audit", "تدقيق شبكة المزوّدين", "Audit", "تدقيق"],
  ["Signal Engine Backtest", "اختبار رجعي لمحرّك الإشارات", "Analysis", "تحليل"],
  ["Membership Sponsorship File", "ملف تزكية عضوية", "Sponsorship", "تزكية"],
  ["Assembly Resolution", "قرار جلسة", "Governance", "حوكمة"],
];

const GRADES: [string, string][] = [
  ["Internal", "داخلي"],
  ["Restricted", "محدود"],
  ["Confidential", "سرّي"],
  ["Sealed", "مختوم"],
];

const CUSTODIANS: [string, string][] = [
  ["A. Al-Selim", "أ. السليم"],
  ["R. Al-Harbi", "ر. الحربي"],
  ["L. Nasser", "ل. ناصر"],
  ["F. Al-Dosari", "ف. الدوسري"],
  ["M. Al-Otaibi", "م. العتيبي"],
  ["K. Al-Ghamdi", "ك. الغامدي"],
  ["Office of the Covenant", "مكتب الميثاق"],
];

const STATUSES: [string, string][] = [
  ["Filed", "مُودَع"],
  ["Sealed", "مختوم"],
  ["Under Review", "قيد المراجعة"],
  ["Superseded", "مُستبدَل"],
];

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0");
}

/** سجلّات شهر بعينه — مولّدة حتمياً من السنة والشهر. */
export function recordsFor(year: number, monthIndex: number): ArchiveRecord[] {
  if (!monthHasRecords(year, monthIndex)) return [];

  const seed = year * 100 + monthIndex;
  const rand = rng(seed);
  /* من ٢ إلى ٦ سجلّات في الشهر */
  const count = 2 + Math.floor(rand() * 5);

  return Array.from({ length: count }, (_, i) => {
    const s = SUBJECTS[Math.floor(rand() * SUBJECTS.length)];
    const g = GRADES[Math.floor(rand() * GRADES.length)];
    const c = CUSTODIANS[Math.floor(rand() * CUSTODIANS.length)];
    const st = STATUSES[Math.floor(rand() * STATUSES.length)];
    const seq = i + 1;
    const mm = pad(monthIndex + 1);
    const ref = `ARC-P/${year}/${mm}/${pad(seq, 3)}`;
    const pages = 4 + Math.floor(rand() * 60);
    const day = 1 + Math.floor(rand() * 27);
    const hash = Array.from({ length: 8 }, () =>
      "0123456789ABCDEF"[Math.floor(rand() * 16)]
    ).join("");

    return {
      ref,
      seq,
      titleEn: s[0],
      titleAr: s[1],
      categoryEn: s[2],
      categoryAr: s[3],
      gradeEn: g[0],
      gradeAr: g[1],
      custodianEn: c[0],
      custodianAr: c[1],
      pages,
      statusEn: st[0],
      statusAr: st[1],
      hash,
      abstractEn:
        `Record filed under ${MONTH_KEYS[monthIndex].toLowerCase()} ${year}. ` +
        `Held by the office of the custodian and indexed against the venture register. ` +
        `Contents are summarised below; the full body remains in the sealed volume.`,
      abstractAr:
        `سجلّ مُودَع في ${monthAr(monthIndex)} ${year}. ` +
        `محفوظ لدى مكتب الأمين ومفهرس مقابل سجلّ المشاريع. ` +
        `المحتوى ملخّص أدناه، والمتن الكامل يبقى في المجلّد المختوم.`,
      entriesEn: [
        `Instrument executed on ${pad(day)} ${MONTH_KEYS[monthIndex].slice(0, 3)} ${year}`,
        `Counterparty verification completed by the custodian`,
        `Filed against the venture register without objection`,
        `Retention: permanent — circle custody`,
      ],
      entriesAr: [
        `نُفِّذ السند في ${pad(day)} ${monthAr(monthIndex)} ${year}`,
        `اكتمل التحقّق من الطرف المقابل لدى الأمين`,
        `أُودِع مقابل سجلّ المشاريع دون اعتراض`,
        `مدّة الحفظ: دائمة — في عهدة الدائرة`,
      ],
      chainEn: [
        { stamp: `${pad(day)} ${MONTH_KEYS[monthIndex].slice(0, 3)} ${year}`, text: `Lodged by ${c[0]}` },
        { stamp: `${pad(Math.min(28, day + 3))} ${MONTH_KEYS[monthIndex].slice(0, 3)} ${year}`, text: "Verified against the venture register" },
        { stamp: `${pad(Math.min(28, day + 9))} ${MONTH_KEYS[monthIndex].slice(0, 3)} ${year}`, text: `Grade set to ${g[0]}` },
      ],
      chainAr: [
        { stamp: `${pad(day)} ${monthAr(monthIndex)} ${year}`, text: `أودعه ${c[1]}` },
        { stamp: `${pad(Math.min(28, day + 3))} ${monthAr(monthIndex)} ${year}`, text: "تمّ التحقّق مقابل سجلّ المشاريع" },
        { stamp: `${pad(Math.min(28, day + 9))} ${monthAr(monthIndex)} ${year}`, text: `حُدِّد التصنيف: ${g[1]}` },
      ],
    };
  });
}

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function monthAr(i: number) {
  return MONTHS_AR[i];
}

/** عدد سجلّات السنة كاملة. */
export function yearVolume(year: number) {
  let n = 0;
  for (let m = 0; m < 12; m++) n += recordsFor(year, m).length;
  return n;
}

/** كلمة مرور الأرشيف للوحدات المقفلة. */
export const ARCHIVE_PASSWORD = "COVENANT";
