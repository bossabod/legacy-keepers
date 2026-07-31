"use client";
import { useEffect, useRef } from "react";

/**
 * تضاريس شبكية سلكية متحركة — Canvas 2D بإسقاط ثلاثي الأبعاد يدوي.
 * قمم عالية في الخلف + شبكة نقاط في المقدمة، مطابق للمرجع البصري.
 */

export interface Summit {
  /** موضع القمة على المحور الأفقي في فضاء العالم (-1 .. 1) */
  wx: number;
  /** بُعد القمة (0 = الأقرب، 1 = الأبعد) */
  wz: number;
  /** ارتفاع القمة */
  height: number;
  /** نصف قطر تأثير القمة على التضاريس */
  spread: number;
}

interface Props {
  summits: Summit[];
  /** فهرس القمة المحددة — تتوهّج */
  activeIndex: number | null;
  /** فهرس القمة تحت المؤشر */
  hoverIndex: number | null;
  /** يُستدعى بمواضع القمم على الشاشة بعد كل رسم */
  onProject?: (pts: { x: number; y: number }[]) => void;
  className?: string;
}

/** ضجيج قيمي ناعم قابل للتكرار */
function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t: number) => t * t * (3 - 2 * t);
  const grad = (h: number, x: number, y: number) => {
    const u = h & 1 ? x : -x;
    const v = h & 2 ? y : -y;
    return u + v;
  };

  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    const x1 = grad(aa, xf, yf) * (1 - u) + grad(ba, xf - 1, yf) * u;
    const x2 = grad(ab, xf, yf - 1) * (1 - u) + grad(bb, xf - 1, yf - 1) * u;
    return (x1 * (1 - v) + x2 * v) * 0.5;
  };
}

