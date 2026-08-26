/**
 * Real external astronomy / sky observation feeds.
 * Only official, publicly embeddable sources — no stock, no loops, no AI video.
 */

export type FeedKind = "live-embed" | "channel-live" | "external";

export interface ObservatoryFeed {
  id: string;
  /** Short label shown in the UI */
  name: string;
  nameAr: string;
  /** Organization that owns the feed */
  source: string;
  sourceAr: string;
  /** Physical / orbital location of the camera */
  location: string;
  locationAr: string;
  /** What the feed shows */
  subject: string;
  subjectAr: string;
  /** Official page / channel (always openable) */
  officialUrl: string;
  /**
   * YouTube video id for direct embed (when known & stable).
   * Prefer live stream ids that stay continuous (e.g. NASA ISS).
   */
  youtubeVideoId?: string;
  /**
   * YouTube channel handle or id — used for /channel/…/live embed
   * which auto-resolves to the channel's current live stream when on-air.
   */
  youtubeChannelId?: string;
  youtubeHandle?: string;
  kind: FeedKind;
  /** Notes shown when offline / not currently broadcasting */
  offlineNote: string;
  offlineNoteAr: string;
}

/**
 * Curated real feeds. Embeds use YouTube's official iframe player
 * (https://www.youtube.com/embed/… and channel live endpoints).
 */
export const OBSERVATORY_FEEDS: ObservatoryFeed[] = [
  {
    id: "nasa-iss",
    name: "ISS Live — Earth & Station",
    nameAr: "البث المباشر من محطة الفضاء الدولية",
    source: "NASA (official)",
    sourceAr: "ناسا (رسمي)",
    location: "International Space Station · Low Earth Orbit",
    locationAr: "محطة الفضاء الدولية · مدار أرضي منخفض",
    subject: "Live views from cameras aboard the ISS (crew / Earth views when available)",
    subjectAr: "لقطات مباشرة من كاميرات محطة الفضاء الدولية (الطاقم / الأرض عند التوفر)",
    officialUrl: "https://www.youtube.com/watch?v=uwXgcTc8oY8",
    youtubeVideoId: "uwXgcTc8oY8",
    kind: "live-embed",
    offlineNote:
      "When the station is out of contact or cameras are offline, NASA shows a holding graphic. Open the official stream for status.",
    offlineNoteAr:
      "عند انقطاع الاتصال أو إيقاف الكاميرات، تعرض ناسا شاشة انتظار. افتح البث الرسمي لمعرفة الحالة.",
  },
  {
    id: "nasa-live-channel",
    name: "NASA Live Channel",
    nameAr: "قناة ناسا المباشرة",
    source: "NASA Television",
    sourceAr: "تلفزيون ناسا",
    location: "Mission Control · multi-camera network",
    locationAr: "مركز التحكم · شبكة كاميرات متعددة",
    subject: "NASA's live channel — launches, ISS events, and public briefings when on air",
    subjectAr: "قناة ناسا المباشرة — إطلاقات وفعاليات المحطة ومؤتمرات عند البث",
    officialUrl: "https://www.youtube.com/@NASA/live",
    youtubeChannelId: "UCLA_DiR1FfKNvjuUpBHmylQ", // NASA official
    youtubeHandle: "NASA",
    kind: "channel-live",
    offlineNote:
      "This channel is live only during scheduled NASA events. If nothing is on air, use Open Official Source.",
    offlineNoteAr:
      "هذه القناة تبث فقط أثناء فعاليات ناسا المجدولة. إن لم يكن هناك بث، استخدم فتح المصدر الرسمي.",
  },
  {
    id: "vtp",
    name: "Virtual Telescope Project",
    nameAr: "مشروع التلسكوب الافتراضي",
    source: "Virtual Telescope Project · Gianluca Masi, PhD",
    sourceAr: "مشروع التلسكوب الافتراضي · جيانلوكا ماسي",
    location: "Manciano / Ceccano observatories · Italy",
    locationAr: "مراصد مانتشانو / تشيكانو · إيطاليا",
    subject: "Live optical telescope streams of comets, eclipses, asteroids and deep-sky events",
    subjectAr: "بث تلسكوبي بصري مباشر للمذنبات والكسوف والكويكبات وأحداث السماء العميقة",
    officialUrl: "https://www.youtube.com/@GianMasiVirtualTelescope/live",
    youtubeHandle: "GianMasiVirtualTelescope",
    // Channel id for Virtual Telescope Project
    youtubeChannelId: "UCbnPQoG4Oakfz7EW5D8E2ig",
    kind: "channel-live",
    offlineNote:
      "VTP broadcasts during scheduled astronomical events (weather permitting). Between events the channel is offline — open the official page for the next session.",
    offlineNoteAr:
      "يبث المشروع أثناء الأحداث الفلكية المجدولة (حسب الطقس). بين الأحداث تكون القناة متوقفة — افتح الصفحة الرسمية للجلسة القادمة.",
  },
  {
    id: "sen-iss",
    name: "Sen — Earth from Space (4K)",
    nameAr: "Sen — الأرض من الفضاء (4K)",
    source: "Sen (commercial ISS cameras · downlink via NASA network)",
    sourceAr: "Sen (كاميرات تجارية على المحطة · عبر شبكة ناسا)",
    location: "International Space Station exterior cameras",
    locationAr: "كاميرات خارجية على محطة الفضاء الدولية",
    subject: "Continuous commercial 4K Earth / horizon views from the ISS",
    subjectAr: "مشاهد 4K مستمرة للأرض والأفق من محطة الفضاء الدولية",
    officialUrl: "https://www.youtube.com/@Sen/live",
    youtubeHandle: "Sen",
    kind: "channel-live",
    offlineNote:
      "If Sen is not currently live, open the official channel. Do not treat a recorded VOD as a live sky feed.",
    offlineNoteAr:
      "إن لم يكن Sen يبث حالياً، افتح القناة الرسمية. لا تُعامل تسجيلات VOD كبث سماء مباشر.",
  },
];

/** Build a YouTube embed URL for a feed (official player only). */
export function buildEmbedUrl(feed: ObservatoryFeed, opts?: { autoplay?: boolean }): string | null {
  const autoplay = opts?.autoplay === false ? 0 : 1;
  const common = `autoplay=${autoplay}&rel=0&modestbranding=1&playsinline=1`;

  if (feed.youtubeVideoId) {
    return `https://www.youtube.com/embed/${feed.youtubeVideoId}?${common}`;
  }
  if (feed.youtubeChannelId) {
    // YouTube channel live endpoint — resolves to the channel's current live stream when on-air
    return `https://www.youtube.com/embed/live_stream?channel=${feed.youtubeChannelId}&${common}`;
  }
  return null;
}

export function buildWatchUrl(feed: ObservatoryFeed): string {
  if (feed.youtubeVideoId) return `https://www.youtube.com/watch?v=${feed.youtubeVideoId}`;
  if (feed.youtubeHandle) return `https://www.youtube.com/@${feed.youtubeHandle}/live`;
  if (feed.youtubeChannelId) return `https://www.youtube.com/channel/${feed.youtubeChannelId}/live`;
  return feed.officialUrl;
}
