"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Pin, Lock, Users, Mail, Radio, ArrowLeft, ArrowRight, X,
} from "lucide-react";
import Sigil from "@/components/messages/Sigil";
import Compose, { RankTag } from "@/components/messages/Compose";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";
import { play } from "@/lib/sound";
import {
  REGISTRY, FILTERS, applyFilter, order, counters, isOfficial, OPERATOR,
  type Entry, type FilterKey, type Channel, type Priority, type Turn,
} from "@/lib/comms";
import type { AppData } from "@/lib/types";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

type View =
  | { kind: "hub" }
  | { kind: "compose"; channel: Exclude<Channel, "administration"> }
  | { kind: "thread"; id: string };

export default function MessagesSection(_props: { data: AppData }) {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [log, setLog] = useState<Entry[]>(REGISTRY);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ kind: "hub" });

  /* نتتبّع عرض النافذة لتثبيت تقسيم 70/30 بدقّة */
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const stats = useMemo(() => counters(log), [log]);

  const visible = useMemo(() => {
    let list = applyFilter(log, filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) =>
        [
          ar ? e.subjectAr : e.subjectEn,
          ar ? e.from.nameAr : e.from.nameEn,
          e.from.sigil,
          e.id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return order(list);
  }, [log, filter, query, ar]);

  const active = view.kind === "thread" ? log.find((e) => e.id === view.id) : null;

  const openThread = (e: Entry) => {
    setLog((prev) => prev.map((x) => (x.id === e.id ? { ...x, read: true } : x)));
    setView({ kind: "thread", id: e.id });
    play("open");
  };

  const reply = (id: string, text: string) => {
    setLog((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              thread: [
                ...e.thread,
                {
                  id: `t${e.thread.length + 1}`,
                  mine: true,
                  stamp: t("ms.justNow", lang),
                  textEn: text,
                  textAr: text,
                  delivery: "SENT" as const,
                },
              ],
            }
          : e
      )
    );
  };

  /* إدخال رسالة مُرسَلة في السجلّ */
  const record = (p: {
    channel: Channel;
    to: string;
    subject: string;
    priority: Priority;
    body: string;
    recipients?: number;
  }) => {
    const entry: Entry = {
      id: `MSG-${Math.floor(1000 + log.length * 7)}`,
      channel: p.channel,
      from: OPERATOR,
      subjectEn: p.subject,
      subjectAr: p.subject,
      previewEn: p.body.slice(0, 90),
      previewAr: p.body.slice(0, 90),
      stamp: t("ms.justNow", lang),
      priority: p.priority,
      read: true,
      outbound: true,
      archived: false,
      recipients: p.recipients,
      thread: [
        {
          id: "t1",
          mine: true,
          stamp: t("ms.justNow", lang),
          textEn: p.body,
          textAr: p.body,
          delivery: "SENT",
        },
      ],
    };
    setLog((prev) => [entry, ...prev]);
  };

  return (
    <div className="w-full" dir={ar ? "rtl" : "ltr"}>
      {/* ═══════ الترويسة والعدّادات ═══════ */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <p
            className="text-[0.46rem] uppercase tracking-[0.3em] text-[#5d6675]"
            style={{ fontFamily: MONO }}
          >
            {t("ms.eyebrow", lang)}
          </p>
          <h2
            className="mt-1.5 text-[clamp(1.15rem,2.6vw,1.6rem)] font-light uppercase tracking-[0.22em] text-[#eaeef5]"
            style={{ fontFamily: LUX }}
          >
            {t("nav.messages", lang)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Counter label={t("ms.unread", lang)} value={stats.unread} alert />
          <Counter label={t("ms.official", lang)} value={stats.official} />
          <Counter label={t("ms.archived", lang)} value={stats.archived} muted />
        </div>
      </header>

      {/* ═══════ 70 / 30 ═══════ */}
      <div
        style={{
          display: "grid",
          gap: "1.25rem",
          alignItems: "start",
          // 70 / 30 على الشاشات الواسعة، وعمود واحد على الضيقة
          gridTemplateColumns: wide ? "70fr 30fr" : "1fr",
        }}
      >
        {/* ---------- المساحة الرئيسية ---------- */}
        <main className="min-w-0">
          <AnimatePresence mode="wait">
            {view.kind === "hub" && (
              <Hub key="hub" onPick={(c) => setView({ kind: "compose", channel: c })} />
            )}

            {view.kind === "compose" && (
              <Compose
                key={`c-${view.channel}`}
                channel={view.channel}
                onBack={() => setView({ kind: "hub" })}
                onSend={record}
              />
            )}

            {view.kind === "thread" && active && (
              <Thread
                key={active.id}
                e={active}
                onClose={() => setView({ kind: "hub" })}
                onReply={(txt) => reply(active.id, txt)}
              />
            )}
          </AnimatePresence>
        </main>

        {/* ---------- السجلّ الجانبي ---------- */}
        <aside
          className="min-w-0 self-start rounded-xl border border-white/[0.06]"
          style={{ background: "#0a0b0d" }}
        >
          {/* بحث */}
          <div className="border-b border-white/[0.05] p-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/45 px-2.5 py-1.5">
              <Search size={11} className="shrink-0 text-[#5d6675]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("ms.search", lang)}
                className="w-full bg-transparent text-[0.68rem] text-[#dfe4ec] outline-none placeholder:text-[#4d545f]"
              />
            </div>
          </div>

          {/* فلاتر */}
          <div className="flex flex-wrap gap-1 border-b border-white/[0.05] p-2.5">
            {FILTERS.map((f) => {
              const on = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={[
                    "rounded-md px-2 py-1 text-[0.48rem] uppercase tracking-[0.14em] transition-all duration-300",
                    on
                      ? "bg-white/[0.09] text-white"
                      : "text-[#646c7a] hover:bg-white/[0.04] hover:text-[#c3ccd9]",
                  ].join(" ")}
                  style={{
                    fontFamily: MONO,
                    boxShadow: on ? "inset 0 0 0 1px rgba(255,255,255,0.14)" : undefined,
                  }}
                >
                  {t(`ms.f.${f}`, lang)}
                </button>
              );
            })}
          </div>

          {/* السجلّ */}
          <div className="max-h-[62vh] overflow-y-auto">
            {visible.map((e, i) => (
              <Row
                key={e.id}
                e={e}
                index={i}
                selected={view.kind === "thread" && view.id === e.id}
                onOpen={() => openThread(e)}
              />
            ))}

            {visible.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p
                  className="text-[0.55rem] uppercase tracking-[0.2em] text-[#4b525f]"
                  style={{ fontFamily: MONO }}
                >
                  {t("ms.empty", lang)}
                </p>
              </div>
            )}
          </div>

          <div
            className="border-t border-white/[0.05] px-3 py-2 text-[0.42rem] uppercase tracking-[0.18em] text-[#454c59]"
            style={{ fontFamily: MONO }}
          >
            {visible.length} {t("ms.entries", lang)}
          </div>
        </aside>
      </div>

    </div>
  );
}

