"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";
import ImpactPyramid, { type PyramidHandle } from "@/components/ladder/ImpactPyramid";
import { LADDER } from "@/components/ladder/pyramid-data";

type Line = { x1: number; y1: number; x2: number; y2: number };

export default function LadderSection({ data }: { data: AppData }) {
  const { lang } = useApp();
  const [opened, setOpened] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const ar = lang === "ar";

  const active = hovered ?? selected;
  const sel = active === null ? null : LADDER[active];
  const holderCount =
    active === null ? null : data.ranks.find((rank) => rank.ord === active + 1)?.holders ?? 0;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const rankRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pyramidHandle = useRef<PyramidHandle | null>(null);

  const [lines, setLines] = useState<Line[]>([]);

  const open = () => {
    setOpened(true);
    play("open");
  };

  const pick = (index: number) => {
    setSelected((c) => (c === index ? null : index));
    play("select");
  };

  // After the pyramid becomes sharp (~1.7s), reveal the connector lines.
  useEffect(() => {
    if (!opened) return;
    const id = setTimeout(() => setRevealed(true), 1700);
    return () => clearTimeout(id);
  }, [opened]);

  // Compute fixed screen-space connector lines (pyramid layer → rank text).
  const recompute = useCallback(() => {
    if (!opened) return;
    const stage = stageRef.current;
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    const handle = pyramidHandle.current;
    if (!stage || !canvas || !handle) return;
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const ys = handle.getLayerYs();
    const xStart = canvasRect.left + canvasRect.width / 2 - stageRect.left;
    const next = LADDER.map((_, i) => {
      const rankEl = rankRefs.current[i];
      if (!rankEl) return { x1: xStart, y1: 0, x2: xStart, y2: 0 };
      const rr = rankEl.getBoundingClientRect();
      const y1 = canvasRect.top + ys[i] - stageRect.top;
      const y2 = rr.top + rr.height / 2 - stageRect.top;
      return { x1: xStart, y1, x2: rr.right - stageRect.left, y2 };
    });
    setLines(next);
  }, [opened]);

  useEffect(() => {
    recompute();
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(stage);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [recompute]);

  return (
    <section
      className={`impact-ladder ${ar ? "is-rtl" : "is-ltr"} ${opened ? "is-open" : ""}`}
      aria-label={ar ? "سلم الأثر" : "Impact Ladder"}
      dir={ar ? "rtl" : "ltr"}
    >
      <style>{impactStyles}</style>

      <header className="impact-heading">
        <p className="impact-title">{ar ? "سلم الأثر" : "IMPACT LADDER"}</p>
        <span className="impact-tagline">{ar ? "تسعة مستويات. صعودٌ واحد." : "Nine levels. One ascent."}</span>
      </header>

      <div className="impact-stage" ref={stageRef}>
        <nav className={`rank-list ${revealed ? "is-lit" : ""}`} aria-label={ar ? "مراتب سلم الأثر" : "Impact Ladder ranks"}>
          {LADDER.map((tier, index) => {
            const isOn = active === index;
            return (
              <button
                key={tier.en.name}
                ref={(el) => { rankRefs.current[index] = el; }}
                className={`rank-item ${isOn ? "is-on" : ""}`}
                onMouseEnter={() => { setHovered(index); play("hover"); }}
                onMouseLeave={() => setHovered(null)}
                onClick={() => pick(index)}
                aria-pressed={selected === index}
              >
                <span className="rank-no">{String(index + 1).padStart(2, "0")}</span>
                <span className="rank-name">{ar ? tier.ar.name : tier.en.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="pyramid-wrap">
          <div className={`impact-canvas ${opened ? "" : "is-blurred"}`} ref={canvasWrapRef}>
            <ImpactPyramid
              opened={opened}
              activeIndex={active}
              onHover={setHovered}
              onPick={pick}
              handleRef={pyramidHandle}
            />
          </div>

          {/* Volumetric fog + ghost call-to-open, covering the closed pyramid */}
          <AnimatePresence>
            {!opened && (
              <motion.div
                key="fog"
                className="pyramid-fog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              >
                <motion.button
                  className="ghost-open"
                  onClick={open}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
                  transition={{ duration: 1.6, delay: 0.4 }}
                  aria-label={ar ? "فتح المسرح الهرمي" : "Open the pyramid"}
                >
                  <span className="ghost-glow" aria-hidden="true" />
                  <span className="ghost-text">{ar ? "فتح المسرح الهرمي" : "OPEN THE PYRAMID"}</span>
                  <span className="ghost-line" aria-hidden="true" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fixed HUD connector lines: pyramid layer → rank list */}
          <svg
            className={`connectors ${opened ? "is-visible" : ""} ${revealed ? "is-lit" : ""}`}
            aria-hidden="true"
          >
            {lines.map((ln, i) => (
              <line
                key={i}
                className={active === i ? "is-on" : ""}
                x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2}
              />
            ))}
          </svg>
        </div>

        <aside className="info-panel" aria-live="polite">
          <AnimatePresence mode="wait">
            {sel && active !== null ? (
              <motion.article
                key={active}
                initial={{ opacity: 0, x: 24, filter: "blur(5px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
                transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
                className="info-record"
              >
                <p className="info-num">{String(active + 1).padStart(2, "0")}<span className="info-num-slash"> / 09</span></p>
                <h2 className="info-name">{ar ? sel.ar.name : sel.en.name}</h2>
                <p className="info-overview">{ar ? sel.ar.overview : sel.en.overview}</p>
                <div className="info-rule" />
                <dl className="info-meta">
                  <div><dt>{ar ? "الوصف" : "DESCRIPTION"}</dt><dd>{ar ? sel.ar.description : sel.en.description}</dd></div>
                  <div><dt>{ar ? "المتطلبات" : "REQUIREMENTS"}</dt><dd>{ar ? sel.ar.requirements : sel.en.requirements}</dd></div>
                  <div><dt>ACCESS LEVEL</dt><dd>{ar ? sel.ar.access : sel.en.access}</dd></div>
                  <div><dt>{ar ? "الامتيازات" : "PRIVILEGES"}</dt><dd>{ar ? sel.ar.privileges : sel.en.privileges}</dd></div>
                  <div><dt>{ar ? "الحالة" : "STATUS"}</dt><dd>{ar ? sel.ar.status : sel.en.status}</dd></div>
                  <div><dt>{ar ? "ملاحظات العضوية" : "MEMBERSHIP"}</dt><dd>{ar ? sel.ar.membership : sel.en.membership}</dd></div>
                  {holderCount !== null && <div><dt>{ar ? "الحَمَلة" : "HOLDERS"}</dt><dd>{holderCount}</dd></div>}
                </dl>
              </motion.article>
            ) : opened ? (
              <motion.p
                key="instruction"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="info-instruction"
              >
                {ar
                  ? "اختر مرتبةً لتكشف سجلّها الكامل — الوصف، الامتيازات، والمكانة داخل الدائرة."
                  : "Select a rank to reveal its full record — description, privileges, and standing within the circle."}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </aside>
      </div>

      <footer className="impact-foot">
        <span>OOI / CLASSIFIED HIERARCHY / 09 LEVELS</span>
        <span className="impact-foot-dot" />
      </footer>
    </section>
  );
}

const impactStyles = `
  .impact-ladder { position:relative; isolation:isolate; width:100vw; margin-inline:calc(50% - 50vw); min-height:calc(100svh - 66px); display:flex; flex-direction:column; overflow:hidden; color:#e9edf3; background:radial-gradient(ellipse 70% 90% at 50% 50%, #0a0c10 0%, #030405 45%, #000 100%); }
  .impact-ladder:before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.5; background:radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, rgba(0,0,0,.6) 78%, #000 100%); }
  .impact-ladder:after { content:""; position:absolute; inset:0; pointer-events:none; opacity:.25; background:repeating-linear-gradient(90deg, transparent 0, transparent 120px, rgba(191,205,220,.012) 121px); }

  .impact-heading { position:relative; z-index:3; padding:24px clamp(20px,4vw,64px) 0; }
  .impact-title, .impact-tagline, .info-num, .info-meta dt, .impact-foot, .rank-no, .ghost-open { font-family:var(--font-ibm-mono), monospace; }
  .impact-title { margin:0; font-size:.68rem; letter-spacing:.3em; color:#eef2f7; }
  .impact-tagline { display:block; margin-top:9px; color:#5d6774; font-size:.54rem; letter-spacing:.16em; }

  /* stage is always laid out left→right so the rank list stays on the left */
  .impact-stage { position:relative; z-index:2; flex:1; min-height:0; display:flex; align-items:center; gap:clamp(10px,2.5vw,44px); padding:4px clamp(14px,3vw,56px) 14px; direction:ltr; }
  .impact-stage > * { flex:0 0 auto; }

  .rank-list { display:flex; flex-direction:column; gap:3px; width:clamp(150px,17vw,210px); order:1; transition:opacity .9s ease; }
  .rank-item { display:flex; align-items:baseline; gap:12px; padding:8px 8px; cursor:pointer; background:transparent; border:0; color:#4d5662; transition:color .35s ease; position:relative; }
  .is-rtl .rank-item { text-align:right; }
  .rank-no { font-size:.55rem; letter-spacing:.16em; color:#3f4752; }
  .rank-name { font-family:var(--font-luxury), Georgia, serif; font-size:.9rem; font-weight:500; letter-spacing:.03em; }
  .rank-list.is-lit .rank-item { color:#6e7784; }
  .rank-list.is-lit .rank-no { color:#56606c; }
  .rank-item:after { content:""; position:absolute; bottom:2px; left:8px; right:8px; height:1px; background:linear-gradient(90deg,#dfe8f2,transparent); opacity:0; transform:scaleX(0); transform-origin:left; transition:opacity .35s ease, transform .35s ease; }
  .rank-item:hover { color:#cfd7e1; }
  .rank-item:hover:after { opacity:.5; transform:scaleX(1); }
  .rank-item.is-on { color:#f2f5f9; text-shadow:0 0 14px rgba(225,234,246,.4); }
  .rank-item.is-on:after { opacity:.9; transform:scaleX(1); }
  .rank-item.is-on .rank-no { color:#aebdcd; }

  .pyramid-wrap { flex:1; min-width:0; position:relative; display:flex; align-items:center; justify-content:center; order:2; }
  .impact-canvas { width:100%; height:clamp(420px, 72svh, 780px); transition:filter 2s ease, opacity 2s ease; }
  /* Before opening: heavily obscured by gaussian blur, reduced contrast /
     reflections and slight opacity — the pyramid hides inside smoke. */
  .impact-canvas.is-blurred { filter:blur(10px) brightness(.5) contrast(.78) saturate(.55); opacity:.66; }

  /* Volumetric fog covering the closed pyramid + ghost call-to-open */
  .pyramid-fog { position:absolute; inset:-4%; z-index:5; display:flex; align-items:center; justify-content:center; pointer-events:none; background:radial-gradient(ellipse 54% 60% at 50% 50%, rgba(140,155,172,.12) 0%, rgba(120,135,152,.06) 34%, rgba(50,60,72,.045) 60%, transparent 80%); backdrop-filter:blur(2.5px); }
  .ghost-open { pointer-events:auto; cursor:pointer; position:relative; display:flex; flex-direction:column; align-items:center; gap:18px; background:transparent; border:0; padding:30px 44px; color:#dfe8f1; }
  .ghost-glow { position:absolute; inset:50%; transform:translate(-50%,-50%); width:70%; height:70%; background:radial-gradient(ellipse 50% 50% at 50% 50%, rgba(225,234,246,.16) 0%, transparent 70%); filter:blur(14px); pointer-events:none; }
  .ghost-text { position:relative; color:#e2ebf4; font-size:.64rem; letter-spacing:.4em; text-shadow:0 0 16px rgba(228,236,246,.7), 0 0 42px rgba(228,236,246,.35); transition:letter-spacing .6s ease; }
  .is-rtl .ghost-text { letter-spacing:.14em; }
  .ghost-line { position:relative; width:64px; height:1px; background:linear-gradient(90deg,transparent,rgba(235,242,250,.85),transparent); box-shadow:0 0 10px rgba(235,242,250,.6); transition:width .6s ease, box-shadow .6s ease; }
  .ghost-open:hover .ghost-text { letter-spacing:.46em; }
  .is-rtl .ghost-open:hover .ghost-text { letter-spacing:.18em; }
  .ghost-open:hover .ghost-line { width:110px; box-shadow:0 0 18px rgba(240,246,253,.85); }

  /* Fixed HUD connector lines: thin silver, crisp, never rotating */
  .connectors { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:6; opacity:0; transition:opacity .9s ease; }
  .connectors.is-visible.is-lit { opacity:1; }
  .connectors line { stroke:#dfe8f2; stroke-width:1; stroke-opacity:.24; vector-effect:non-scaling-stroke; filter:drop-shadow(0 0 2px rgba(220,230,242,.3)); transition:stroke-opacity .35s ease, stroke .35s ease; }
  .connectors line.is-on { stroke:#f4f8fd; stroke-opacity:.85; filter:drop-shadow(0 0 3px rgba(235,242,250,.7)); }

  .info-panel { width:min(92vw, 350px); display:flex; align-items:center; min-height:300px; order:3; }
  .info-record { border-inline-start:1px solid rgba(214,226,238,.18); padding-inline-start:clamp(16px,2.5vw,32px); }
  .is-rtl .info-record { border-inline-start:0; border-inline-end:1px solid rgba(214,226,238,.18); padding-inline-start:0; padding-inline-end:clamp(16px,2.5vw,32px); text-align:right; }
  .info-num { margin:0 0 8px; color:#8fa0b6; font-size:.6rem; letter-spacing:.28em; }
  .info-num-slash { color:#4d5662; }
  .info-name { margin:0; font-family:var(--font-luxury), Georgia, serif; font-weight:600; letter-spacing:.03em; font-size:clamp(1.7rem,3vw,2.6rem); color:#f4f7fb; text-shadow:0 0 20px rgba(225,234,246,.13); }
  .info-overview { max-width:300px; margin:12px 0 0; color:#a6b0bd; font-size:.82rem; line-height:1.8; }
  .info-rule { width:44px; height:1px; margin:18px 0 14px; background:linear-gradient(90deg,#e9eff6,transparent); }
  .is-rtl .info-rule { margin-inline-start:auto; background:linear-gradient(270deg,#e9eff6,transparent); }
  .info-meta { margin:0; display:grid; gap:10px; }
  .info-meta div { display:grid; grid-template-columns:118px 1fr; gap:12px; }
  .is-rtl .info-meta div { grid-template-columns:1fr 118px; }
  .info-meta dt { color:#5e6976; font-size:.5rem; letter-spacing:.14em; padding-top:2px; }
  .info-meta dd { margin:0; color:#d6dee7; font-size:.64rem; line-height:1.5; }
  .info-instruction { margin:0; max-width:230px; color:#5b6470; font-family:var(--font-ibm-mono), monospace; font-size:.56rem; letter-spacing:.08em; line-height:2; border-inline-start:1px solid rgba(214,226,238,.13); padding-inline-start:clamp(16px,2.5vw,32px); }
  .is-rtl .info-instruction { border-inline-start:0; border-inline-end:1px solid rgba(214,226,238,.13); padding-inline-start:0; padding-inline-end:clamp(16px,2.5vw,32px); text-align:right; }

  .impact-foot { position:relative; z-index:3; display:flex; align-items:center; gap:10px; padding:4px clamp(14px,3vw,56px) 14px; color:rgba(138,152,168,.45); font-size:.48rem; letter-spacing:.22em; }
  .impact-foot-dot { width:4px; height:4px; border-radius:50%; background:#c3cdd9; box-shadow:0 0 6px rgba(220,230,242,.8); }

  @media (max-width:980px) {
    .rank-list { width:clamp(130px,16vw,180px); }
    .rank-name { font-size:.8rem; }
  }
  @media (max-width:820px) {
    .impact-ladder { min-height:calc(100svh - 56px); }
    .impact-heading { padding-top:18px; }
    .impact-stage { flex-direction:column; gap:4px; padding-inline:16px; align-items:stretch; }
    .rank-list { width:100%; flex-direction:row; flex-wrap:wrap; gap:2px; justify-content:center; }
    .rank-item { padding:6px 8px; }
    .rank-no { display:none; }
    .rank-item:after { display:none; }
    .impact-canvas { height:min(54svh, 460px); }
    .connectors { display:none; }
    .info-panel { width:100%; min-height:0; padding:4px 0 14px; }
    .info-record, .is-rtl .info-record { border-inline-start:0; border-inline-end:0; border-top:1px solid rgba(214,226,238,.18); padding:12px 2px 0; }
    .info-overview { max-width:100%; }
    .ghost-open { letter-spacing:.22em; }
  }
`;
