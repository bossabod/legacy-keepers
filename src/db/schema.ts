import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// سلم الأثر — رتب النادي
export const ranks = pgTable("ranks", {
  id: serial("id").primaryKey(),
  ord: integer("ord").notNull(),
  name: text("name").notNull(),
  holders: integer("holders").notNull(),
  description: text("description").notNull(),
});

// الأعضاء — ٧٧
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  rank: text("rank").notNull(),
  role: text("role"),
  city: text("city"),
  country: text("country"),
  bio: text("bio"),
  visible: boolean("visible").notNull().default(true),
  memberSince: integer("member_since").notNull(),
});

// المشاريع
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  track: text("track").notNull(), // land | electronic | partner | build
  location: text("location"),
  valueChf: numeric("value_chf", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull(),
  summary: text("summary").notNull(),
  partnership: integer("partnership").notNull(),
  partners: integer("partners").notNull(),
  remaining: integer("remaining").notNull(),
});

// الاستثمارات
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  scope: text("scope").notNull(), // personal | club
  type: text("type").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull(),
  valueChf: numeric("value_chf", { precision: 14, scale: 2 }).notNull(),
  change: real("change").notNull(),
});

// الخزانة البنكية
export const banks = pgTable("banks", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  balanceChf: numeric("balance_chf", { precision: 16, scale: 2 }).notNull(),
  files: integer("files").notNull(),
  status: text("status").notNull(),
});

// الفواتير
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  amountChf: numeric("amount_chf", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull(),
  date: text("date").notNull(),
});

// الأرشيف
export const archive = pgTable("archive", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  classification: text("classification").notNull(),
  custodian: text("custodian").notNull(),
  pages: integer("pages").notNull(),
  date: text("date").notNull(),
});

// الرسائل
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sender: text("sender").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  read: boolean("read").notNull().default(false),
  date: text("date").notNull(),
  body: text("body").notNull(),
});

// سجل المراقبة
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  section: text("section").notNull(),
  detail: text("detail").notNull(),
  actor: text("actor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
