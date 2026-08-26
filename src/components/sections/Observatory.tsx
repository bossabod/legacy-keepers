"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  Satellite,
  MapPin,
  Radio,
  AlertCircle,
  Image as ImageIcon,
  Activity,
  Globe2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import {
  type ApodData,
  type EpicFrame,
  type IssPosition,
  type ObservatoryStatus,
  type SolarEvent,
  fetchApod,
  fetchEpicLatest,
  fetchIssPosition,
  fetchSolarFlares,
  formatCoord,
} from "@/lib/observatory-data";

const SOURCES = {
  epic: {
    label: "NASA EPIC · DSCOVR",
    url: "https://epic.gsfc.nasa.gov/",
    api: "https://api.nasa.gov/EPIC/api/natural",
  },
  apod: {
    label: "NASA APOD",
    url: "https://apod.nasa.gov/apod/",
    api: "https://api.nasa.gov/planetary/apod",
  },
  iss: {
    label: "ISS position",
    url: "https://wheretheiss.at/",
    api: "https://api.wheretheiss.at/v1/satellites/25544",
  },
  donki: {
    label: "NASA DONKI solar",
    url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
    api: "https://api.nasa.gov/DONKI/FLR",
  },
  nasaLive: {
    label: "NASA ISS Live (YouTube)",
    url: "https://www.youtube.com/watch?v=uwXgcTc8oY8",
  },
  vtp: {
    label: "Virtual Telescope Project",
    url: "https://www.virtualtelescope.eu/",
  },
};

function fmtLocal(d: Date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function fmtUtc(ms: number) {
  return (
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: "UTC",
      hour12: false,
    }).format(new Date(ms)) + " UTC"
  );
}

