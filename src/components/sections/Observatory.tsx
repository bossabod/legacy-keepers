"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Radio,
  MapPin,
  Clock,
  Satellite,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useApp } from "@/lib/store";
import {
  OBSERVATORY_FEEDS,
  buildEmbedUrl,
  buildWatchUrl,
  type ObservatoryFeed,
} from "@/lib/observatory-feeds";

type StreamState = "loading" | "live" | "offline" | "blocked";

function formatLocal(d: Date, timeZone?: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
      ...(timeZone ? { timeZone } : {}),
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function formatUtc(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
    hour12: false,
  }).format(d) + " UTC";
}

export default function ObservatorySection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [activeId, setActiveId] = useState(OBSERVATORY_FEEDS[0].id);
  const feed = useMemo(
    () => OBSERVATORY_FEEDS.find((f) => f.id === activeId) ?? OBSERVATORY_FEEDS[0],
    [activeId],
  );

  const [now, setNow] = useState(() => new Date());
  const [streamState, setStreamState] = useState<StreamState>("loading");
  const [embedKey, setEmbedKey] = useState(0);
  const [iframeFailed, setIframeFailed] = useState(false);

  const embedUrl = useMemo(() => buildEmbedUrl(feed), [feed]);
  const watchUrl = useMemo(() => buildWatchUrl(feed), [feed]);

  // Live clock
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Reset state when switching feeds
  useEffect(() => {
    setStreamState("loading");
    setIframeFailed(false);
    setEmbedKey((k) => k + 1);
    // Give the embed a moment; if YouTube channel is offline the player shows its own message.
    // We treat "loaded" as live-capable; user can still open official source.
    const ready = window.setTimeout(() => {
      setStreamState((s) => (s === "loading" ? "live" : s));
    }, 2200);
    // Fallback: if still loading long, mark as offline-ish so UI shows open-source CTA
    const offlineHint = window.setTimeout(() => {
      setStreamState((s) => (s === "loading" ? "offline" : s));
    }, 12000);
    return () => {
      window.clearTimeout(ready);
      window.clearTimeout(offlineHint);
    };
  }, [feed.id]);

  const reload = useCallback(() => {
    setStreamState("loading");
    setIframeFailed(false);
    setEmbedKey((k) => k + 1);
  }, []);

  const openOfficial = useCallback(() => {
    window.open(watchUrl, "_blank", "noopener,noreferrer");
  }, [watchUrl]);

  const statusLabel = (() => {
    if (streamState === "loading") return ar ? "جارٍ الاتصال…" : "Connecting…";
    if (streamState === "live") return ar ? "مباشر / جاهز للعرض" : "LIVE / ON AIR";
    if (streamState === "blocked") return ar ? "التضمين محظور — افتح المصدر" : "Embed blocked — open source";
    return ar ? "قد يكون البث متوقفاً" : "Stream may be offline";
  })();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" dir={ar ? "rtl" : "ltr"}>
      {/* Title row */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1a1a1a] pb-4">
        <div>
          <div
            className="text-[0.5rem] uppercase tracking-[0.32em] text-[#6e6e6e]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {ar ? "رصد · بث حقيقي من مصدر خارجي" : "Observation · Real external live source"}
          </div>
          <h1
            className="mt-2 text-[clamp(1.6rem,3.5vw,2.4rem)] font-light uppercase tracking-[0.14em] text-[#e8e8e8]"
            style={{ fontFamily: "var(--font-luxury)" }}
          >
            {ar ? "المرصد" : "Observatory"}
          </h1>
          <p className="mt-2 max-w-2xl text-[0.78rem] leading-relaxed text-[#6e6e6e]">
            {ar
              ? "بث مباشر حقيقي من مصادر رسمية (ناسا · مشروع التلسكوب الافتراضي · Sen). ليس فيديو محفوظاً ولا حلقة وهمية."
              : "Real live feeds from official sources (NASA · Virtual Telescope Project · Sen). Not stock footage, not a fake loop."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] ${
              streamState === "live"
                ? "border-[#c0c0c0]/35 bg-[#1a1a1a] text-[#e8e8e8]"
                : "border-[#3a3a3a] bg-[#0e0e0e] text-[#8a8a8a]"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
            role="status"
            aria-live="polite"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                streamState === "live" ? "bg-[#e8e8e8] animate-pulse" : "bg-[#555555]"
              }`}
              style={
                streamState === "live"
                  ? { boxShadow: "0 0 10px rgba(232,232,232,0.8)" }
                  : undefined
              }
            />
            {streamState === "live" ? "LIVE" : statusLabel}
          </span>
        </div>
      </div>

      {/* Feed switcher */}
      <div className="flex flex-wrap gap-2">
        {OBSERVATORY_FEEDS.map((f) => {
          const on = f.id === activeId;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveId(f.id)}
              className={`rounded-lg border px-3.5 py-2 text-left transition-colors ${
                on
                  ? "border-[#c0c0c0]/40 bg-[#1a1a1a] text-[#e8e8e8]"
                  : "border-[#2a2a2a] bg-[#0a0a0a] text-[#8a8a8a] hover:border-[#3a3a3a] hover:text-[#c0c0c0]"
              }`}
            >
              <div
                className="text-[0.58rem] uppercase tracking-[0.16em]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {ar ? f.sourceAr : f.source}
              </div>
              <div
                className="mt-0.5 text-[0.78rem] tracking-[0.04em]"
                style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
              >
                {ar ? f.nameAr : f.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main viewer */}
        <div
          className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#050505]"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.55)" }}
        >
          {/* Viewer chrome */}
          <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-2 min-w-0">
              <Radio size={14} className="shrink-0 text-[#9a9a9a]" />
              <span
                className="truncate text-[0.7rem] tracking-[0.08em] text-[#c0c0c0]"
                style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
              >
                {ar ? feed.nameAr : feed.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reload}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2a] px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.14em] text-[#8a8a8a] hover:border-[#3a3a3a] hover:text-[#c0c0c0]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <RefreshCw size={12} />
                {ar ? "إعادة" : "Reload"}
              </button>
              <button
                type="button"
                onClick={openOfficial}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#3a3a3a] bg-[#141414] px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.14em] text-[#e8e8e8] hover:border-[#6e6e6e]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <ExternalLink size={12} />
                {ar ? "المصدر الرسمي" : "Official source"}
              </button>
            </div>
          </div>

          {/* Aspect-ratio stage for the real embed */}
          <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
            {embedUrl && !iframeFailed ? (
              <iframe
                key={`${feed.id}-${embedKey}`}
                title={`${feed.name} — live embed`}
                src={embedUrl}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => {
                  // Player loaded — treat as capable of live delivery
                  setStreamState("live");
                }}
                onError={() => {
                  setIframeFailed(true);
                  setStreamState("blocked");
                }}
              />
            ) : (
              <OfflinePanel feed={feed} ar={ar} onOpen={openOfficial} />
            )}

            {streamState === "loading" && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border border-[#3a3a3a] border-t-[#c0c0c0]" />
                  <span
                    className="text-[0.62rem] uppercase tracking-[0.2em] text-[#8a8a8a]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {ar ? "الاتصال بالمصدر الحقيقي…" : "Connecting to real source…"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer under player */}
          <div className="border-t border-[#1a1a1a] px-4 py-3 sm:px-5">
            <p className="text-[0.68rem] leading-relaxed text-[#6e6e6e]">
              {ar ? feed.offlineNoteAr : feed.offlineNote}{" "}
              <button
                type="button"
                onClick={openOfficial}
                className="underline decoration-[#3a3a3a] underline-offset-2 hover:text-[#c0c0c0]"
              >
                {ar ? "فتح البث الأصلي" : "Open original stream"}
              </button>
            </p>
          </div>
        </div>

        {/* Meta panel */}
        <aside className="space-y-3">
          <MetaCard
            icon={Satellite}
            label={ar ? "المصدر" : "Source"}
            value={ar ? feed.sourceAr : feed.source}
          />
          <MetaCard
            icon={MapPin}
            label={ar ? "موقع الرصد" : "Observation site"}
            value={ar ? feed.locationAr : feed.location}
          />
          <MetaCard
            icon={Radio}
            label={ar ? "الموضوع" : "Subject"}
            value={ar ? feed.subjectAr : feed.subject}
          />
          <MetaCard
            icon={Clock}
            label={ar ? "الوقت المحلي" : "Local time"}
            value={formatLocal(now)}
            mono
          />
          <MetaCard
            icon={Calendar}
            label={ar ? "التوقيت العالمي" : "UTC"}
            value={formatUtc(now)}
            mono
          />
          <MetaCard
            icon={AlertCircle}
            label={ar ? "حالة الرصد" : "Observation status"}
            value={statusLabel}
            mono
          />

          <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
            <div
              className="text-[0.5rem] uppercase tracking-[0.22em] text-[#6e6e6e]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {ar ? "روابط رسمية" : "Official links"}
            </div>
            <div className="mt-3 space-y-2">
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-[#2a2a2a] px-3 py-2 text-[0.72rem] text-[#c0c0c0] transition hover:border-[#3a3a3a] hover:text-white"
              >
                <span>{ar ? "مشاهدة على YouTube" : "Watch on YouTube"}</span>
                <ExternalLink size={13} />
              </a>
              <a
                href={feed.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-[#2a2a2a] px-3 py-2 text-[0.72rem] text-[#c0c0c0] transition hover:border-[#3a3a3a] hover:text-white"
              >
                <span>{ar ? "صفحة المصدر" : "Source page"}</span>
                <ExternalLink size={13} />
              </a>
              <a
                href="https://www.virtualtelescope.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-[#2a2a2a] px-3 py-2 text-[0.72rem] text-[#c0c0c0] transition hover:border-[#3a3a3a] hover:text-white"
              >
                <span>virtualtelescope.eu</span>
                <ExternalLink size={13} />
              </a>
              <a
                href="https://www.nasa.gov/multimedia/nasatv/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-[#2a2a2a] px-3 py-2 text-[0.72rem] text-[#c0c0c0] transition hover:border-[#3a3a3a] hover:text-white"
              >
                <span>NASA TV</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <p className="px-1 text-[0.62rem] leading-relaxed text-[#4a4a4a]">
            {ar
              ? "التضمين يتم عبر مشغّل YouTube الرسمي فقط. لا يوجد فيديو محلي أو CSS يحاكي البث."
              : "Embeds use the official YouTube player only. No local video files or CSS faux-streams."}
          </p>
        </aside>
      </div>
    </div>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Radio;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3">
      <div className="flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.2em] text-[#6e6e6e]" style={{ fontFamily: "var(--font-mono)" }}>
        <Icon size={12} />
        {label}
      </div>
      <div
        className={`mt-1.5 text-[0.82rem] leading-snug text-[#e8e8e8] ${mono ? "mono text-[0.72rem]" : ""}`}
        style={mono ? { fontFamily: "var(--font-mono)" } : { fontFamily: "var(--font-luxury)" }}
      >
        {value}
      </div>
    </div>
  );
}

function OfflinePanel({
  feed,
  ar,
  onOpen,
}: {
  feed: ObservatoryFeed;
  ar: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#080808] px-6 text-center">
      <AlertCircle size={28} className="text-[#6e6e6e]" />
      <div>
        <div
          className="text-[0.9rem] tracking-[0.1em] text-[#e8e8e8]"
          style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
        >
          {ar ? "لا يوجد تضمين مباشر متاح الآن" : "No live embed available right now"}
        </div>
        <p className="mt-2 max-w-md text-[0.72rem] leading-relaxed text-[#6e6e6e]">
          {ar ? feed.offlineNoteAr : feed.offlineNote}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 rounded-lg border border-[#3a3a3a] bg-[#141414] px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-[#e8e8e8] hover:border-[#6e6e6e]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <ExternalLink size={14} />
        {ar ? "فتح المصدر الرسمي" : "Open official source"}
      </button>
    </div>
  );
}