export default function WireTerrain({
  summits,
  activeIndex,
  hoverIndex,
  onProject,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ summits, activeIndex, hoverIndex, onProject });
  stateRef.current = { summits, activeIndex, hoverIndex, onProject };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const noise = makeNoise(20120712);

    // شبكة التضاريس
    const COLS = 150;
    const ROWS = 92;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /** ارتفاع التضاريس عند نقطة في فضاء العالم */
    const heightAt = (wx: number, wz: number, t: number) => {
      const { summits: S } = stateRef.current;

      // تموّج أساسي متعدد الطبقات
      let base =
        noise(wx * 1.6 + t * 0.045, wz * 1.6) * 0.15 +
        noise(wx * 3.3, wz * 3.3 + t * 0.028) * 0.085 +
        noise(wx * 6.7, wz * 6.7) * 0.042 +
        noise(wx * 13.4, wz * 13.4) * 0.019 +
        noise(wx * 26, wz * 26) * 0.009;

      // القمم — نتوءات غاوسية
      for (let i = 0; i < S.length; i++) {
        const s = S[i];
        const dx = wx - s.wx;
        const dz = wz - s.wz;
        const d2 = (dx * dx) / (s.spread * s.spread) + (dz * dz) / (s.spread * s.spread * 0.55);
        // ذروة حادة: مزيج غاوسي + مخروط
        const dist = Math.sqrt(d2);
        const cone = Math.max(0, 1 - dist * 0.82);
        const g = Math.exp(-d2 * 2.2) * 0.55 + cone * cone * 0.72;
        // نتوءات صخرية على جسم الجبل
        const rough =
          noise(wx * 8 + i * 13, wz * 8) * 0.1 +
          noise(wx * 17, wz * 17 + i * 7) * 0.052 +
          noise(wx * 34, wz * 34 + i * 3) * 0.024 +
          Math.abs(noise(wx * 11 + i * 5, wz * 11)) * 0.06;
        base += g * s.height + rough * g * 1.25;
      }

      // تسطيح المقدمة تدريجيًا
      const flat = Math.min(1, Math.max(0, (wz - 0.02) / 0.34));
      return base * (0.32 + 0.68 * flat);
    };

    /** إسقاط نقطة عالم إلى إحداثيات الشاشة */
    const project = (wx: number, wz: number, hy: number) => {
      // منظور: الأبعد يقترب من خط الأفق ويضيق
      const depth = 0.28 + wz * 1.35;
      const scale = 1 / depth;
      const horizon = h * 0.30;
      const x = w * 0.5 + wx * w * 0.62 * scale;
      const y = horizon + (h * 0.72 - hy * h * 0.92) * scale * 0.92;
      return { x, y, scale };
    };

    const start = performance.now();

    const draw = (now: number) => {
      const t = reduce ? 0 : (now - start) / 1000;
      const { summits: S, activeIndex: AI, hoverIndex: HI, onProject: OP } =
        stateRef.current;

      ctx.clearRect(0, 0, w, h);

      // ===== توهّج خلف القمم =====
      for (let i = 0; i < S.length; i++) {
        const s = S[i];
        const hy = heightAt(s.wx, s.wz, t);
        const p = project(s.wx, s.wz, hy);
        const on = i === AI || i === HI;
        const r = (i === AI ? 190 : on ? 150 : 108) * p.scale;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(8, r));
        const a = i === AI ? 0.3 : on ? 0.2 : 0.1;
        g.addColorStop(0, `rgba(200,214,238,${a})`);
        g.addColorStop(1, "rgba(200,214,238,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(8, r), 0, Math.PI * 2);
        ctx.fill();
      }

      // ===== حساب الشبكة =====
      const grid: { x: number; y: number; s: number; hy: number }[][] = [];
      for (let r = 0; r < ROWS; r++) {
        const wz = 1 - r / (ROWS - 1); // من البعيد للقريب
        const row: { x: number; y: number; s: number; hy: number }[] = [];
        for (let c = 0; c < COLS; c++) {
          const wx = (c / (COLS - 1)) * 2 - 1;
          // اتساع أفقي مع الاقتراب لملء الإطار
          const spreadX = wx * (1 + (1 - wz) * 0.75);
          const hy = heightAt(spreadX, wz, t);
          const p = project(spreadX, wz, hy);
          row.push({ x: p.x, y: p.y, s: p.scale, hy });
        }
        grid.push(row);
      }

      // ===== الخطوط الطولية (تتبع العمق) =====
      ctx.lineWidth = 0.6;
      for (let c = 0; c < COLS; c += 1) {
        ctx.beginPath();
        let started = false;
        for (let r = 0; r < ROWS; r++) {
          const p = grid[r][c];
          if (p.x < -60 || p.x > w + 60) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(220,232,250,0.2)";
        ctx.stroke();
      }

      // ===== الخطوط العرضية =====
      for (let r = 0; r < ROWS; r++) {
        const depthT = r / (ROWS - 1); // 0 = بعيد، 1 = قريب
        ctx.beginPath();
        let started = false;
        for (let c = 0; c < COLS; c++) {
          const p = grid[r][c];
          if (p.x < -60 || p.x > w + 60) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else ctx.lineTo(p.x, p.y);
        }
        // الخطوط البعيدة أكثف بياضًا (كما في المرجع)، القريبة أخفت
        const alpha = 0.85 - depthT * 0.6;
        ctx.strokeStyle = `rgba(232,241,255,${Math.max(0.16, alpha)})`;
        ctx.lineWidth = 0.5 + (1 - depthT) * 0.55;
        ctx.stroke();
      }

      // ===== أقطار مثلثية في المقدمة =====
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(212,226,248,0.19)";
      ctx.beginPath();
      for (let r = Math.floor(ROWS * 0.42); r < ROWS - 1; r++) {
        for (let c = 0; c < COLS - 1; c += 1) {
          const a = grid[r][c];
          const b = grid[r + 1][c + 1];
          if (a.x < -40 || a.x > w + 40) continue;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
      ctx.stroke();

      // ===== نقاط العُقد في المقدمة =====
      for (let r = Math.floor(ROWS * 0.4); r < ROWS; r++) {
        const depthT = r / (ROWS - 1);
        const step = depthT > 0.72 ? 1 : 2;
        for (let c = 0; c < COLS; c += step) {
          const p = grid[r][c];
          if (p.x < 0 || p.x > w) continue;
          const rad = 0.55 + depthT * 1.75;
          const a = 0.3 + depthT * 0.62;
          ctx.fillStyle = `rgba(236,243,255,${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ===== قمم لامعة =====
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < S.length; i++) {
        const s = S[i];
        const hy = heightAt(s.wx, s.wz, t);
        const p = project(s.wx, s.wz, hy);
        pts.push({ x: p.x, y: p.y });

        const on = i === AI || i === HI;
        const rr = (i === AI ? 3.4 : on ? 2.8 : 1.9) * Math.max(0.55, p.scale);
        ctx.fillStyle =
          i === AI ? "#ffffff" : on ? "rgba(240,246,255,0.95)" : "rgba(226,236,250,0.7)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
        ctx.fill();

        if (i === AI) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
          ctx.strokeStyle = `rgba(255,255,255,${0.25 + pulse * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rr + 5 + pulse * 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      OP?.(pts);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
