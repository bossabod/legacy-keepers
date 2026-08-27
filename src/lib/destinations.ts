/**
 * Destination tree for the post-login hub portal.
 * Every leaf maps to a real Dashboard section (+ optional deep-link).
 */

import type { SectionKey } from "@/components/Dashboard";

export type ProjectDeepLink = "overview" | "digital" | "physical" | "submit";
export type ObservatoryDeepLink = "earth" | "sky" | "satellites" | "data";
export type ArchiveDeepLink = "all" | "files" | "records" | "years" | "locked";
export type RulesDeepLink = "rules" | "access" | "protocol";

export type DeepLink =
  | { kind: "section" }
  | { kind: "projects"; tab: ProjectDeepLink }
  | { kind: "observatory"; view: ObservatoryDeepLink }
  | { kind: "archive"; filter: ArchiveDeepLink }
  | { kind: "rules"; focus: RulesDeepLink };

export interface DestinationLeaf {
  id: string;
  labelEn: string;
  labelAr: string;
  section: SectionKey;
  deep?: DeepLink;
}

export interface DestinationNode {
  id: string;
  labelEn: string;
  labelAr: string;
  promptEn: string;
  promptAr: string;
  children: DestinationLeaf[];
}

export const DESTINATIONS: DestinationNode[] = [
  {
    id: "projects",
    labelEn: "Projects",
    labelAr: "المشاريع",
    promptEn: "What would you like to do?",
    promptAr: "ماذا تريد أن تفعل؟",
    children: [
      { id: "pj-view", labelEn: "View projects", labelAr: "مشاهدة المشاريع", section: "projects", deep: { kind: "projects", tab: "overview" } },
      { id: "pj-submit", labelEn: "Submit a project", labelAr: "إنشاء مشروع", section: "projects", deep: { kind: "projects", tab: "submit" } },
      { id: "pj-digital", labelEn: "Digital projects", labelAr: "مشاريع رقمية", section: "projects", deep: { kind: "projects", tab: "digital" } },
      { id: "pj-physical", labelEn: "Field projects", labelAr: "مشاريع ميدانية", section: "projects", deep: { kind: "projects", tab: "physical" } },
      { id: "pj-perf", labelEn: "Project performance", labelAr: "أداء المشاريع", section: "projects", deep: { kind: "projects", tab: "overview" } },
    ],
  },
  {
    id: "investments",
    labelEn: "Investments",
    labelAr: "الاستثمارات",
    promptEn: "Where do you want to look?",
    promptAr: "أين تريد أن تنظر؟",
    children: [
      { id: "inv-all", labelEn: "Full portfolio", labelAr: "المحفظة الكاملة", section: "investments" },
      { id: "inv-personal", labelEn: "Personal holdings", labelAr: "الحيازات الشخصية", section: "investments" },
      { id: "inv-club", labelEn: "Club portfolio", labelAr: "محفظة النادي", section: "investments" },
    ],
  },
  {
    id: "network",
    labelEn: "Network",
    labelAr: "الشبكة",
    promptEn: "What do you need from the network?",
    promptAr: "ماذا تحتاج من الشبكة؟",
    children: [
      { id: "net-globe", labelEn: "Command globe", labelAr: "كرة القيادة", section: "network" },
      { id: "net-nodes", labelEn: "Operational nodes", labelAr: "العقد التشغيلية", section: "network" },
      { id: "net-rotate", labelEn: "Observe the grid", labelAr: "مراقبة الشبكة", section: "network" },
    ],
  },
  {
    id: "observatory",
    labelEn: "Observatory",
    labelAr: "المرصد",
    promptEn: "What do you want to explore?",
    promptAr: "ماذا تريد أن تستكشف؟",
    children: [
      { id: "obs-sky", labelEn: "The sky", labelAr: "السماء", section: "observatory", deep: { kind: "observatory", view: "sky" } },
      { id: "obs-earth", labelEn: "The Earth", labelAr: "الأرض", section: "observatory", deep: { kind: "observatory", view: "earth" } },
      { id: "obs-sat", labelEn: "Satellites", labelAr: "الأقمار الصناعية", section: "observatory", deep: { kind: "observatory", view: "satellites" } },
      { id: "obs-data", labelEn: "Observation data", labelAr: "بيانات الرصد", section: "observatory", deep: { kind: "observatory", view: "data" } },
    ],
  },
  {
    id: "messages",
    labelEn: "Messages",
    labelAr: "الرسائل",
    promptEn: "Which channel?",
    promptAr: "أي قناة؟",
    children: [
      { id: "msg-inbox", labelEn: "Inbox", labelAr: "صندوق الوارد", section: "messages" },
      { id: "msg-compose", labelEn: "Compose", labelAr: "إنشاء رسالة", section: "messages" },
      { id: "msg-sealed", labelEn: "Sealed traffic", labelAr: "المرور المشفّر", section: "messages" },
    ],
  },
  {
    id: "archive",
    labelEn: "Archive",
    labelAr: "الأرشيف",
    promptEn: "What are you looking for?",
    promptAr: "ما الذي تبحث عنه؟",
    children: [
      { id: "arc-files", labelEn: "Files", labelAr: "الملفات", section: "archive", deep: { kind: "archive", filter: "files" } },
      { id: "arc-records", labelEn: "Records", labelAr: "السجلات", section: "archive", deep: { kind: "archive", filter: "records" } },
      { id: "arc-years", labelEn: "Years", labelAr: "السنوات", section: "archive", deep: { kind: "archive", filter: "years" } },
      { id: "arc-locked", labelEn: "Locked records", labelAr: "السجلات المقفلة", section: "archive", deep: { kind: "archive", filter: "locked" } },
    ],
  },
  {
    id: "vip",
    labelEn: "VIP / Elite",
    labelAr: "كبار الشخصيات",
    promptEn: "Which service?",
    promptAr: "أي خدمة؟",
    children: [
      { id: "vip-all", labelEn: "All services", labelAr: "كل الخدمات", section: "vip" },
      { id: "vip-request", labelEn: "Make a request", labelAr: "تقديم طلب", section: "vip" },
      { id: "vip-access", labelEn: "Access protocol", labelAr: "بروتوكول الدخول", section: "vip" },
    ],
  },
  {
    id: "ladder",
    labelEn: "Rank Ladder",
    labelAr: "سلم الأثر",
    promptEn: "What do you want to see?",
    promptAr: "ماذا تريد أن ترى؟",
    children: [
      { id: "lad-pyramid", labelEn: "Impact pyramid", labelAr: "هرم الأثر", section: "ladder" },
      { id: "lad-ranks", labelEn: "Ranks", labelAr: "الرتب", section: "ladder" },
      { id: "lad-path", labelEn: "Your path", labelAr: "مسارك", section: "ladder" },
    ],
  },
  {
    id: "rules",
    labelEn: "Rules",
    labelAr: "القواعد",
    promptEn: "What do you want to know?",
    promptAr: "ماذا تريد أن تعرف؟",
    children: [
      { id: "rul-club", labelEn: "Club rules", labelAr: "قواعد النادي", section: "rules", deep: { kind: "rules", focus: "rules" } },
      { id: "rul-access", labelEn: "Membership privileges", labelAr: "صلاحيات العضوية", section: "rules", deep: { kind: "rules", focus: "access" } },
      { id: "rul-proto", labelEn: "Protocol", labelAr: "البروتوكول", section: "rules", deep: { kind: "rules", focus: "protocol" } },
    ],
  },
  {
    id: "identity",
    labelEn: "Who we are",
    labelAr: "من نحن",
    promptEn: "What would you like to read?",
    promptAr: "ماذا تريد أن تقرأ؟",
    children: [
      { id: "id-people", labelEn: "People of Impact", labelAr: "أصحاب الأثر", section: "identity" },
      { id: "id-covenant", labelEn: "The covenant", labelAr: "الميثاق", section: "identity" },
      { id: "id-goals", labelEn: "Objectives", labelAr: "الأهداف", section: "goals" },
    ],
  },
];