export default function ObservatorySection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [status, setStatus] = useState<ObservatoryStatus>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [localNow, setLocalNow] = useState(() => new Date());

  const [epic, setEpic] = useState<EpicFrame[]>([]);
  const [epicIdx, setEpicIdx] = useState(0);
  const [epicImgOk, setEpicImgOk] = useState(true);
  const [apod, setApod] = useState<ApodData | null>(null);
  const [iss, setIss] = useState<IssPosition | null>(null);
  const [flares, setFlares] = useState<SolarEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const issTimer = useRef<number | null>(null);

  // Local clock
  useEffect(() => {
    const t = window.setInterval(() => setLocalNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const loadAll = useCallback(async (silent = false) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    if (!silent) {
      setStatus("loading");
      setErrorMsg(null);
    }
    setRefreshing(true);

    const results = await Promise.allSettled([
      fetchEpicLatest(ac.signal),
      fetchApod(ac.signal),
      fetchIssPosition(ac.signal),
      fetchSolarFlares(ac.signal),
    ]);

    if (ac.signal.aborted) {
      setRefreshing(false);
      return;
    }

    let got = 0;
    const errors: string[] = [];

    if (results[0].status === "fulfilled" && results[0].value.length > 0) {
      setEpic(results[0].value);
      setEpicIdx(0);
      setEpicImgOk(true);
      got++;
    } else {
      errors.push("EPIC");
      if (results[0].status === "rejected") {
        /* keep previous epic if any */
      }
    }

    if (results[1].status === "fulfilled") {
      setApod(results[1].value);
      got++;
    } else errors.push("APOD");

    if (results[2].status === "fulfilled") {
      setIss(results[2].value);
      got++;
    } else errors.push("ISS");

    if (results[3].status === "fulfilled") {
      setFlares(results[3].value);
      got++;
    } else errors.push("DONKI");

    setLastUpdate(new Date());
    setRefreshing(false);

    if (got === 0) {
      setStatus("error");
      setErrorMsg(
        ar
          ? "تعذّر جلب أي بيانات من واجهات ناسا. تحقق من الاتصال أو افتح المصدر الرسمي."
          : "Could not reach any NASA data endpoints. Check connectivity or open the official source.",
      );
    } else if (got < 4) {
      setStatus("partial");
      setErrorMsg(
        ar
          ? `بعض المصادر غير متاحة: ${errors.join(", ")}`
          : `Some sources unavailable: ${errors.join(", ")}`,
      );
    } else {
      setStatus("live");
      setErrorMsg(null);
    }
  }, [ar]);

  // Initial load + ISS poll every 12s (real moving position)
  useEffect(() => {
    void loadAll(false);

    const pollIss = async () => {
      try {
        const pos = await fetchIssPosition();
        setIss(pos);
        setLastUpdate(new Date());
      } catch {
        /* keep last known */
      }
    };
    issTimer.current = window.setInterval(pollIss, 12000);

    return () => {
      abortRef.current?.abort();
      if (issTimer.current) window.clearInterval(issTimer.current);
    };
  }, [loadAll]);

  // Cycle EPIC frames slowly so Earth disk "moves" with real sequential frames
  useEffect(() => {
    if (epic.length < 2) return;
    const t = window.setInterval(() => {
      setEpicIdx((i) => (i + 1) % epic.length);
      setEpicImgOk(true);
    }, 8000);
    return () => window.clearInterval(t);
  }, [epic.length]);

  const frame = epic[epicIdx] ?? null;

  const statusBadge = (() => {
    if (status === "loading")
      return { text: ar ? "جارٍ الجلب…" : "FETCHING…", live: false, color: "#6e6e6e" };
    if (status === "live")
      return { text: ar ? "بيانات حية" : "LIVE DATA", live: true, color: "#e8e8e8" };
    if (status === "partial")
      return { text: ar ? "جزئي" : "PARTIAL", live: true, color: "#b0b0b0" };
    if (status === "error")
      return { text: "OFFLINE", live: false, color: "#555555" };
    return { text: "OFFLINE", live: false, color: "#555555" };
  })();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1a1a1a] pb-4">
        <div>
          <div
            className="text-[0.5rem] uppercase tracking-[0.32em] text-[#6e6e6e]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {ar ? "رصد · بيانات ناسا الحقيقية" : "Observation · Real NASA data feeds"}
          </div>
          <h1
            className="mt-2 text-[clamp(1.6rem,3.5vw,2.4rem)] font-light uppercase tracking-[0.14em] text-[#e8e8e8]"
            style={{ fontFamily: "var(--font-luxury)" }}
          >
            {ar ? "المرصد" : "Observatory"}
          </h1>
          <p className="mt-2 max-w-2xl text-[0.78rem] leading-relaxed text-[#6e6e6e]">
            {ar
              ? "صور DSCOVR/EPIC الحقيقية للأرض · موقع ISS الحي · صورة اليوم الفلكية · أحداث شمسية من DONKI. بدون فيديو وهمي."
              : "Real DSCOVR/EPIC Earth imagery · live ISS position · Astronomy Picture of the Day · DONKI solar events. No fake video."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#0e0e0e] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em]"
            style={{ fontFamily: "var(--font-mono)", color: statusBadge.color }}
            role="status"
            aria-live="polite"
          >
            <span
              className={`h-2 w-2 rounded-full ${statusBadge.live ? "animate-pulse" : ""}`}
              style={{
                background: statusBadge.color,
                boxShadow: statusBadge.live ? `0 0 10px ${statusBadge.color}` : "none",
              }}
            />
            {statusBadge.text}
          </span>

          <button
            type="button"
            onClick={() => void loadAll(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-[#c0c0c0] transition hover:border-[#3a3a3a] disabled:opacity-50"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {ar ? "تحديث" : "REFRESH"}
          </button>

          <a
            href={SOURCES.epic.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#3a3a3a] bg-[#141414] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-[#e8e8e8] hover:border-[#6e6e6e]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <ExternalLink size={13} />
            SOURCE
          </a>
        </div>
      </div>

      {/* Status strip */}
      <div
        className="grid gap-2 rounded-xl border border-[#1a1a1a] bg-[#080808] px-4 py-3 sm:grid-cols-4"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <StripItem label="STATUS" value={statusBadge.text} />
        <StripItem
          label="LAST UPDATE"
          value={lastUpdate ? fmtLocal(lastUpdate) : "—"}
        />
        <StripItem label="DATA SOURCE" value="NASA EPIC · ISS · APOD · DONKI" />
        <StripItem label="LOCAL TIME" value={fmtLocal(localNow)} />
      </div>

      {errorMsg && status !== "live" && (
        <div className="flex items-start gap-2 rounded-lg border border-[#2a2a2a] bg-[#0e0e0e] px-3 py-2.5 text-[0.72rem] text-[#8a8a8a]">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        {/* MAIN: EPIC Earth disk */}
        <section
          className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#050505]"
          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.55)" }}
        >
          <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-2 min-w-0">
              <Globe2 size={14} className="text-[#9a9a9a]" />
              <span
                className="truncate text-[0.72rem] tracking-[0.1em] text-[#e8e8e8]"
                style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
              >
                {ar ? "قرص الأرض · DSCOVR / EPIC" : "Earth disk · DSCOVR / EPIC"}
              </span>
            </div>
            <span
              className="text-[0.55rem] uppercase tracking-[0.16em] text-[#6e6e6e]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {frame
                ? `${epicIdx + 1}/${epic.length}`
                : status === "loading"
                  ? "…"
                  : "NO FRAME"}
            </span>
          </div>

          <div
            className="relative flex w-full items-center justify-center bg-[#030303]"
            style={{ minHeight: 420, aspectRatio: "1 / 1", maxHeight: 640 }}
          >
            {status === "loading" && epic.length === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 animate-spin rounded-full border border-[#2a2a2a] border-t-[#c0c0c0]" />
                <span
                  className="text-[0.62rem] uppercase tracking-[0.2em] text-[#6e6e6e]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {ar ? "جلب صور EPIC من ناسا…" : "Fetching EPIC frames from NASA…"}
                </span>
              </div>
            ) : frame && epicImgOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={frame.imageUrl}
                src={frame.imageUrl}
                alt={frame.caption || "NASA EPIC Earth"}
                className="max-h-full max-w-full object-contain p-4 sm:p-6"
                onError={() => setEpicImgOk(false)}
                onLoad={() => setEpicImgOk(true)}
                draggable={false}
              />
            ) : (
              <div className="flex max-w-md flex-col items-center gap-3 px-6 text-center">
                <ImageIcon size={28} className="text-[#4a4a4a]" />
                <p className="text-[0.8rem] text-[#8a8a8a]">
                  {ar
                    ? "تعذّر تحميل صورة EPIC. افتح المصدر الرسمي أو اضغط REFRESH."
                    : "Could not load EPIC imagery. Open the official source or press REFRESH."}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadAll(true)}
                    className="rounded-md border border-[#2a2a2a] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-[#c0c0c0]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    REFRESH
                  </button>
                  <a
                    href={SOURCES.epic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-[#3a3a3a] px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-[#e8e8e8]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <ExternalLink size={12} /> SOURCE
                  </a>
                </div>
              </div>
            )}

            {/* Real-data badge — only when we actually have frames */}
            {frame && epicImgOk && (
              <div
                className="pointer-events-none absolute left-3 top-3 rounded-md border border-[#2a2a2a] bg-black/70 px-2.5 py-1 text-[0.5rem] uppercase tracking-[0.16em] text-[#c0c0c0] backdrop-blur-sm"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                NASA EPIC · REAL FRAME
              </div>
            )}
          </div>

          {frame && (
            <div className="space-y-2 border-t border-[#1a1a1a] px-4 py-3 sm:px-5">
              <p className="text-[0.78rem] leading-relaxed text-[#b0b0b0]">{frame.caption}</p>
              <div
                className="flex flex-wrap gap-x-5 gap-y-1 text-[0.58rem] uppercase tracking-[0.14em] text-[#6e6e6e]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span>DATE {frame.date}</span>
                {frame.centroid_coordinates && (
                  <span>
                    CENTROID{" "}
                    {formatCoord(
                      frame.centroid_coordinates.lat,
                      frame.centroid_coordinates.lon,
                    )}
                  </span>
                )}
                <span>ID {frame.identifier}</span>
              </div>
              {epic.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {epic.map((f, i) => (
                    <button
                      key={f.identifier}
                      type="button"
                      onClick={() => {
                        setEpicIdx(i);
                        setEpicImgOk(true);
                      }}
                      className={`h-1.5 flex-1 min-w-[18px] max-w-[40px] rounded-full transition ${
                        i === epicIdx ? "bg-[#c0c0c0]" : "bg-[#2a2a2a] hover:bg-[#3a3a3a]"
                      }`}
                      aria-label={`EPIC frame ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Side column */}
        <div className="space-y-4">
          {/* ISS live track */}
          <section className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.22em] text-[#6e6e6e]" style={{ fontFamily: "var(--font-mono)" }}>
                <Satellite size={12} />
                {ar ? "موقع المحطة الدولية" : "ISS POSITION"}
              </div>
              {iss && (
                <span className="flex items-center gap-1.5 text-[0.5rem] uppercase tracking-[0.16em] text-[#c0c0c0]" style={{ fontFamily: "var(--font-mono)" }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e8e8e8]" style={{ boxShadow: "0 0 8px #e8e8e8" }} />
                  LIVE · 12s
                </span>
              )}
            </div>
            {iss ? (
              <div className="space-y-2">
                <div
                  className="text-[1.15rem] tracking-[0.04em] text-[#e8e8e8]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {formatCoord(iss.latitude, iss.longitude)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[0.7rem] text-[#8a8a8a]">
                  <div>
                    <div className="text-[0.48rem] uppercase tracking-[0.16em] text-[#4a4a4a]" style={{ fontFamily: "var(--font-mono)" }}>ALT</div>
                    {iss.altitudeKm.toFixed(1)} km
                  </div>
                  <div>
                    <div className="text-[0.48rem] uppercase tracking-[0.16em] text-[#4a4a4a]" style={{ fontFamily: "var(--font-mono)" }}>VEL</div>
                    {iss.velocityKms.toFixed(2)} km/s
                  </div>
                  <div className="col-span-2">
                    <div className="text-[0.48rem] uppercase tracking-[0.16em] text-[#4a4a4a]" style={{ fontFamily: "var(--font-mono)" }}>TIMESTAMP</div>
                    {fmtUtc(iss.timestamp)}
                  </div>
                  <div className="col-span-2 text-[0.58rem] text-[#4a4a4a]" style={{ fontFamily: "var(--font-mono)" }}>
                    SOURCE · {iss.source}
                  </div>
                </div>
                {/* Simple track plot */}
                <IssMap lat={iss.latitude} lon={iss.longitude} />
              </div>
            ) : (
              <p className="text-[0.72rem] text-[#6e6e6e]">
                {status === "loading"
                  ? ar
                    ? "جلب موقع ISS…"
                    : "Fetching ISS…"
                  : ar
                    ? "موقع ISS غير متاح"
                    : "ISS position unavailable"}
              </p>
            )}
          </section>

          {/* APOD */}
          <section className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0a0a0a]">
            <div className="flex items-center gap-2 border-b border-[#1a1a1a] px-4 py-2.5 text-[0.5rem] uppercase tracking-[0.22em] text-[#6e6e6e]" style={{ fontFamily: "var(--font-mono)" }}>
              <ImageIcon size={12} />
              {ar ? "صورة ناسا الفلكية لليوم" : "NASA APOD"}
            </div>
            {apod ? (
              <div>
                {apod.media_type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={apod.url}
                    alt={apod.title}
                    className="max-h-48 w-full object-cover"
                  />
                ) : apod.media_type === "video" ? (
                  <div className="flex h-32 items-center justify-center bg-[#080808] px-4 text-center text-[0.7rem] text-[#6e6e6e]">
                    {ar ? "APOD اليوم فيديو — افتح المصدر" : "Today's APOD is video — open source"}
                  </div>
                ) : null}
                <div className="space-y-1.5 px-4 py-3">
                  <div
                    className="text-[0.85rem] tracking-[0.04em] text-[#e8e8e8]"
                    style={{ fontFamily: "var(--font-luxury)", fontWeight: 600 }}
                  >
                    {apod.title}
                  </div>
                  <div className="text-[0.55rem] uppercase tracking-[0.14em] text-[#4a4a4a]" style={{ fontFamily: "var(--font-mono)" }}>
                    {apod.date}
                    {apod.copyright ? ` · © ${apod.copyright}` : ""}
                  </div>
                  <p className="line-clamp-4 text-[0.68rem] leading-relaxed text-[#8a8a8a]">
                    {apod.explanation}
                  </p>
                  <a
                    href={SOURCES.apod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.14em] text-[#b0b0b0] hover:text-white"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <ExternalLink size={11} /> APOD SOURCE
                  </a>
                </div>
              </div>
            ) : (
              <p className="px-4 py-6 text-[0.72rem] text-[#6e6e6e]">
                {status === "loading" ? "…" : ar ? "APOD غير متاح" : "APOD unavailable"}
              </p>
            )}
          </section>

          {/* Solar flares */}
          <section className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
            <div className="mb-3 flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.22em] text-[#6e6e6e]" style={{ fontFamily: "var(--font-mono)" }}>
              <Activity size={12} />
              {ar ? "انفجارات شمسية · DONKI" : "SOLAR FLARES · DONKI"}
            </div>
            {flares.length > 0 ? (
              <ul className="max-h-44 space-y-2 overflow-y-auto scroll-thin">
                {flares.map((f, i) => (
                  <li
                    key={f.flrID ?? `${f.beginTime}-${i}`}
                    className="rounded-md border border-[#1a1a1a] bg-[#080808] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.78rem] text-[#e8e8e8]" style={{ fontFamily: "var(--font-mono)" }}>
                        {f.classType ?? "—"}
                      </span>
                      <span className="text-[0.55rem] text-[#4a4a4a]" style={{ fontFamily: "var(--font-mono)" }}>
                        {f.beginTime?.replace("Z", " UTC") ?? ""}
                      </span>
                    </div>
                    {(f.sourceLocation || f.peakTime) && (
                      <div className="mt-1 text-[0.58rem] text-[#6e6e6e]" style={{ fontFamily: "var(--font-mono)" }}>
                        {f.sourceLocation ? `LOC ${f.sourceLocation}` : ""}
                        {f.peakTime ? ` · PEAK ${f.peakTime.replace("Z", "")}` : ""}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.72rem] text-[#6e6e6e]">
                {status === "loading"
                  ? "…"
                  : ar
                    ? "لا توجد أحداث مسجّلة في آخر 14 يوماً أو المصدر غير متاح"
                    : "No events in the last 14 days, or source unavailable"}
              </p>
            )}
            <a
              href={SOURCES.donki.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[0.55rem] uppercase tracking-[0.14em] text-[#8a8a8a] hover:text-[#c0c0c0]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <ExternalLink size={11} /> DONKI SOURCE
            </a>
          </section>

          {/* Official external live options (links only — no broken iframe) */}
          <section className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-4">
            <div className="mb-2 flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.22em] text-[#6e6e6e]" style={{ fontFamily: "var(--font-mono)" }}>
              <Radio size={12} />
              {ar ? "بث مباشر خارجي (يفتح في نافذة جديدة)" : "EXTERNAL LIVE (opens new window)"}
            </div>
            <p className="mb-3 text-[0.65rem] leading-relaxed text-[#4a4a4a]">
              {ar
                ? "لا نضمّن YouTube داخل الصفحة لأنه غالباً يُحظر. الروابط التالية رسمية وتفتح البث الأصلي."
                : "We do not embed YouTube in-page (often blocked). These open the official live pages."}
            </p>
            <div className="space-y-2">
              <ExtLink href={SOURCES.nasaLive.url} label="NASA ISS Live" />
              <ExtLink href={SOURCES.vtp.url} label="Virtual Telescope Project" />
              <ExtLink href={SOURCES.epic.url} label="NASA EPIC portal" />
              <ExtLink href="https://www.nasa.gov/multimedia/nasatv/" label="NASA TV" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StripItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.46rem] uppercase tracking-[0.18em] text-[#4a4a4a]">{label}</div>
      <div className="mt-0.5 truncate text-[0.68rem] text-[#c0c0c0]">{value}</div>
    </div>
  );
}

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-lg border border-[#1a1a1a] px-3 py-2 text-[0.72rem] text-[#c0c0c0] transition hover:border-[#3a3a3a] hover:text-white"
    >
      <span>{label}</span>
      <ExternalLink size={13} />
    </a>
  );
}

/** Minimal equirectangular track plot for ISS — real lat/lon, not decorative animation. */
function IssMap({ lat, lon }: { lat: number; lon: number }) {
  // Project lon/lat to 0–100%
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return (
    <div
      className="relative mt-2 h-24 w-full overflow-hidden rounded-md border border-[#1a1a1a] bg-[#060606]"
      aria-hidden
    >
      {/* simple graticule */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((v) => (
          <line key={`v${v}`} x1={v} y1={0} x2={v} y2={50} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
        ))}
        {[0, 12.5, 25, 37.5, 50].map((v) => (
          <line key={`h${v}`} x1={0} y1={v} x2={100} y2={v} stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
        ))}
        {/* equator */}
        <line x1={0} y1={25} x2={100} y2={25} stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
      </svg>
      <div
        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e8e8e8]"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          boxShadow: "0 0 10px rgba(232,232,232,0.9), 0 0 2px #fff",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-1 left-2 text-[0.45rem] uppercase tracking-[0.14em] text-[#4a4a4a]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <MapPin size={8} className="mr-1 inline" />
        LIVE TRACK
      </div>
    </div>
  );
}
