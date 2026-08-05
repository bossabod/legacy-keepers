/* ============================================================
   archive-2026.ts

   لقطات أرشيف مشاريع ٢٠٢٦ شهراً بشهر.

   كل شهر لقطة مستقلة: بعض المشاريع تتقدّم، ومشاريع جديدة تدخل،
   وبعضها يكتمل. المصدر الوحيد للحقيقة هو `TIMELINE` أدناه.
   ============================================================ */

export type MonthKey =
  | "JANUARY"
  | "FEBRUARY"
  | "MARCH"
  | "APRIL"
  | "MAY"
  | "JUNE"
  | "JULY"
  | "AUGUST";

export const MONTHS: MonthKey[] = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
];

/** الأشهر المتبقية من السنة — تُعرض خافتة بوسم UPCOMING. */
export const UPCOMING: string[] = ["SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

/** الشهر الجاري. */
export const CURRENT_MONTH: MonthKey = "AUGUST";

export interface ProjectMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  /** الشهر الذي دخل فيه المشروع الأرشيف */
  started: MonthKey;
}

/** سجلّ المشاريع — يُعرَّف مرة واحدة. */
export const PROJECTS: Record<string, ProjectMeta> = {
  NORTHLINE: {
    id: "PRJ-2601",
    name: "NORTHLINE",
    category: "Digital Infrastructure",
    description:
      "Private digital infrastructure and operational management platform.",
    started: "JANUARY",
  },
  ATLAS: {
    id: "PRJ-2602",
    name: "ATLAS",
    category: "Logistics",
    description: "Development of an internal logistics coordination network.",
    started: "JANUARY",
  },
  MONOLITH: {
    id: "PRJ-2603",
    name: "MONOLITH",
    category: "Technology",
    description: "Secure data and information management architecture.",
    started: "FEBRUARY",
  },
  VANTA: {
    id: "PRJ-2604",
    name: "VANTA",
    category: "Digital Commerce",
    description: "Private digital commerce infrastructure.",
    started: "MARCH",
  },
  "GRID 17": {
    id: "PRJ-2605",
    name: "GRID 17",
    category: "Infrastructure",
    description: "Distributed operational infrastructure project.",
    started: "MARCH",
  },
  ORBIT: {
    id: "PRJ-2606",
    name: "ORBIT",
    category: "Technology",
    description: "Automated project monitoring and intelligence system.",
    started: "APRIL",
  },
  BLACKSTONE: {
    id: "PRJ-2607",
    name: "BLACKSTONE",
    category: "Physical Infrastructure",
    description: "Development of a private physical operating location.",
    started: "MAY",
  },
  "NODE 06": {
    id: "PRJ-2608",
    name: "NODE 06",
    category: "Digital Network",
    description: "Expansion of the club's internal digital network.",
    started: "MAY",
  },
  APEX: {
    id: "PRJ-2609",
    name: "APEX",
    category: "Research",
    description: "Research and evaluation of emerging commercial opportunities.",
    started: "JUNE",
  },
  ECHO: {
    id: "PRJ-2610",
    name: "ECHO",
    category: "Communications",
    description: "Private communications and member coordination system.",
    started: "JULY",
  },
  VECTOR: {
    id: "PRJ-2611",
    name: "VECTOR",
    category: "Technology",
    description: "Analytical system for monitoring project performance.",
    started: "JULY",
  },
  ZERO: {
    id: "PRJ-2612",
    name: "ZERO",
    category: "Experimental",
    description: "Confidential experimental initiative currently under development.",
    started: "AUGUST",
  },
};

/** نسب الاكتمال لكل شهر. */
const TIMELINE: Record<MonthKey, Record<string, number>> = {
  JANUARY: { NORTHLINE: 12, ATLAS: 8 },
  FEBRUARY: { NORTHLINE: 21, ATLAS: 17, MONOLITH: 6 },
  MARCH: { NORTHLINE: 34, ATLAS: 29, MONOLITH: 18, VANTA: 9, "GRID 17": 5 },
  APRIL: {
    NORTHLINE: 48,
    ATLAS: 41,
    MONOLITH: 31,
    VANTA: 22,
    "GRID 17": 16,
    ORBIT: 7,
  },
  MAY: {
    NORTHLINE: 63,
    ATLAS: 55,
    MONOLITH: 44,
    VANTA: 38,
    "GRID 17": 29,
    ORBIT: 19,
    BLACKSTONE: 11,
    "NODE 06": 8,
  },
  JUNE: {
    NORTHLINE: 79,
    ATLAS: 68,
    MONOLITH: 57,
    VANTA: 49,
    "GRID 17": 43,
    ORBIT: 32,
    BLACKSTONE: 24,
    "NODE 06": 19,
    APEX: 10,
  },
  JULY: {
    NORTHLINE: 94,
    ATLAS: 82,
    MONOLITH: 73,
    VANTA: 61,
    "GRID 17": 55,
    ORBIT: 48,
    BLACKSTONE: 39,
    "NODE 06": 33,
    APEX: 21,
    ECHO: 12,
    VECTOR: 7,
  },
  AUGUST: {
    NORTHLINE: 100,
    ATLAS: 93,
    MONOLITH: 86,
    VANTA: 76,
    "GRID 17": 69,
    ORBIT: 61,
    BLACKSTONE: 53,
    "NODE 06": 47,
    APEX: 38,
    ECHO: 27,
    VECTOR: 18,
    ZERO: 4,
  },
};

export interface Snapshot extends ProjectMeta {
  completion: number;
  status: "COMPLETED" | "ACTIVE";
  /** دخل هذا الشهر */
  isNew: boolean;
}

/** لقطة شهر واحد، مرتّبة من الأعلى اكتمالاً للأدنى. */
export function snapshot(month: MonthKey): Snapshot[] {
  const rows = TIMELINE[month];
  return Object.entries(rows)
    .map(([key, completion]) => {
      const meta = PROJECTS[key];
      return {
        ...meta,
        completion,
        status: completion >= 100 ? ("COMPLETED" as const) : ("ACTIVE" as const),
        isNew: meta.started === month,
      };
    })
    .sort((a, b) => b.completion - a.completion);
}

/** إحصاء الشهر. */
export function tally(month: MonthKey) {
  const rows = snapshot(month);
  return {
    active: rows.filter((r) => r.status === "ACTIVE").length,
    completed: rows.filter((r) => r.status === "COMPLETED").length,
    archived: 0,
  };
}

/** السنوات المعروضة في الشريط الجانبي. */
export const YEARS = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014,
  2013,
] as const;

export const OPEN_YEAR = 2026;
