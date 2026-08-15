/* ============================================================
   invoice-data.ts — الأرشيف المالي السري لقسم الفواتير
   Confidential financial archive for the Invoices section.
   Only the current year (2026) is accessible; prior years are
   sealed in the secure archive. Invoice entries, restrictions
   and classifications are generated deterministically so the
   system stays consistent across languages.
   ============================================================ */

export type SecLevel = "PUBLIC" | "INTERNAL" | "RESTRICTED" | "CONFIDENTIAL" | "CLASSIFIED";

export interface Restriction {
  /** hide the amount value entirely */
  hideAmount: boolean;
  /** hide attachment names */
  hideAttachments: boolean;
  /** hide supplier name */
  hideSupplier: boolean;
  /** requires a password to open */
  password: boolean;
  /** requires a higher member rank */
  rankGated: boolean;
}

export interface InvoiceEntry {
  id: string;           // e.g. INV-260801
  month: string;        // "JANUARY" | ...
  title: string;
  category: string;
  date: string;         // "08 Aug 2026"
  dateISO: string;
  amountChf: number | null; // null when hidden
  status: "COMPLETED" | "PENDING" | "RESTRICTED";
  level: SecLevel;
  supplier: string | null;  // null when hidden
  restriction: Restriction;
  password: string;     // valid password (empty when not password-protected)
}

/* Realistic internal invoice categories. */
const CATEGORIES = [
  "Infrastructure",
  "Cloud Services",
  "Server Maintenance",
  "Operational Equipment",
  "Private Software License",
  "Security Audit",
  "Facility Maintenance",
  "Digital Platform",
  "Research Expenses",
  "Legal Services",
  "Strategic Acquisition",
  "Internal Development",
  "Technology Procurement",
  "Network Expansion",
  "Equipment Transportation",
  "Training Program",
  "Member Operations",
  "Administrative Costs",
];

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST"];
const MONTH_LABEL: Record<string, string> = {
  JANUARY: "Jan", FEBRUARY: "Feb", MARCH: "Mar", APRIL: "Apr",
  MAY: "May", JUNE: "Jun", JULY: "Jul", AUGUST: "Aug",
};
const MONTH_DAYS: Record<string, number> = {
  JANUARY: 31, FEBRUARY: 28, MARCH: 31, APRIL: 30, MAY: 31, JUNE: 30, JULY: 31, AUGUST: 31,
};

/* Deterministic RNG so data is stable across renders/languages. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUPPLIERS = [
  "Meridian Infrastructure Ltd", "Northgate Cloud Systems", "ForgeSecure Audits",
  "Cinder Data GmbH", "Pillar Legal Chambers", "Obsidian Software",
  "Atlas Facility Partners", "Halcyon Digital", "Vertex Research Group",
  "Sable Logistics", "Keystone Office Ops", "Argent Procurement",
];

/* Title stems (English) composed into believable invoice titles. */
const TITLE_STEM = [
  "Operational Infrastructure", "Secure Hosting Renewal", "Strategic Asset Acquisition",
  "Annual Security Audit", "Private Platform License", "Server Cluster Expansion",
  "Facility Maintenance Contract", "Digital Workspace Deployment", "Cross-border Research Grant",
  "Legal Advisory Retainer", "Data Vault Migration", "Training & Development Program",
  "Network Redundancy Upgrade", "Executive Travel & Logistics", "Internal Tools Licensing",
];

const LEVELS: SecLevel[] = ["PUBLIC", "INTERNAL", "RESTRICTED", "CONFIDENTIAL", "CLASSIFIED"];

interface Raw {
  title: string;
  category: string;
  amount: number;
  supplier: string;
  level: SecLevel;
}

