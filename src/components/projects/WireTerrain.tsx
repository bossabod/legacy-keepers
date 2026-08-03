"use client";
import { useEffect, useRef } from "react";

/**
 * أرض تضاريس شبكية واحدة متصلة — Wireframe Terrain Field
 *
 * ليست جبالاً منفصلة ولا أهرامات ولا رسماً بيانياً.
 * إنها سطح أرضي واحد ممتد أفقياً، مغطّى بشبكة كثيفة من الخطوط
 * البيضاء الرفيعة، فيه عشرات الارتفاعات والانخفاضات المتصلة.
 *
 * الكاميرا ثابتة ومنخفضة قرب سطح الأرض. الحركة الوحيدة هي
 * إزاحة رأسية بطيئة جداً لرؤوس الشبكة عبر ضجيج ناعم.
 */

/* ------------------------------------------------------------------
   ضجيج قيمي ناعم (Value Noise) — أساس التضاريس والحركة
   ------------------------------------------------------------------ */
function makeNoise(seed: number) {
  const p = new Uint8Array(512);
  const perm = new Uint8Array(256);
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = perm[i];
    perm[i] = perm[j];
    perm[j] = t;
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h: number, x: number, y: number) => {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  };

  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];
    const x1 = grad(aa, xf, yf) * (1 - u) + grad(ba, xf - 1, yf) * u;
    const x2 = grad(ab, xf, yf - 1) * (1 - u) + grad(bb, xf - 1, yf - 1) * u;
    return (x1 * (1 - v) + x2 * v) * 0.5;
  };
}

const noise = makeNoise(0x9e3779b9);

/* ------------------------------------------------------------------
   حقل الارتفاع — أرض واحدة غير منتظمة
   ------------------------------------------------------------------ */

/**
 * ارتفاع الأرض عند نقطة (x, z) في فضاء العالم.
 * كل الأشكال تأتي من الضجيج نفسه، فلا توجد "جبال" مزروعة يدوياً.
 */
export function groundAt(x: number, z: number, t: number): number {
  // تشويه المجال — يمنع أن تبدو التضاريس كموجات منتظمة
  const wx = x + noise(x * 0.00045, z * 0.00045) * 520;
  const wz = z + noise(x * 0.00052 + 41.7, z * 0.00048 - 17.3) * 520;

  // طبقات fBm — من الشكل العام إلى التفاصيل الدقيقة
  let h = 0;
  let amp = 1;
  let f = 0.00055;
  for (let o = 0; o < 6; o++) {
    // طبقة واحدة فقط تتحرك مع الزمن، ببطء شديد وسعة صغيرة
    const drift = o === 1 ? t * 0.021 : o === 3 ? -t * 0.014 : 0;
    h += noise(wx * f + drift, wz * f) * amp;
    amp *= 0.5;
    f *= 2.07;
  }
  h /= 1.94;

  // تلال حادة قليلاً: طيّ القيم السالبة يعطي حوافّ وقمماً طبيعية
  const ridge = 1 - Math.abs(noise(wx * 0.00088 - 9.1, wz * 0.00082 + 4.4));
  h = h * 0.60 + (Math.pow(ridge, 2.6) - 0.42) * 0.95;

  /* قناع سعة كبير المقياس:
     أعلى ارتفاع في الجهة اليسرى، ثم انخفاض نسبي في الوسط،
     وارتفاعات متوسطة على اليمين — تماماً كتوزيع الصورة المرجعية.
     كل ذلك جزء من نفس الأرض، لا جبال منفصلة.                     */
  const nx = x / 3400; // ‎-1 يسار .. ‎+1 يمين
  const leftMass = Math.exp(-Math.pow((nx + 0.62) / 0.46, 2)) * 0.85;
  const midDip = -Math.exp(-Math.pow((nx - 0.02) / 0.30, 2)) * 0.30;
  const rightMass = Math.exp(-Math.pow((nx - 0.66) / 0.52, 2)) * 0.48;
  const mask = 0.62 + leftMass + midDip + rightMass;

  // الأرض ترتفع قليلاً كلما ابتعدت — يعطي إحساس العمق اللانهائي
  const depthLift = Math.min(1, Math.max(0, (z + 400) / 5200)) * 0.34;

  return h * (mask + depthLift) * 255;
}

