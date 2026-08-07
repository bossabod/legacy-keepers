"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { play } from "@/lib/sound";

/* ==================================================================
   Manifesto — a shared minimalist branching layout.

   One central concept at the top; thin white connection lines radiate
   from it toward many topics. The lines ARE the navigation. No cards,
   no boxes, no panels — pure editorial space, thin lines, minimal type.

   Used identically by the Identity, Rules and Objectives pages (each
   with its own title, centre label and branch set).
   ================================================================== */

export interface Branch {
  id: string;
  label: string;
  subtitle: string;
  detail: string;
  related?: string[];
}

interface Props {
  eyebrow: string;
  title: string;
  centerLabel: string;
  centerNote?: string;
  branches: Branch[];
  ar?: boolean;
}

/* Node coordinates (percent of container). Two symmetrical columns
   radiating down-left and down-right from the centre point. */
const CENTER_X = 50;
const CENTER_Y = 23;
const L_COL = [25, 25, 25, 25, 25];
const R_COL = [75, 75, 75, 75, 75];
const YS = [40, 52, 64, 76, 88];

function position(i: number, total: number) {
  const half = Math.ceil(total / 2);
  const left = i % 2 === 0;
  const col = left ? i / 2 : (i - 1) / 2;
  const row = col % half;
  const x = left ? 22 : 78;
  const y = YS[Math.min(row, YS.length - 1)];
  return { x, y };
}