function monthInvoices(seed: number, count: number): Raw[] {
  const rand = rng(seed);
  const out: Raw[] = [];
  const usedCat = new Set<string>();
  for (let i = 0; i < count; i++) {
    let cat = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    let guard = 0;
    while (usedCat.has(cat) && guard++ < 20) cat = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
    usedCat.add(cat);
    const title = TITLE_STEM[Math.floor(rand() * TITLE_STEM.length)];
    const amount = Math.round((800 + rand() * 72000) / 10) * 10;
    const supplier = SUPPLIERS[Math.floor(rand() * SUPPLIERS.length)];
    // higher-value items tend to be more classified
    const r = rand();
    const level: SecLevel =
      amount > 50000 && r > 0.5 ? LEVELS[4]
      : r > 0.62 ? LEVELS[3]
      : r > 0.38 ? LEVELS[2]
      : r > 0.16 ? LEVELS[1]
      : LEVELS[0];
    out.push({ title, category: cat, amount, supplier, level });
  }
  return out;
}

/* Month → number of invoices (3–12, natural variation). */
const MONTH_COUNTS: Record<string, number> = {
  JANUARY: 6, FEBRUARY: 9, MARCH: 4, APRIL: 12, MAY: 7, JUNE: 3, JULY: 8, AUGUST: 10,
};

function buildAll(): InvoiceEntry[] {
  const entries: InvoiceEntry[] = [];
  let counter = 1;
  MONTHS.forEach((month, mi) => {
    const count = MONTH_COUNTS[month];
    const raws = monthInvoices(0x15 + mi * 0x101, count);
    const usedDays = new Set<number>();
    const rand = rng(0x77 + mi * 0x31);
    raws.forEach((raw, i) => {
      let day = 1 + Math.floor(rand() * MONTH_DAYS[month]);
      let g = 0;
      while (usedDays.has(day) && g++ < 40) day = 1 + Math.floor(rand() * MONTH_DAYS[month]);
      usedDays.add(day);
      const id = `INV-2608${String(mi + 1).padStart(2, "0")}${String(i + 1).padStart(2, "0")}`;

      // restrictions natural distribution
      const rr = rand();
      const hideAmount = rr < 0.2 || raw.level === "CLASSIFIED";
      const hideAttachments = rr > 0.5 && rr < 0.82;
      const hideSupplier = rr > 0.72;
      const password = rr > 0.85 || raw.level === "CLASSIFIED";
      const rankGated = raw.level === "RESTRICTED" && rr > 0.5;

      const status: InvoiceEntry["status"] =
        raw.level === "CLASSIFIED" || password ? "RESTRICTED"
        : rr < 0.72 ? "COMPLETED"
        : "PENDING";

      entries.push({
        id,
        month,
        title: raw.title,
        category: raw.category,
        date: `${String(day).padStart(2, "0")} ${MONTH_LABEL[month]} 2026`,
        dateISO: `2026-${String(mi + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        amountChf: hideAmount ? null : raw.amount,
        status,
        level: raw.level,
        supplier: hideSupplier ? null : raw.supplier,
        restriction: { hideAmount, hideAttachments, hideSupplier, password, rankGated },
        password: password ? "OOI" : "",
      });
      counter++;
    });
  });
  return entries;
}

export const INVOICES: InvoiceEntry[] = buildAll();

export const INVOICE_YEARS = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013,
];
export const OPEN_YEAR = 2026;
export const ACCESSIBLE_MONTHS = MONTHS;

export function invoicesForMonth(month: string): InvoiceEntry[] {
  return INVOICES.filter((i) => i.month === month);
}

/* Stable internal metadata generators. */
export function verificationHash(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `0x${h.toString(16).toUpperCase().padStart(8, "0")}`;
}

export const ROUTING = [
  "FIN/GVA/01", "FIN/GVA/02", "FIN/ZRH/01", "FIN/DXB/01", "FIN/RIY/01", "FIN/LON/01",
];

export const DIVISIONS = [
  "Operations", "Technology", "Security", "Legal", "Research", "Treasury", "Acquisitions",
];

export const APPROVERS = [
  "A. Al-Selim", "R. Al-Harbi", "K. Mansour", "D. Okafor", "L. Moreau", "S. Bahrani",
];

export const PAY_METHODS = [
  "SEPA Transfer", "SWIFT", "Private Ledger", "Escrow Release", "Wire (CHF)", "Internal Settlement",
];