/* ================= مركز الإرسال ================= */

function Hub({ onPick }: { onPick: (c: Exclude<Channel, "administration">) => void }) {
  const { lang } = useApp();
  const cards = [
    { c: "direct" as const, icon: Radio, title: t("ms.internal", lang), desc: t("ms.internalDesc", lang) },
    { c: "mail" as const, icon: Mail, title: t("ms.mail", lang), desc: t("ms.mailDesc", lang) },
    { c: "group" as const, icon: Users, title: t("ms.group", lang), desc: t("ms.groupDesc", lang) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-5">
        <h3
          className="text-[0.98rem] uppercase tracking-[0.22em] text-[#eaeef5]"
          style={{ fontFamily: LUX }}
        >
          {t("ms.centre", lang)}
        </h3>
        <p className="mt-1.5 text-[0.72rem] text-[#7f8896]">{t("ms.centreDesc", lang)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((x, i) => (
          <motion.button
            key={x.c}
            type="button"
            onClick={() => { onPick(x.c); play("open"); }}
            onMouseEnter={() => play("hover")}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 text-start transition-colors duration-400 hover:border-white/[0.22]"
            style={{
              background:
                "linear-gradient(158deg, rgba(16,19,26,0.92) 0%, rgba(8,10,14,0.96) 100%)",
              minHeight: 168,
            }}
          >
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(90% 70% at 50% 0%, rgba(255,255,255,0.06), transparent 70%)",
              }}
            />
            <x.icon size={15} className="relative text-[#8e97a5]" />
            <h4
              className="relative mt-4 text-[0.85rem] uppercase tracking-[0.16em] text-[#eaeef5] transition-colors group-hover:text-white"
              style={{ fontFamily: LUX }}
            >
              {x.title}
            </h4>
            <p className="relative mt-2 text-[0.68rem] leading-relaxed text-[#7f8896]">
              {x.desc}
            </p>
            <span
              className="relative mt-4 block h-px w-8 bg-white/25 transition-all duration-500 group-hover:w-16 group-hover:bg-white/60"
            />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ================= المحادثة — أسلوب طرفية ================= */

function Thread({
  e,
  onClose,
  onReply,
}: {
  e: Entry;
  onClose: () => void;
  onReply: (text: string) => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const Back = ar ? ArrowRight : ArrowLeft;
  const [draft, setDraft] = useState("");
  const admin = e.channel === "administration";

  return (
    <motion.div
      initial={{ opacity: 0.55 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: admin ? "rgba(196,72,72,0.34)" : "rgba(255,255,255,0.14)",
        background:
          "linear-gradient(178deg, #131720 0%, #0b0e14 100%)",
        boxShadow: admin
          ? "0 0 40px rgba(196,72,72,0.09) inset, 0 20px 50px rgba(0,0,0,0.6)"
          : "0 20px 50px rgba(0,0,0,0.55)",
      }}
    >
      {/* ترويسة القناة */}
      <header
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{
          borderColor: admin ? "rgba(196,72,72,0.20)" : "rgba(255,255,255,0.06)",
          background: admin ? "rgba(196,72,72,0.05)" : "rgba(255,255,255,0.012)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-white/[0.08] p-1.5 text-[#6d7684] transition-colors hover:border-white/25 hover:text-white"
        >
          <Back size={12} />
        </button>

        <Sigil sigil={e.from.sigil} tier={e.from.tier} admin={admin} size={34} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[0.8rem] text-[#eaeef5]">
              {ar ? e.from.nameAr : e.from.nameEn}
            </span>
            <RankTag tier={e.from.tier} label={ar ? e.from.rankAr : e.from.rankEn} />
          </div>
          <div
            className="mt-0.5 text-[0.46rem] uppercase tracking-[0.16em] text-[#5f6875]"
            style={{ fontFamily: MONO }}
          >
            {e.from.sigil} · {e.id} · {t(`ms.ch.${e.channel}`, lang)}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-white/[0.08] p-1.5 text-[#6d7684] transition-colors hover:border-white/25 hover:text-white"
        >
          <X size={12} />
        </button>
      </header>

      {/* عنوان الموضوع */}
      <div className="border-b border-white/[0.05] px-4 py-2.5">
        <span
          className="text-[0.78rem] uppercase tracking-[0.12em] text-[#eaeef5]"
          style={{ fontFamily: LUX }}
        >
          {ar ? e.subjectAr : e.subjectEn}
        </span>
      </div>

      {/* المجرى — سطور طرفية لا فقاعات */}
      <div className="max-h-[46vh] space-y-4 overflow-y-auto px-4 py-5">
        {e.thread.map((m) => (
          <TurnLine key={m.id} m={m} admin={admin} />
        ))}
      </div>

      {/* الردّ */}
      {!admin && (
        <div className="flex items-center gap-2 border-t border-white/[0.06] p-3">
          <span
            className="shrink-0 text-[0.6rem] text-[#4b525f]"
            style={{ fontFamily: MONO }}
          >
            {ar ? "<<" : ">>"}
          </span>
          <input
            value={draft}
            onChange={(x) => setDraft(x.target.value)}
            onKeyDown={(x) => {
              if (x.key === "Enter" && draft.trim()) {
                onReply(draft.trim());
                setDraft("");
                play("granted");
              }
            }}
            placeholder={t("ms.compose", lang)}
            className="w-full bg-transparent text-[0.74rem] text-[#eaeef5] outline-none placeholder:text-[#4b525f]"
            style={{ fontFamily: MONO }}
          />
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => {
              if (!draft.trim()) return;
              onReply(draft.trim());
              setDraft("");
              play("granted");
            }}
            className={[
              "shrink-0 rounded-md px-3 py-1.5 text-[0.5rem] uppercase tracking-[0.18em] transition-all duration-300",
              draft.trim()
                ? "border border-white/20 text-white hover:border-white/40"
                : "border border-white/[0.06] text-[#3f4550]",
            ].join(" ")}
            style={{ fontFamily: MONO }}
          >
            {t("ms.send", lang)}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function TurnLine({ m, admin }: { m: Turn; admin: boolean }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="border-s-2 ps-3.5"
      style={{
        borderColor: m.mine
          ? "rgba(255,255,255,0.22)"
          : admin
          ? "rgba(196,72,72,0.45)"
          : "rgba(255,255,255,0.09)",
      }}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2.5">
        <span
          className="text-[0.44rem] uppercase tracking-[0.16em]"
          style={{ fontFamily: MONO, color: m.mine ? "#8e97a5" : admin ? "#b98a8a" : "#6d7684" }}
        >
          {m.mine ? t("ms.you", lang) : t("ms.them", lang)}
        </span>
        <span
          className="text-[0.42rem] tracking-[0.14em] text-[#4b525f]"
          style={{ fontFamily: MONO }}
        >
          {m.stamp}
        </span>
        {m.mine && (
          <span
            className="rounded-sm border border-white/[0.10] px-1.5 py-px text-[0.38rem] uppercase tracking-[0.14em] text-[#6d7684]"
            style={{ fontFamily: MONO }}
          >
            {m.delivery}
          </span>
        )}
      </div>
      <p
        className="text-[0.78rem] leading-[1.8] text-[#ccd4e0]"
        style={{ fontFamily: MONO }}
      >
        {ar ? m.textAr : m.textEn}
      </p>
    </motion.div>
  );
}

/* ================= صف السجلّ ================= */

function Row({
  e,
  index,
  selected,
  onOpen,
}: {
  e: Entry;
  index: number;
  selected: boolean;
  onOpen: () => void;
}) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const admin = e.channel === "administration";
  const pinned = admin && !e.read;
  const official = isOfficial(e);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => play("hover")}
      initial={{ opacity: 0, x: ar ? 8 : -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.028 }}
      className="relative block w-full border-b px-3 text-start transition-colors duration-300"
      style={{
        borderColor: "rgba(255,255,255,0.045)",
        /* بطاقة الإدارة أكبر وأوضح */
        paddingTop: admin ? 14 : 10,
        paddingBottom: admin ? 14 : 10,
        background: selected
          ? "rgba(255,255,255,0.045)"
          : admin
          ? "rgba(196,72,72,0.055)"
          : "transparent",
        boxShadow: admin ? "inset 0 0 26px rgba(196,72,72,0.07)" : undefined,
      }}
    >
      {/* شريط الجانب: أحمر للإدارة، أبيض لغير المقروء */}
      <span
        className="absolute inset-y-0 w-[2px]"
        style={{
          insetInlineStart: 0,
          background: admin
            ? "rgba(196,72,72,0.85)"
            : !e.read
            ? "rgba(255,255,255,0.65)"
            : "transparent",
          boxShadow: admin ? "0 0 8px rgba(196,72,72,0.55)" : undefined,
        }}
      />

      {/* وسم رسمي */}
      {official && (
        <div className="mb-1.5 flex items-center gap-1.5">
          {pinned && <Pin size={8} className="text-[#c46a6a]" />}
          <span
            className="rounded-sm border px-1.5 py-px text-[0.36rem] uppercase tracking-[0.18em]"
            style={{
              fontFamily: MONO,
              borderColor: admin ? "rgba(196,72,72,0.55)" : "rgba(255,255,255,0.16)",
              color: admin ? "#e0a2a2" : "#9aa3b1",
              background: admin ? "rgba(196,72,72,0.12)" : "transparent",
            }}
          >
            {admin ? t("ms.administration", lang) : t("ms.officialTag", lang)}
          </span>
          {e.priority === "critical" && (
            <span
              className="text-[0.36rem] uppercase tracking-[0.16em] text-[#c46a6a]"
              style={{ fontFamily: MONO }}
            >
              {t("ms.pr.critical", lang)}
            </span>
          )}
        </div>
      )}

      <div className="flex items-start gap-2.5">
        <Sigil sigil={e.from.sigil} tier={e.from.tier} admin={admin} size={admin ? 36 : 30} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={[
                "truncate text-[0.7rem]",
                e.read ? "text-[#aeb7c4]" : "text-white",
              ].join(" ")}
            >
              {ar ? e.from.nameAr : e.from.nameEn}
            </span>
            <span
              className="shrink-0 text-[0.42rem] tracking-[0.12em] text-[#565d6a]"
              style={{ fontFamily: MONO }}
            >
              {e.stamp}
            </span>
          </div>

          <RankTag tier={e.from.tier} label={ar ? e.from.rankAr : e.from.rankEn} />

          <p
            className={[
              "mt-1 truncate text-[0.66rem]",
              e.read ? "text-[#8d96a4]" : "text-[#dfe4ec]",
            ].join(" ")}
          >
            {ar ? e.subjectAr : e.subjectEn}
          </p>

          <p className="mt-0.5 truncate text-[0.58rem] text-[#646c7a]">
            {ar ? e.previewAr : e.previewEn}
          </p>

          {/* أسطر بيانات دقيقة */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              className="text-[0.38rem] uppercase tracking-[0.14em] text-[#4f5763]"
              style={{ fontFamily: MONO }}
            >
              {e.from.sigil}
            </span>
            <span
              className="rounded-sm border border-white/[0.07] px-1 py-px text-[0.36rem] uppercase tracking-[0.12em] text-[#5f6875]"
              style={{ fontFamily: MONO }}
            >
              {t(`ms.ch.${e.channel}`, lang)}
            </span>
            {e.recipients && (
              <span
                className="inline-flex items-center gap-0.5 text-[0.36rem] text-[#5f6875]"
                style={{ fontFamily: MONO }}
              >
                <Users size={7} />
                {e.recipients}
              </span>
            )}
            {e.outbound && (
              <span
                className="text-[0.36rem] uppercase tracking-[0.12em] text-[#5f6875]"
                style={{ fontFamily: MONO }}
              >
                {e.thread[e.thread.length - 1]?.delivery ?? "SENT"}
              </span>
            )}
            {e.archived && <Lock size={7} className="text-[#4f5763]" />}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function Counter({
  label,
  value,
  alert,
  muted,
}: {
  label: string;
  value: number;
  alert?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-[0.44rem] uppercase tracking-[0.2em] text-[#5f6875]"
        style={{ fontFamily: MONO }}
      >
        {label}
      </span>
      <span
        className="tabular-nums text-[0.9rem]"
        style={{
          fontFamily: MONO,
          color: alert && value > 0 ? "#e0a2a2" : muted ? "#5f6875" : "#eaeef5",
          textShadow:
            alert && value > 0
              ? "0 0 10px rgba(196,72,72,0.45)"
              : muted
              ? undefined
              : "0 0 10px rgba(255,255,255,0.25)",
        }}
      >
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}