/* ------------------------------------------------------------------
   المكوّن
   ------------------------------------------------------------------ */

export interface Anchor {
  id: string;
  x: number;
  z: number;
}

export interface Projected {
  id: string;
  /** إحداثيات الشاشة بالبكسل (CSS) */
  sx: number;
  sy: number;
  /** ارتفاع سطح الأرض في نفس النقطة، بالبكسل */
  groundY: number;
  visible: boolean;
}

interface Props {
  anchors: Anchor[];
  activeId: string | null;
  hoverId: string | null;
  onProject?: (pts: Projected[]) => void;
  className?: string;
}

/* أبعاد الشبكة — كثافة عالية مثل المرجع */
const COLS = 196;
const ROWS = 150;

/* مدى الأرض في فضاء العالم */
/** نصف زاوية الرؤية أفقياً — يضمن امتداد الشبكة خارج حافتي الشاشة */
const FAN = 1.35;
const Z_NEAR = 78;
const Z_FAR = 9000;

/* الكاميرا: منخفضة جداً وقريبة من السطح */
const CAM_H = 150;
const FOCAL = 760;

export default function WireTerrain({
  anchors,
  activeId,
  hoverId,
  onProject,
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ anchors, activeId, hoverId, onProject });
  state.current = { anchors, activeId, hoverId, onProject };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* عمق كل صف: تباعد غير خطي — الصفوف القريبة متباعدة
       (خلايا كبيرة واضحة) والبعيدة متقاربة (تفاصيل دقيقة) */
    const zOf = (r: number) => {
      const u = r / (ROWS - 1);
      return Z_NEAR + (Z_FAR - Z_NEAR) * Math.pow(u, 2.25);
    };

    /* الأفق يقع عند 34% من ارتفاع اللوحة — تحته الأرض،
       وفوقه خلفية سوداء خالصة */
    const horizon = () => H * 0.34;

    /** إسقاط منظوري لنقطة أرضية */
    const project = (x: number, z: number, h: number) => {
      const inv = FOCAL / z;
      return {
        sx: W * 0.5 + x * inv,
        sy: horizon() + (CAM_H - h) * inv * 1.02,
        inv,
      };
    };

    const t0 = performance.now();

    // مخازن معاد استخدامها — لا تخصيص داخل حلقة الرسم
    const px = new Float32Array(ROWS * COLS);
    const py = new Float32Array(ROWS * COLS);

    const draw = (now: number) => {
      const t = reduce ? 0 : (now - t0) / 1000;
      const { anchors: A, activeId: AID, hoverId: HID, onProject: OP } =
        state.current;

      ctx.clearRect(0, 0, W, H);

      const hz = horizon();

      /* ---- 1) حساب كل رؤوس الشبكة ---- */
      for (let r = 0; r < ROWS; r++) {
        const z = zOf(r);
        const inv = FOCAL / z;
        // اتساع أفقي ثابت بالنسبة للشاشة: نوزّع أعمدة كل صف على مروحة
        // زاوية واحدة، فيغطي الصف نفس عرض اللوحة مهما بَعُد عن الكاميرا.
        const half = z * FAN;
        const base = r * COLS;
        for (let c = 0; c < COLS; c++) {
          const x = -half + (2 * half * c) / (COLS - 1);
          const h = groundAt(x, z, t);
          px[base + c] = W * 0.5 + x * inv;
          py[base + c] = hz + (CAM_H - h) * inv * 1.02;
        }
      }

      /* ---- 2) الرسم على شرائح عمق ----
         كل شريحة تُرسم بضربة واحدة، فتبقى الكلفة منخفضة
         رغم عشرات الآلاف من الخطوط.                        */
      const BANDS = 16;
      for (let b = 0; b < BANDS; b++) {
        const r0 = Math.floor((b * (ROWS - 1)) / BANDS);
        const r1 = Math.floor(((b + 1) * (ROWS - 1)) / BANDS);
        const mid = (r0 + r1) / 2 / (ROWS - 1); // 0 = قريب، 1 = بعيد

        ctx.beginPath();

        for (let r = r0; r <= r1; r++) {
          const base = r * COLS;

          // خطوط عرضية (تتبع خط الأرض)
          let started = false;
          for (let c = 0; c < COLS; c++) {
            const X = px[base + c];
            const Y = py[base + c];
            if (X < -220 || X > W + 220) {
              started = false;
              continue;
            }
            if (!started) {
              ctx.moveTo(X, Y);
              started = true;
            } else ctx.lineTo(X, Y);
          }

          if (r >= r1) continue;
          const nxt = (r + 1) * COLS;

          // خطوط طولية + أقطار → خلايا مثلثية
          for (let c = 0; c < COLS; c++) {
            const X = px[base + c];
            if (X < -220 || X > W + 220) continue;
            ctx.moveTo(X, py[base + c]);
            ctx.lineTo(px[nxt + c], py[nxt + c]);
            if (c < COLS - 1) {
              ctx.moveTo(px[base + c + 1], py[base + c + 1]);
              ctx.lineTo(px[nxt + c], py[nxt + c]);
            }
          }
        }

        /* الشفافية: الصفوف البعيدة تتكاثف بصرياً، لذا نخفّض
           شدّتها كي لا تتحول إلى كتلة بيضاء صلبة عند الأفق */
        const alpha = 0.5 - mid * 0.34;
        ctx.strokeStyle = `rgba(255,255,255,${Math.max(0.075, alpha)})`;
        ctx.lineWidth = 0.55 + (1 - mid) * 0.5;
        ctx.stroke();
      }

      /* ---- 3) نقاط متفرقة عند بعض التقاطعات ---- */
      for (let r = Math.floor(ROWS * 0.3); r < ROWS; r++) {
        const near = 1 - r / (ROWS - 1);
        const step = near > 0.55 ? 3 : near > 0.3 ? 5 : 8;
        const base = r * COLS;
        for (let c = (r * 7) % step; c < COLS; c += step) {
          const X = px[base + c];
          if (X < 0 || X > W) continue;
          const Y = py[base + c];
          if (Y < hz - 40 || Y > H + 20) continue;
          ctx.beginPath();
          ctx.arc(X, Y, 0.5 + near * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.24 + near * 0.6})`;
          ctx.fill();
        }
      }

      /* ---- 4) إسقاط مراسي العناوين ---- */
      if (OP) {
        const out: Projected[] = [];
        for (const a of A) {
          const h = groundAt(a.x, a.z, t);
          const p = project(a.x, a.z, h);
          const g = project(a.x, a.z, 0);
          out.push({
            id: a.id,
            sx: p.sx,
            sy: p.sy,
            groundY: g.sy,
            visible: p.sx > -900 && p.sx < W + 900 && p.sy > hz - 90 && p.sy < H + 140,
          });

          // توهّج خفيف حول المنطقة عند التحويم أو التحديد
          const on = a.id === AID || a.id === HID;
          if (on) {
            const rad = (a.id === AID ? 150 : 110) * Math.max(0.4, p.inv);
            const gr = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, rad);
            gr.addColorStop(0, `rgba(255,255,255,${a.id === AID ? 0.2 : 0.13})`);
            gr.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = gr;
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
            ctx.fill();
          }

          // النقطة المثبّتة على سطح الأرض
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, on ? 2.6 : 1.7, 0, Math.PI * 2);
          ctx.fillStyle = on ? "#fff" : "rgba(255,255,255,0.82)";
          ctx.fill();
        }
        OP(out);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