export default function Manifesto({ eyebrow, title, centerLabel, centerNote, branches, ar }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const inView = useInView(hostRef, { once: true, amount: 0.1 });

  const toggle = (id: string) => {
    setExpanded((cur) => (cur === id ? null : id));
    play("select");
  };

  const total = branches.length;

  return (
    <div className={`manifesto ${ar ? "is-rtl" : "is-ltr"}`} dir={ar ? "rtl" : "ltr"} ref={hostRef}>
      <style>{manifestoStyles}</style>

      {/* ---- Header: title fades in ---- */}
      <header className="mn-head">
        <motion.p
          className="mn-eyebrow"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1.2 }}
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          className="mn-title"
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h1>
      </header>

      {/* ---- Field: centre point + lines + branches ---- */}
      <div className="mn-field">
        {/* SVG connection lines */}
        <svg className="mn-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {branches.map((b, i) => {
            const { x, y } = position(i, total);
            const isOn = hovered === b.id;
            const isDim = hovered !== null && !isOn;
            return (
              <motion.line
                key={b.id}
                className="mn-line"
                x1={CENTER_X} y1={CENTER_Y}
                x2={x} y2={y}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: isDim ? 0.12 : 1 }}
                transition={{ duration: 1.4, delay: 0.5 + i * 0.12, ease: "easeOut" }}
              />
            );
          })}
        </svg>

        {/* central concept point */}
        <div className="mn-center" style={{ left: `${CENTER_X}%`, top: `${CENTER_Y}%` }}>
          <motion.div
            className="mn-center-ring"
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 1.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mn-center-label">{centerLabel}</span>
            {centerNote && <span className="mn-center-note">{centerNote}</span>}
          </motion.div>
        </div>

        {/* branch nodes */}
        {branches.map((b, i) => {
          const { x, y } = position(i, total);
          const isOn = hovered === b.id;
          const isExpanded = expanded === b.id;
          const isDim = hovered !== null && !isOn;
          return (
            <div
              key={b.id}
              className="mn-node"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => { setHovered(b.id); play("hover"); }}
              onMouseLeave={() => setHovered(null)}
            >
              <motion.div
                className={`mn-node-card ${isOn ? "is-on" : ""} ${isDim ? "is-dim" : ""}`}
                initial={{ opacity: 0, y: 6 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.9, delay: 0.7 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  className="mn-node-head"
                  onClick={() => toggle(b.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="mn-node-dot" />
                  <span className="mn-node-label">{b.label}</span>
                  <span className="mn-node-arrow">{isExpanded ? "−" : "+"}</span>
                </button>
                <p className={`mn-node-sub ${isOn ? "is-on" : ""}`}>{b.subtitle}</p>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="mn-node-detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="mn-node-rule" />
                      <p className="mn-node-text">{b.detail}</p>
                      {b.related && b.related.length > 0 && (
                        <div className="mn-node-related">
                          <span className="mn-related-label">{ar ? "متصل بـ" : "RELATED"}</span>
                          <div className="mn-related-list">
                            {b.related.map((rid) => (
                              <button
                                key={rid}
                                className="mn-related-chip"
                                onClick={() => { setExpanded(rid); play("open"); }}
                              >
                                {branches.find((br) => br.id === rid)?.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* footer note */}
      <footer className="mn-foot">
        <span>OOI · MANIFESTO</span>
        <span>{branches.length} {ar ? "موضوع" : "TOPICS"}</span>
      </footer>
    </div>
  );
}

const manifestoStyles = `
  .manifesto { position:relative; width:100%; min-height:calc(100svh - 150px); color:#e9edf3; background:#000; }
  .manifesto:before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.5; background:radial-gradient(ellipse 60% 55% at 50% 30%, rgba(255,255,255,.018), transparent 70%); }

  .mn-head { position:relative; z-index:2; text-align:center; padding:34px clamp(16px,4vw,60px) 0; }
  .mn-eyebrow { margin:0; font-family:var(--font-ibm-mono),monospace; font-size:.54rem; letter-spacing:.36em; color:#5d6675; }
  .mn-title { margin:18px 0 0; font-family:var(--font-luxury),Georgia,serif; font-weight:500; letter-spacing:.06em; font-size:clamp(1.6rem,4vw,2.8rem); color:#f2f5f9; }

  .mn-field { position:relative; z-index:1; height:calc(100svh - 150px); min-height:600px; }
  .mn-svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .mn-line { stroke:#dfe8f2; stroke-width:0.6; opacity:0; }

  .mn-center { position:absolute; transform:translate(-50%,-50%); }
  .mn-center-ring { display:flex; flex-direction:column; align-items:center; justify-content:center; width:120px; height:120px; border-radius:50%; border:1px solid rgba(235,242,250,.5); box-shadow:0 0 30px rgba(210,222,236,.18), inset 0 0 24px rgba(210,222,236,.06); background:radial-gradient(circle, rgba(20,22,26,.9), #000 78%); }
  .mn-center-label { font-family:var(--font-luxury),Georgia,serif; font-size:.74rem; letter-spacing:.14em; color:#eef2f7; text-align:center; padding:0 12px; }
  .mn-center-note { margin-top:5px; font-family:var(--font-ibm-mono),monospace; font-size:.4rem; letter-spacing:.2em; color:#5d6675; }

  .mn-node { position:absolute; transform:translate(-50%,-50%); width:min(300px,80vw); }
  .mn-node-card { transition:opacity .5s ease, filter .5s ease; }
  .mn-node-card.is-dim { opacity:.16; filter:grayscale(1); }
  .mn-node-head { display:flex; align-items:center; gap:10px; background:none; border:0; cursor:pointer; padding:4px 2px; width:100%; }
  .mn-node-dot { width:6px; height:6px; border-radius:50%; background:#9aa5b3; box-shadow:0 0 8px rgba(210,222,236,.5); transition:background .3s, box-shadow .3s; }
  .mn-node-label { font-family:var(--font-luxury),Georgia,serif; font-size:clamp(1rem,1.7vw,1.25rem); letter-spacing:.04em; color:#cdd5e0; transition:color .3s, transform .3s; }
  .mn-node-arrow { margin-inline-start:auto; font-family:var(--font-ibm-mono),monospace; font-size:.7rem; color:#4a515e; transition:color .3s; }
  .mn-node-card.is-on .mn-node-dot { background:#f4f8fd; box-shadow:0 0 12px rgba(240,246,253,.8); }
  .mn-node-card.is-on .mn-node-label { color:#ffffff; }
  .mn-node-card.is-on .mn-node-arrow { color:#eef2f7; }
  .mn-node-sub { margin:3px 0 0; padding-inline-start:16px; font-family:var(--font-ibm-mono),monospace; font-size:.52rem; letter-spacing:.06em; line-height:1.7; color:#6d7685; transition:color .4s; }
  .mn-node-sub.is-on { color:#aeb8c5; }
  .mn-node-detail { overflow:hidden; padding-inline-start:16px; }
  .mn-node-rule { width:40px; height:1px; margin:12px 0 12px; background:linear-gradient(90deg,#dfe8f2,transparent); }
  .mn-node-text { margin:0; font-family:var(--font-ibm-sans),system-ui,sans-serif; font-size:.74rem; line-height:1.95; color:#8b95a5; max-width:46ch; }
  .mn-node-related { margin-top:16px; }
  .mn-related-label { display:block; font-family:var(--font-ibm-mono),monospace; font-size:.44rem; letter-spacing:.22em; color:#4a515e; margin-bottom:8px; }
  .mn-related-list { display:flex; flex-wrap:wrap; gap:6px; }
  .mn-related-chip { background:none; border:1px solid rgba(255,255,255,.1); color:#9aa5b3; font-family:var(--font-ibm-mono),monospace; font-size:.5rem; letter-spacing:.05em; padding:5px 9px; cursor:pointer; transition:border-color .3s,color .3s; }
  .mn-related-chip:hover { border-color:rgba(255,255,255,.3); color:#eef2f7; }

  .mn-foot { position:relative; z-index:2; display:flex; justify-content:space-between; padding:8px clamp(16px,4vw,60px) 20px; font-family:var(--font-ibm-mono),monospace; font-size:.44rem; letter-spacing:.2em; color:#3f4752; }

  @media (max-width:860px) {
    .mn-field { height:auto; min-height:0; padding:140px 20px 60px; }
    .mn-svg { display:none; }
    .mn-center { top:24px!important; left:50%!important; }
    .mn-center-ring { width:96px; height:96px; }
    .mn-node { position:relative!important; transform:none!important; left:auto!important; top:auto!important; width:100%; margin:0 auto 26px; }
    .mn-node-head { justify-content:center; }
    .mn-node-sub, .mn-node-detail { text-align:center; padding-inline-start:0; }
    .mn-node-text { margin-inline:auto; }
  }
  @media (prefers-reduced-motion:reduce) { .manifesto *{transition:none!important;animation:none!important;} }
`;
