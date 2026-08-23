/* ============================================================
   performance-series.ts

   سلسلة أداء المشروع عبر الزمن.

   القيم مولّدة بمولّد عشوائي حتمي (نفس البذرة ⇒ نفس المنحنى في
   كل تحميل، فلا يختلف الخادم عن المتصفح ولا تحدث مشكلة hydration).

   المنحنى ليس صعوداً مصطنعاً: فيه اتجاه عام صاعد + دورات متوسطة
   + ضجيج يومي + موجتا تصحيح هابطتان، ثم يُعاير آخر يوم بدقة على
   القيمة المطلوبة.
   ============================================================ */

export interface Point {
  /** الإزاحة بالأيام من بداية السلسلة */
  t: number;
  /** الأداء التراكمي بالنسبة المئوية */
  v: number;
  /** تاريخ العرض */
  date: Date;
}

export type RangeKey = "1M" | "3M" | "6M" | "YTD" | "1Y";

export const RANGES: RangeKey[] = ["1M", "3M", "6M", "YTD", "1Y"];

/** الأداء النهائي المستهدف للسنة. */
export const TARGET = 31;

/** مولّد أعداد شبه عشوائية حتمي (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * يبني سلسلة سنة كاملة (٣٦٥ يوماً) تنتهي عند `TARGET`.
 * التاريخ المرجعي يُمرَّر من المستدعي حتى يبقى الناتج ثابتاً.
 */
export function buildSeries(endDate: Date): Point[] {
  const rand = rng(0x1c7b_2f19);
  const DAYS = 365;
  const raw: number[] = [];

  /* المسار الأساسي: نمو تراكمي يتسارع قليلاً نحو نهاية السنة، مرسوم
     على منحنى مُسيطَر عليه بدل تراكم زخم حر — فالزخم الحر كان
     يتضاعف ويقفز فوق الهدف ثم يهبط، وهو عكس المطلوب. */
  let drift = 0;

  for (let i = 0; i < DAYS; i++) {
    const p = i / (DAYS - 1);

    // الاتجاه العام: تسارع لطيف مع تقدّم السنة
    const trend = 0.055 + 0.055 * p;

    // دورات متوسطة المدى تعطي تعرّجاً طبيعياً حول الاتجاه
    const cycle =
      Math.sin(p * Math.PI * 3.4 + 0.6) * 0.055 +
      Math.sin(p * Math.PI * 7.1 + 2.4) * 0.028;

    /* ضجيج يومي بارتداد نحو الصفر (mean reverting) حتى لا يتراكم
       الانحراف ويشوّه المسار العام */
    drift = drift * 0.86 + (rand() - 0.5) * 0.22;

    let step = trend + cycle + drift;

    /* موجتا تصحيح: هبوط واضح ثم تعافٍ */
    if (i >= 96 && i < 128) step -= 0.26 * Math.sin(((i - 96) / 32) * Math.PI);
    if (i >= 236 && i < 264) step -= 0.22 * Math.sin(((i - 236) / 28) * Math.PI);

    raw.push((raw[i - 1] ?? 0) + step);
  }

  /* معايرة: نبدأ من الصفر ونصل إلى TARGET بالضبط، مع الحفاظ على
     شكل التذبذب كما هو. */
  const first = raw[0];
  const last = raw[raw.length - 1];
  const span = last - first || 1;
  const scale = TARGET / span;

  const start = new Date(endDate);
  start.setDate(start.getDate() - (DAYS - 1));

  return raw.map((v, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { t: i, v: (v - first) * scale, date: d };
  });
}

/** يقتطع السلسلة حسب المدى المختار ويعيد قياسها لتبدأ من الصفر. */
export function sliceRange(series: Point[], range: RangeKey): Point[] {
  const n = series.length;
  let from = 0;

  if (range === "1M") from = n - 31;
  else if (range === "3M") from = n - 92;
  else if (range === "6M") from = n - 183;
  else if (range === "YTD") {
    const end = series[n - 1].date;
    const jan1 = new Date(end.getFullYear(), 0, 1);
    const idx = series.findIndex((p) => p.date >= jan1);
    from = idx === -1 ? 0 : idx;
  }

  from = Math.max(0, Math.min(from, n - 2));
  const cut = series.slice(from);
  const base = cut[0].v;
  return cut.map((p) => ({ ...p, v: p.v - base }));
}

/** مسار SVG ناعم عبر منحنيات كاردينال. */
export function smoothPath(
  pts: { x: number; y: number }[],
  tension = 0.5
): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}
