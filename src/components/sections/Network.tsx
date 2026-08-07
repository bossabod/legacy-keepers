"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import {
  MEMBERS, TOTAL_MEMBERS, LINKS, CLUSTERS, HUBS,
  ROADS_BY_CLASS, REGION_LABEL, type Member,
} from "@/lib/network-map";
import { WORLD_POLYGONS } from "@/lib/world-polygons";

/* ==================================================================
   Network — internal global operations intelligence map.
   A fully self-contained canvas world map (no tile CDN). Monochrome
   geographic terrain, classified road network, member nodes with
   breathing pulses, flowing encrypted-particle links, zoom/pan and a
   member intelligence panel. Consistent with OWNERS OF IMPACT.
   ================================================================== */

/* ---- palette ---- */
const OCEAN = "#07131F";
const OCEAN_EDGE = "#0a1c2e";
const TERRAIN = {
  mountain: "#183222",
  forest: "#1a2a1c",
  olive: "#22281c",
  plain: "#1a1c20",
  urban: "#23262b",
};
const ROAD = {
  highway: "rgba(210,218,226,0.20)",
  secondary: "rgba(165,175,186,0.13)",
  arterial: "rgba(140,150,160,0.10)",
  density: "rgba(122,42,52,0.32)",
};
const NODE_CORE = "rgba(240,244,249,0.92)";
const NODE_GLOW = "rgba(210,222,238,0.14)";

const RANKS_AR = ["", "الزائر", "أفق التكوين", "الحاجب", "كارينا", "المؤثر", "القيثار", "الميثاق", "مفاتيح الخلق", "أعمدة الخلق"];
const RANKS_EN = ["", "The Visitor", "Horizon of Formation", "The Chamberlain", "Karina", "The Influencer", "The Lyre", "The Covenant", "Keys of Creation", "Pillars of Creation"];

interface Pt { x: number; y: number }

