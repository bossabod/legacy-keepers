"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import { BRANCHES, relatedOf, type Branch } from "@/components/rules/rules-archive";

/* ==================================================================
   Rules — "Enter the Knowledge Archive"
   A classified knowledge-network experience. No cards, no lists.

   Phase 0  idle     : nearly empty; one line + hint.
   Phase 1  explore  : press & drag — a liquid line grows from the
                       center; branches bloom from it as you travel.
   Phase 2  complete : once every branch is found, the network
                       reorganizes itself into a final sacred emblem.
   ================================================================== */

type Phase = "idle" | "explore" | "complete";

interface Node {
  id: string;
  idx: number;       // discovery order
  x: number;         // current / spawn position
  y: number;
  headX: number;     // point on the main line where it was born
  headY: number;
}

interface Pt {
  x: number;
  y: number;
}

const SPAWN_OFFSET = 78;   // distance a branch sits off the main line
const SPACING_RATIO = 0.16; // main-line travel needed per new branch (× min dim)

export default function RulesSection() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // drawing state kept in refs (no re-render per pointermove)
  const head = useRef<Pt>({ x: 0, y: 0 });
  const target = useRef<Pt>({ x: 0, y: 0 });
  const trail = useRef<Pt[]>([]);        // main line points
  const dist = useRef(0);                // cumulative distance travelled
  const spawning = useRef(0);            // how many branches spawned
  const drawing = useRef(false);
  const strokeStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const raf = useRef(0);

  const center = size.w && size.h ? { x: size.w / 2, y: size.h / 2 } : { x: 0, y: 0 };
  const spacing = Math.max(70, Math.min(size.w, size.h) * SPACING_RATIO);
  const total = BRANCHES.length;

  /* ---------------- sizing ---------------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
      const cx = r.width / 2;
      const cy = r.height / 2;
      head.current = { x: cx, y: cy };
      target.current = { x: cx, y: cy };
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------------- main animation loop (liquid line) ---------------- */
  const spawnNext = useCallback(
    (headPos: Pt) => {
      if (spawning.current >= total) return;
      const idx = spawning.current;
      const id = BRANCHES[idx].id;
      const ang = -Math.PI / 2 + (idx / total) * Math.PI * 2;
      const node: Node = {
        id,
        idx,
        headX: headPos.x,
        headY: headPos.y,
        x: headPos.x + Math.cos(ang) * SPAWN_OFFSET,
        y: headPos.y + Math.sin(ang) * SPAWN_OFFSET,
      };
      spawning.current += 1;
      setNodes((prev) => [...prev, node]);
      play("open");
    },
    [total]
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    let lastDraw = "";
    const loop = () => {
      raf.current = requestAnimationFrame(loop);
      if (!drawing.current) return;

      // liquid-light easing toward the cursor
      const h = head.current;
      const t = target.current;
      const k = 0.16;
      h.x += (t.x - h.x) * k;
      h.y += (t.y - h.y) * k;

      const last = trail.current[trail.current.length - 1];
      if (!last || Math.hypot(h.x - last.x, h.y - last.y) > 3) {
        trail.current.push({ x: h.x, y: h.y });
        if (trail.current.length > 220) trail.current.shift();
        if (last) dist.current += Math.hypot(h.x - last.x, h.y - last.y);
      }

      // spawn branches as the line travels
      while (dist.current >= spacing * (spawning.current + 1) && spawning.current < total) {
        spawnNext({ x: h.x, y: h.y });
      }

      // draw the main line (imperative, no re-render)
      const p = pathRef.current;
      if (p) {
        const d = trail.current
          .map((pt, i) => (i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`))
          .join(" ");
        if (d !== lastDraw) {
          p.setAttribute("d", d);
          lastDraw = d;
        }
      }
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [spawnNext, spacing, total]);

  /* ---------------- complete when all discovered ---------------- */
  useEffect(() => {
    if (nodes.length === total && phase !== "complete") {
      const t = setTimeout(() => {
        setPhase("complete");
        play("granted");
      }, 650);
      return () => clearTimeout(t);
    }
  }, [nodes.length, total, phase]);

  /* ---------------- pointer ---------------- */
  const onDown = (e: React.PointerEvent) => {
    const el = wrapRef.current!;
    const r = el.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    drawing.current = true;
    target.current = p;
    strokeStart.current = { x: p.x, y: p.y, t: Date.now() };
    if (phase === "idle") setPhase("explore");
    // resume from current head
    if (phase === "complete") return;
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const el = wrapRef.current!;
    const r = el.getBoundingClientRect();
    target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onUp = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    drawing.current = false;
    const el = wrapRef.current!;
    const r = el.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const s = strokeStart.current;
    const isClick = s && Math.hypot(p.x - s.x, p.y - s.y) < 8 && Date.now() - s.t < 500;
    if (isClick) {
      // clicking a discovered node opens it
      const hit = nodes.find((n) => Math.hypot(p.x - n.x, p.y - n.y) < 30);
      if (hit) {
        setSelected(hit.id);
        play("select");
      }
    }
  };

  /* ---------------- final sacred geometry ---------------- */
  const radius = Math.min(size.w, size.h) * 0.34;
  const finalPos = (i: number) => {
    const a = -Math.PI / 2 + (i / total) * Math.PI * 2;
    return {
      x: center.x + Math.cos(a) * radius,
      y: center.y + Math.sin(a) * radius,
    };
  };
  const final = useRef<{ x: number; y: number }[]>([]);
  useEffect(() => {
    final.current = Array.from({ length: total }, (_, i) => finalPos(i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, total]);

  const isComplete = phase === "complete";
  const selectedBranch: Branch | undefined = BRANCHES.find((b) => b.id === selected);

  /* highlight connected: related + immediate ring neighbours */
  const connectedSet = useCallback(
    (id: string | null): Set<string> => {
      const s = new Set<string>();
      if (!id) return s;
      s.add(id);
      relatedOf(id).forEach((r) => s.add(r));
      const idx = BRANCHES.findIndex((b) => b.id === id);
      if (idx >= 0) {
        s.add(BRANCHES[(idx + 1) % total].id);
        s.add(BRANCHES[(idx + total - 1) % total].id);
      }
      return s;
    },
    [total]
  );
  const hi = connectedSet(selected);

  /* ---------------- render ---------------- */
  return (
    <div
      ref={wrapRef}
      className="rules-archive"
      dir={ar ? "rtl" : "ltr"}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      style={{ touchAction: "none", userSelect: "none" }}
    >
      <style>{styles}</style>

      {/* ambient fog + particles */}
      <div className="ra-fog" aria-hidden="true" />
      <div className="ra-particles" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => (
          <i key={i} style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%`, animationDelay: `${(i % 11) * 0.9}s` }} />
        ))}
      </div>

      {/* main drawing SVG */}
      <svg className="ra-svg" aria-hidden="true">
        {/* explore connectors: born-point → node */}
        {!isComplete &&
          nodes.map((n) => (
            <line key={`c-${n.id}`} className="ra-branch" x1={n.headX} y1={n.headY} x2={n.x} y2={n.y} />
          ))}
        {/* the liquid main line */}
        <path ref={pathRef} className="ra-line" d="" />
        {/* final geometry: ring + spokes */}
        {isComplete && (
          <g className="ra-final">
            {Array.from({ length: total }).map((_, i) => {
              const a = finalPos(i);
              const b = finalPos((i + 1) % total);
              return (
                <motion.line
                  key={`ring-${i}`}
                  className="ra-ring"
                  initial={{ x1: a.x, y1: a.y, x2: a.x, y2: a.y, opacity: 0 }}
                  animate={{ x1: a.x, y1: a.y, x2: b.x, y2: b.y, opacity: 1 }}
                  transition={{ duration: 1.6, delay: 0.15 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}
            {nodes.map((n, i) => {
              const a = finalPos(i);
              return (
                <motion.line
                  key={`spoke-${n.id}`}
                  className="ra-spoke"
                  initial={{ x1: a.x, y1: a.y, x2: center.x, y2: center.y, opacity: 0 }}
                  animate={{ x1: a.x, y1: a.y, x2: center.x, y2: center.y, opacity: 1 }}
                  transition={{ duration: 1.8, delay: 0.2 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* center seal */}
      <div className="ra-center" aria-hidden="true">
        <motion.span
          animate={isComplete ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0.25 }}
          transition={{ duration: 2 }}
        />
      </div>

      {/* discovered nodes */}
      {nodes.map((n) => {
        const fp = finalPos(n.idx);
        const isSel = selected === n.id;
        const isHi = hi.has(n.id);
        const active = isSel || (isComplete && isHi);
        return (
          <motion.g
            key={n.id}
            className={`ra-node ${active ? "is-active" : ""}`}
            animate={{ x: isComplete ? fp.x : n.x, y: isComplete ? fp.y : n.y }}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <circle
              cx={0}
              cy={0}
              r={5}
              onPointerUp={(e) => {
                e.stopPropagation();
                setSelected(n.id);
                play("select");
              }}
            />
            <text x={0} y={-14} textAnchor="middle">
              {ar ? BRANCHES[n.idx].ar.title : BRANCHES[n.idx].en.title}
            </text>
          </motion.g>
        );
      })}

      {/* ------- idle entrance ------- */}
      {phase === "idle" && (
        <div className="ra-intro">
          <motion.p
            className="ra-intro-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          >
            {ar ? "ادخل إلى أرشيف المعرفة" : "Enter the Knowledge Archive"}
          </motion.p>
          <motion.p
            className="ra-intro-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.8 }}
          >
            {ar ? "اضغط مع الاستمرار واسحب للبدء" : "Press and drag to begin."}
          </motion.p>
        </div>
      )}

      {/* ------- progress (explore) ------- */}
      {phase === "explore" && !isComplete && (
        <div className="ra-progress">
          <span>{ar ? `اكتُشف ${nodes.length} من ${total}` : `Discovered ${nodes.length} / ${total}`}</span>
          <span className="ra-progress-bar"><motion.i animate={{ width: `${(nodes.length / total) * 100}%` }} transition={{ duration: 0.6 }} /></span>
        </div>
      )}

      {/* ------- completion message ------- */}
      {isComplete && (
        <motion.div
          className="ra-complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 1.2 }}
        >
          <span className="ra-complete-rule" />
          <p>{ar ? "اكتمل الأرشيف" : "The Archive is Complete"}</p>
          <span className="ra-complete-rule" />
        </motion.div>
      )}

      {/* ------- reading panel ------- */}
      {selectedBranch && (
        <motion.aside
          key={selected}
          className={`ra-panel ${ar ? "is-rtl" : "is-ltr"} ${isComplete ? "is-final" : ""}`}
          initial={{ opacity: 0, x: ar ? -40 : 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <button className="ra-close" onClick={() => setSelected(null)} aria-label="close">×</button>
          <p className="ra-panel-no">{String(selectedBranch.id.length).padStart(2, "0")} · {ar ? "سجل" : "RECORD"}</p>
          <h3 className="ra-panel-title">{ar ? selectedBranch.ar.title : selectedBranch.en.title}</h3>
          <p className="ra-panel-intro">{ar ? selectedBranch.ar.intro : selectedBranch.en.intro}</p>
          <div className="ra-panel-rule" />
          <p className="ra-panel-detail">{ar ? selectedBranch.ar.detail : selectedBranch.en.detail}</p>
          <div className="ra-panel-related">
            <span className="ra-panel-related-label">{ar ? "فروع متصلة" : "RELATED TOPICS"}</span>
            <div className="ra-panel-related-list">
              {(selected ? relatedOf(selected) : []).map((rid) => {
                const rb = BRANCHES.find((b) => b.id === rid)!;
                return (
                  <button key={rid} className="ra-chip" onClick={() => setSelected(rid)}>
                    {ar ? rb.ar.title : rb.en.title}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.aside>
      )}
    </div>
  );
}

const styles = `
  .rules-archive { position:relative; width:100%; height:calc(100svh - 132px); min-height:540px; overflow:hidden; background:radial-gradient(ellipse 80% 90% at 50% 50%, #08090c 0%, #020203 55%, #000 100%); color:#e9edf3; cursor:crosshair; }
  .rules-archive:after { content:""; position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse 60% 60% at 50% 50%, transparent 40%, rgba(0,0,0,.6) 100%); }

  .ra-fog { position:absolute; inset:0; pointer-events:none; opacity:.5; background:radial-gradient(ellipse 46% 46% at 50% 50%, rgba(160,175,190,.05) 0%, transparent 70%); }

  .ra-particles { position:absolute; inset:0; pointer-events:none; }
  .ra-particles i { position:absolute; width:1.5px; height:1.5px; border-radius:50%; background:#9aa5b3; opacity:.18; animation:ra-float 13s ease-in-out infinite; }
  @keyframes ra-float { 0%,100%{transform:translateY(0);opacity:.12} 50%{transform:translateY(-22px);opacity:.3} }

  .ra-svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .ra-line { fill:none; stroke:#e6edf6; stroke-width:1.4; stroke-linecap:round; stroke-linejoin:round; filter:drop-shadow(0 0 3px rgba(220,230,242,.45)) drop-shadow(0 0 10px rgba(220,230,242,.18)); }
  .ra-branch { stroke:#cfdbe8; stroke-width:0.8; stroke-opacity:.5; filter:drop-shadow(0 0 3px rgba(210,222,236,.35)); }
  .ra-ring { stroke:#dfe8f2; stroke-width:0.8; stroke-opacity:.55; filter:drop-shadow(0 0 4px rgba(215,227,240,.35)); }
  .ra-spoke { stroke:#9aa5b3; stroke-width:0.5; stroke-opacity:.4; }

  .ra-center { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); pointer-events:none; }
  .ra-center span { display:block; width:14px; height:14px; border-radius:50%; background:rgba(235,242,250,.4); box-shadow:0 0 12px rgba(230,238,248,.5), 0 0 34px rgba(230,238,248,.18); }

  .ra-node { cursor:pointer; pointer-events:auto; }
  .ra-node circle { fill:#0c0e12; stroke:#9aa5b3; stroke-width:1; transition:fill .4s, stroke .4s; }
  .ra-node text { fill:#6d7685; font-size:9px; letter-spacing:.08em; font-family:var(--font-ibm-mono),monospace; pointer-events:none; transition:fill .4s; }
  .ra-node.is-active circle { fill:#dfe8f2; stroke:#f4f8fd; box-shadow:none; }
  .ra-node.is-active text { fill:#eef2f7; }

  .ra-intro { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; pointer-events:none; text-align:center; }
  .ra-intro-title { margin:0; font-family:var(--font-luxury),Georgia,serif; font-weight:500; letter-spacing:.18em; font-size:clamp(1.1rem,2.4vw,1.7rem); color:#e6ecf3; text-shadow:0 0 24px rgba(220,230,242,.35); }
  .ra-intro-hint { margin:0; font-family:var(--font-ibm-mono),monospace; font-size:.58rem; letter-spacing:.34em; color:#5d6675; text-transform:uppercase; }

  .ra-progress { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:12px; font-family:var(--font-ibm-mono),monospace; font-size:.5rem; letter-spacing:.18em; color:#5d6675; white-space:nowrap; }
  .ra-progress-bar { display:block; width:150px; height:1px; background:rgba(255,255,255,.08); overflow:hidden; }
  .ra-progress-bar i { display:block; height:100%; background:#dfe8f2; box-shadow:0 0 6px rgba(220,230,242,.6); }

  .ra-complete { position:absolute; bottom:26px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:16px; white-space:nowrap; font-family:var(--font-luxury),Georgia,serif; letter-spacing:.16em; font-size:.8rem; color:#e6ecf3; text-shadow:0 0 18px rgba(220,230,242,.4); }
  .ra-complete-rule { display:block; width:52px; height:1px; background:linear-gradient(90deg,transparent,#dfe8f2); }
  .ra-complete p { margin:0; }

  .ra-panel { position:absolute; top:50%; transform:translateY(-50%); width:min(320px,88vw); z-index:10; padding:26px 26px 22px; border:1px solid rgba(255,255,255,.08); background:rgba(6,7,9,.82); backdrop-filter:blur(10px); box-shadow:0 30px 80px rgba(0,0,0,.7); }
  .ra-panel.is-ltr { right:clamp(14px,4vw,60px); }
  .ra-panel.is-rtl { left:clamp(14px,4vw,60px); }
  .ra-close { position:absolute; top:10px; right:14px; background:none; border:0; color:#6d7685; font-size:1.1rem; cursor:pointer; }
  .is-rtl .ra-close { right:auto; left:14px; }
  .ra-panel-no { margin:0; font-family:var(--font-ibm-mono),monospace; font-size:.5rem; letter-spacing:.26em; color:#5d6675; }
  .ra-panel-title { margin:14px 0 0; font-family:var(--font-luxury),Georgia,serif; font-size:clamp(1.2rem,2.2vw,1.6rem); font-weight:600; color:#f0f4f9; }
  .ra-panel-intro { margin:10px 0 0; font-size:.78rem; line-height:1.7; color:#aeb8c5; }
  .ra-panel-rule { width:46px; height:1px; margin:16px 0 12px; background:linear-gradient(90deg,#e2e9f2,transparent); }
  .ra-panel-detail { margin:0; font-size:.74rem; line-height:1.9; color:#8b95a5; }
  .ra-panel-related { margin-top:20px; }
  .ra-panel-related-label { display:block; font-family:var(--font-ibm-mono),monospace; font-size:.46rem; letter-spacing:.22em; color:#4a515e; margin-bottom:8px; }
  .ra-panel-related-list { display:flex; flex-wrap:wrap; gap:6px; }
  .ra-chip { border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.02); color:#9aa5b3; font-family:var(--font-ibm-mono),monospace; font-size:.5rem; letter-spacing:.06em; padding:5px 9px; cursor:pointer; transition:border-color .3s,color .3s; }
  .ra-chip:hover { border-color:rgba(255,255,255,.28); color:#eef2f7; }

  @media (max-width:820px) {
    .rules-archive { height:calc(100svh - 118px); }
    .ra-panel { top:auto; bottom:14px; right:50%!important; left:50%!important; transform:translateX(-50%); width:calc(100% - 28px); max-height:52vh; overflow-y:auto; }
  }
  @media (prefers-reduced-motion:reduce) { .rules-archive * { animation:none!important; transition:none!important; } }
`;
