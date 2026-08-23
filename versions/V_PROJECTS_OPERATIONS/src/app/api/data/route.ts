import { db } from "@/db";
import {
  ranks,
  members,
  projects,
  investments,
  banks,
  invoices,
  archive,
  messages,
  activityLog,
} from "@/db/schema";
import { desc } from "drizzle-orm";
import type { AppData, LogEntry } from "@/lib/types";
import { getFallbackData } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const num = (v: unknown) => (v == null ? 0 : Number(v));

export async function GET() {
  try {
    const [r, m, p, inv, b, invc, arc, msg, lg] = await Promise.all([
      db.select().from(ranks).orderBy(ranks.ord),
      db.select().from(members).orderBy(members.id),
      db.select().from(projects).orderBy(projects.id),
      db.select().from(investments).orderBy(investments.id),
      db.select().from(banks).orderBy(banks.id),
      db.select().from(invoices).orderBy(invoices.id),
      db.select().from(archive).orderBy(archive.id),
      db.select().from(messages).orderBy(messages.id),
      db.select().from(activityLog).orderBy(desc(activityLog.createdAt)),
    ]);

    if (!m || m.length === 0) {
      console.log("Database tables empty, returning fallback data");
      return Response.json(getFallbackData());
    }

    const fmtTime = (d: Date | string | null) => {
      const date = d ? new Date(d as string) : new Date();
      const diff = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
      if (diff < 60) return `قبل ${diff} دقيقة`;
      const h = Math.round(diff / 60);
      if (h < 24) return `قبل ${h} ساعة`;
      return `قبل ${Math.round(h / 24)} يوم`;
    };

    const log: LogEntry[] = lg.map((row) => ({
      id: row.id,
      action: row.action,
      section: row.section,
      detail: row.detail,
      actor: row.actor,
      time: fmtTime(row.createdAt),
    }));

    const data: AppData = {
      ranks: r.map((x) => ({
        id: x.id,
        ord: x.ord,
        name: x.name,
        holders: x.holders,
        description: x.description,
      })),
      members: m.map((x) => ({
        id: x.id,
        code: x.code,
        name: x.name,
        initials: x.initials,
        rank: x.rank,
        role: x.role ?? "",
        city: x.city ?? "",
        country: x.country ?? "",
        bio: x.bio ?? "",
        visible: x.visible,
        memberSince: x.memberSince,
      })),
      projects: p.map((x) => ({
        id: x.id,
        title: x.title,
        track: x.track,
        location: x.location ?? "",
        valueChf: num(x.valueChf),
        status: x.status,
        summary: x.summary,
        partnership: x.partnership,
        partners: x.partners,
        remaining: x.remaining,
      })),
      investments: inv.map((x) => ({
        id: x.id,
        scope: x.scope,
        type: x.type,
        title: x.title,
        status: x.status,
        valueChf: num(x.valueChf),
        change: x.change,
      })),
      banks: b.map((x) => ({
        id: x.id,
        code: x.code,
        name: x.name,
        location: x.location,
        balanceChf: num(x.balanceChf),
        files: x.files,
        status: x.status,
      })),
      invoices: invc.map((x) => ({
        id: x.id,
        title: x.title,
        category: x.category,
        amountChf: num(x.amountChf),
        status: x.status,
        date: x.date,
      })),
      archive: arc.map((x) => ({
        id: x.id,
        title: x.title,
        classification: x.classification as AppData["archive"][number]["classification"],
        custodian: x.custodian,
        pages: x.pages,
        date: x.date,
      })),
      messages: msg.map((x) => ({
        id: x.id,
        sender: x.sender,
        subject: x.subject,
        category: x.category,
        read: x.read,
        date: x.date,
        body: x.body,
      })),
      log,
    };

    return Response.json(data);
  } catch (err) {
    console.error("data route error or DB unavailable, returning fallback data:", err);
    return Response.json(getFallbackData());
  }
}