export default function NetworkSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState({ cx: 0, cy: 0, scale: 1 });
  const viewRef = useRef(view);
  const [selected, setSelected] = useState<Member | null>(null);
  const hoverRef = useRef<number | null>(null);

  useEffect(() => { viewRef.current = view; }, [view]);

  const worldGeo = useMemo(() => {
    return WORLD_POLYGONS.map((poly) => {
      let latSum = 0, lonSum = 0;
      for (const [lon, lat] of poly) { latSum += lat; lonSum += lon; }
      const n = poly.length || 1;
      const lat = latSum / n;
      let base = TERRAIN.plain;
      if (lat > 50) base = TERRAIN.mountain;
      else if (lat > 30) base = TERRAIN.plain;
      else if (lat > -5) base = TERRAIN.olive;
      else if (lat > -32) base = TERRAIN.forest;
      else base = TERRAIN.mountain;
      // slight per-polygon variance
      const h = Math.abs((poly[0][0] * 31 + poly[0][1] * 17) % 1);
      return { poly, fill: base, v: h };
    });
  }, []);

  /* ----- projection & interactions ----- */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let raf = 0;
    let time = 0, last = performance.now();

    const resize = () => {
      const r = el.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // unit: world width fills the canvas width; height derived 2:1
    const unit = () => W / 360;

    const proj = (lon: number, lat: number, v: { cx: number; cy: number; scale: number }): Pt => {
      const u = unit();
      const wx = (lon + 180) * u;
      const wy = (90 - lat) * u;
      const wHalf = 180 * u / 2;
      return {
        x: (wx - v.cx) * v.scale + W / 2,
        y: (wy - v.cy) * v.scale + H / 2,
      };
    };

    // min zoom required to reveal each member (local clusters appear on zoom)
    const memberMinZoom = (m: Member) => {
      const cl = CLUSTERS.find((c) => c.city === m.cluster);
      if (cl?.hub || cl?.major) return 1;
      if (m.tier >= 7) return 1.6;
      return 3;
    };

    const render = () => {
      const now = performance.now();
      const dt = Math.min(50, now - last); last = now;
      time += dt * 0.001;
      const v = viewRef.current;
      const u = unit();

      ctx.clearRect(0, 0, W, H);

      // ---- ocean ----
      const og = ctx.createLinearGradient(0, 0, 0, H);
      og.addColorStop(0, "#0a1c2e");
      og.addColorStop(0.5, OCEAN);
      og.addColorStop(1, "#060f1a");
      ctx.fillStyle = og;
      ctx.fillRect(0, 0, W, H);

      // ---- land polygons (culled to viewport) ----
      ctx.lineWidth = 0.4;
      for (const { poly, fill, v: varv } of worldGeo) {
        ctx.beginPath();
        let started = false;
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const [lon, lat] of poly) {
          const p = proj(lon, lat, v);
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
          minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        }
        ctx.closePath();
        // cull off-screen polygons
        if (maxX < -40 || minX > W + 40 || maxY < -40 || minY > H + 40) continue;
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = "rgba(210,220,232,0.10)";
        ctx.stroke();
      }

      // ---- road network ----
      const projRoad = (lon: number, lat: number) => proj(lon, lat, v);
      drawRoads(ctx, ROADS_BY_CLASS.highway, ROAD.highway, 1.0, projRoad);
      drawRoads(ctx, ROADS_BY_CLASS.secondary, ROAD.secondary, 0.7, projRoad);
      drawRoads(ctx, ROADS_BY_CLASS.arterial, ROAD.arterial, 0.55, projRoad);
      drawRoads(ctx, ROADS_BY_CLASS.density, ROAD.density, 1.1, projRoad);

      // ---- urban density glow (burgundy) at major centres ----
      for (const cl of CLUSTERS) {
        if (!cl.major) continue;
        const p = proj(cl.lon, cl.lat, v);
        if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) continue;
        const r = (18 * v.scale);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, "rgba(122,42,52,0.20)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }

      // ---- links (connections) ----
      const visible = MEMBERS.map((m) => ({
        m, p: proj(m.lon, m.lat, v), show: v.scale >= memberMinZoom(m),
      }));
      const hovered = hoverRef.current;

      for (const link of LINKS) {
        const A = visible[link.a], B = visible[link.b];
        if (!A.show || !B.show) continue;
        if (hovered !== null && hovered !== link.a && hovered !== link.b) continue;
        const off = (A.p.x < -40 || A.p.x > W + 40 || A.p.y < -40 || A.p.y > H + 40 ||
                     B.p.x < -40 || B.p.x > W + 40 || B.p.y < -40 || B.p.y > H + 40);
        if (off) continue;
        const isOn = hovered !== null;
        const alpha = link.kind === "global" ? 0.20 : link.kind === "regional" ? 0.13 : 0.09;
        ctx.strokeStyle = isOn ? `rgba(235,242,250,${alpha + 0.14})` : `rgba(200,214,232,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(A.p.x, A.p.y); ctx.lineTo(B.p.x, B.p.y); ctx.stroke();
      }

      // ---- flowing particles along random links (encrypted traffic) ----
      const travel = 0.04 + (time * 0.05) % 1;
      for (let i = 0; i < 5; i++) {
        const link = LINKS[(Math.floor(time * 2) + i * 7) % LINKS.length];
        const A = visible[link.a], B = visible[link.b];
        if (!A.show || !B.show) continue;
        const f = (travel + i * 0.13) % 1;
        const px = A.p.x + (B.p.x - A.p.x) * f;
        const py = A.p.y + (B.p.y - A.p.y) * f;
        const a = Math.sin(f * Math.PI) * 0.5;
        ctx.fillStyle = `rgba(225,235,246,${a})`;
        ctx.beginPath(); ctx.arc(px, py, 1.1, 0, Math.PI * 2); ctx.fill();
      }

      // ---- member nodes ----
      for (const { m, p, show } of visible) {
        if (!show) continue;
        if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) continue;
        const cl = CLUSTERS.find((c) => c.city === m.cluster);
        const isHub = !!cl?.hub;
        const base = (isHub ? 4.2 : m.tier >= 7 ? 3 : 2.4) * Math.min(v.scale, 1.6);
        const isHover = hovered === m.id;
        const dim = hovered !== null && !isHover;

        // breathing pulse ring (slow, every ~4s, offset per member)
        const ph = (time * 0.25 + m.id * 0.77) % 1;
        const ringR = base + Math.sin(ph * Math.PI) * (6 * Math.min(v.scale, 1.3));
        ctx.strokeStyle = `rgba(215,227,240,${(1 - ph) * 0.28})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2); ctx.stroke();

        // glow
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, base * 3);
        gr.addColorStop(0, isHub ? "rgba(240,245,250,0.22)" : "rgba(210,222,238,0.12)");
        gr.addColorStop(1, "transparent");
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(p.x, p.y, base * 3, 0, Math.PI * 2); ctx.fill();

        if (dim) continue;
        // core
        ctx.fillStyle = isHover ? "#ffffff" : NODE_CORE;
        ctx.beginPath(); ctx.arc(p.x, p.y, isHover ? base + 1 : base, 0, Math.PI * 2); ctx.fill();

        // hub label
        if (isHub && v.scale < 3) {
          ctx.fillStyle = "rgba(200,214,232,0.5)";
          ctx.font = "500 8px var(--font-mono), monospace";
          ctx.textAlign = "center";
          ctx.fillText(m.city.toUpperCase(), p.x, p.y - base - 5);
        }
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    /* ---- pointer handling ---- */
    const hitTest = (cx: number, cy: number): Member | null => {
      const v = viewRef.current;
      const u = unit();
      let best: Member | null = null, bestD = 20 * Math.min(v.scale, 1.6);
      for (const m of MEMBERS) {
        if (viewRef.current.scale < memberMinZoom(m)) continue;
        const wx = (m.lon + 180) * u, wy = (90 - m.lat) * u;
        const x = (wx - v.cx) * v.scale + W / 2;
        const y = (wy - v.cy) * v.scale + H / 2;
        const d = Math.hypot(x - cx, y - cy);
        const cl = CLUSTERS.find((c) => c.city === m.cluster);
        const base = ((cl?.hub ? 4.2 : m.tier >= 7 ? 3 : 2.4)) * Math.min(v.scale, 1.6);
        if (d < Math.max(base + 4, 7) && d < bestD) { bestD = d; best = m; }
      }
      return best;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const m = hitTest(e.clientX - r.left, e.clientY - r.top);
      const id = m ? m.id : null;
      hoverRef.current = id;
    };
    const onLeave = () => { hoverRef.current = null; };
    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const m = hitTest(e.clientX - r.left, e.clientY - r.top);
      if (m) { setSelected(m); play("select"); }
      else setSelected(null);
    };

    /* zoom + pan */
    let dragging = false, moved = 0, lastPos = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => { dragging = true; moved = 0; lastPos = { x: e.clientX, y: e.clientY }; };
    const onDrag = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPos.x, dy = e.clientY - lastPos.y;
      lastPos = { x: e.clientX, y: e.clientY };
      if (Math.abs(dx) + Math.abs(dy) > 1) moved += Math.abs(dx) + Math.abs(dy);
      const v = viewRef.current;
      setView({ cx: v.cx - dx / v.scale, cy: v.cy - dy / v.scale, scale: v.scale });
    };
    const onUp = (e: PointerEvent) => { dragging = false; if (moved > 6) onClick(e as unknown as MouseEvent); };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const v = viewRef.current;
      const factor = e.deltaY < 0 ? 1.16 : 1 / 1.16;
      const ns = Math.max(1, Math.min(9, v.scale * factor));
      // zoom toward cursor
      const worldX = (mx - W / 2) / v.scale + v.cx;
      const worldY = (my - H / 2) / v.scale + v.cy;
      setView({ cx: worldX - (mx - W / 2) / ns, cy: worldY - (my - H / 2) / ns, scale: ns });
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onDrag);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onDrag);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [worldGeo]);

  const selectedRank = selected ? (ar ? RANKS_AR[selected.tier] : RANKS_EN[selected.tier]) : "";
  const regionLabel = selected ? REGION_LABEL[selected.region][ar ? "ar" : "en"] : "";

  return (
    <div className="relative w-full overflow-hidden bg-[#060f1a]" style={{ height: "calc(100vh - 66px)" }} dir={ar ? "rtl" : "ltr"}>
      <div ref={hostRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full cursor-grab active:cursor-grabbing" />
      </div>

      {/* HUD — top-left */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 select-none">
        <div className="rounded-[var(--radius-md)] border border-white/[0.08] bg-[#04070c]/80 px-4 py-3 backdrop-blur-md">
          <div className="text-[0.5rem] tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: "var(--font-mono)" }}>OOI · GLOBAL OPS</div>
          <div className="mt-1 text-[0.72rem] tracking-[0.1em] text-[#e8edf5]" style={{ fontFamily: "var(--font-luxury)" }}>
            {ar ? "شبكة العمليات الدولية" : "INTERNATIONAL OPERATIONS NETWORK"}
          </div>
          <div className="mt-2 flex gap-4 text-[0.46rem] tracking-[0.14em] text-[#4a515e]" style={{ fontFamily: "var(--font-mono)" }}>
            <span>{TOTAL_MEMBERS} {ar ? "عضو" : "MEMBERS"}</span>
            <span>{CLUSTERS.length} {ar ? "مدينة" : "CITIES"}</span>
            <span>{HUBS.length} {ar ? "عُقد مركزية" : "HUBS"}</span>
          </div>
        </div>
      </div>

      {/* HUD — bottom-right zoom */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
        <button onClick={() => { const v = viewRef.current; setView({ ...v, scale: Math.min(9, v.scale * 1.3) }); }} className="pointer-events-auto h-8 w-8 rounded-[var(--radius-sm)] border border-white/10 bg-[#04070c]/80 text-[#c3c9d3] backdrop-blur-md transition hover:text-white" style={{ fontFamily: "var(--font-mono)" }}>+</button>
        <button onClick={() => { const v = viewRef.current; setView({ cx: 0, cy: 0, scale: 1 }); }} className="pointer-events-auto h-8 w-8 rounded-[var(--radius-sm)] border border-white/10 bg-[#04070c]/80 text-[#c3c9d3] backdrop-blur-md transition hover:text-white" style={{ fontFamily: "var(--font-mono)" }}>⌖</button>
        <button onClick={() => { const v = viewRef.current; setView({ ...v, scale: Math.max(1, v.scale / 1.3) }); }} className="pointer-events-auto h-8 w-8 rounded-[var(--radius-sm)] border border-white/10 bg-[#04070c]/80 text-[#c3c9d3] backdrop-blur-md transition hover:text-white" style={{ fontFamily: "var(--font-mono)" }}>−</button>
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[0.46rem] tracking-[0.2em] text-[#4a515e]" style={{ fontFamily: "var(--font-mono)" }}>
        {ar ? "اسحب للتحريك · عجلة الفأرة للتكبير · انقر على عقدة" : "DRAG TO PAN · SCROLL TO ZOOM · CLICK A NODE"}
      </div>

      {/* Member panel */}
      {selected && (
        <aside className="absolute right-4 top-4 z-30 w-[min(300px,88vw)] border border-white/[0.1] bg-[#04070c]/90 p-5 backdrop-blur-xl" style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
          <button onClick={() => setSelected(null)} className="absolute right-3 top-3 text-[#5d6675] transition hover:text-white" aria-label="close"><X size={15} /></button>
          <div className="text-[0.46rem] tracking-[0.26em] text-[#5d6675]" style={{ fontFamily: "var(--font-mono)" }}>OOI · MEMBER RECORD</div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-[1.15rem] text-[#f0f4f9]" style={{ fontFamily: "var(--font-luxury)" }}>{selected.name}</span>
            <span className="text-[0.58rem] text-[#7b8494]" style={{ fontFamily: "var(--font-mono)" }}>{selected.code}</span>
          </div>
          <div className="mt-1 text-[0.56rem] tracking-[0.12em] text-[#8b95a5]" style={{ fontFamily: "var(--font-mono)" }}>
            {selected.city} · {selected.country}
          </div>
          <div className="mt-4 space-y-2 text-[0.6rem]" style={{ fontFamily: "var(--font-mono)" }}>
            <MRow label={ar ? "المعرّف" : "CODE"} value={selected.code} />
            <MRow label={ar ? "المنطقة" : "REGION"} value={regionLabel} />
            <MRow label={ar ? "الدولة" : "COUNTRY"} value={selected.country} />
            <MRow label={ar ? "الحالة" : "STATUS"} value={selected.status} />
            <MRow label={ar ? "المرتبة" : "RANK"} value={`${selected.tier} · ${selectedRank}`} />
            <MRow label={ar ? "عضو منذ" : "JOINED"} value={selected.joined} />
            <MRow label={ar ? "مشاريع نشطة" : "PROJECTS"} value={String(selected.projects)} />
            <MRow label={ar ? "اتصالات الشبكة" : "CONNECTIONS"} value={String(LINKS.filter((l) => l.a === selected.id || l.b === selected.id).length)} />
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[0.44rem] tracking-[0.14em] text-[#5d6675]" style={{ fontFamily: "var(--font-mono)" }}>
              <span>{ar ? "نشاط" : "ACTIVITY"}</span><span>{selected.activity}</span>
            </div>
            <div className="h-px w-full bg-white/[0.08]">
              <div className="h-px bg-[#dfe8f2]/70" style={{ width: `${selected.activity}%` }} />
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

function MRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[0.48rem] tracking-[0.12em] text-[#4a515e]">{label}</span>
      <span className="text-[#cdd5e0]">{value}</span>
    </div>
  );
}

function drawRoads(
  ctx: CanvasRenderingContext2D,
  roads: [number, number][][],
  color: string,
  width: number,
  proj: (lon: number, lat: number) => Pt
) {
  for (const pts of roads) {
    ctx.beginPath();
    let started = false;
    for (const [lon, lat] of pts) {
      const p = proj(lon, lat);
      if (!started) { ctx.moveTo(p.x, p.y); started = true; }
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
