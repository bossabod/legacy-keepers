"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";
import ImpactPyramid from "@/components/ladder/ImpactPyramid";
import { LADDER } from "@/components/ladder/pyramid-data";

export default function LadderSection({ data }: { data: AppData }) {
  const { lang } = useApp();
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const ar = lang === "ar";

  const active = hovered ?? selected;
  const sel = active === null ? null : LADDER[active];
  const holderCount =
    active === null ? null : data.ranks.find((rank) => rank.ord === active + 1)?.holders ?? 0;

  const open = () => {
    setOpened(true);
    play("open");
  };

  const pick = (index: number) => {
    setSelected((c) => (c === index ? null : index));
    play("select");
  };

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

      <div className="impact-stage">
        <nav className="rank-list" aria-label={ar ? "مراتب سلم الأثر" : "Impact Ladder ranks"}>
          {LADDER.map((tier, index) => {
            const isOn = active === index;
            return (
              <button
                key={tier.en.name}
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
          <div className="impact-canvas">
            <ImpactPyramid opened={opened} activeIndex={active} onHover={setHovered} onPick={pick} />
          </div>

          {/* Volumetric fog + ghost call-to-open, covering the closed pyramid */}
          <AnimatePresence>
            {!opened && (
              <motion.div
                key="fog"
                className="pyramid-fog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: "blur(6px)" }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              >
                <motion.button
                  className="ghost-open"
                  onClick={open}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, delay: 0.4 }}
                  aria-label={ar ? "فتح المسرح الهرمي" : "Open the pyramid"}
                >
                  {ar ? "فتح المسرح الهرمي" : "OPEN THE PYRAMID"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {opened && active === null && (
            <div className="impact-hint">
              <span className="impact-hint-line" />
              <span>{ar ? "مرّر فوق طبقة أو اختر مرتبة" : "Hover a layer or choose a rank"}</span>
            </div>
          )}
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
  .impact-title, .impact-tagline, .info-num, .info-meta dt, .impact-foot, .impact-hint span, .rank-no, .ghost-open { font-family:var(--font-ibm-mono), monospace; }
  .impact-title { margin:0; font-size:.68rem; letter-spacing:.3em; color:#eef2f7; }
  .impact-tagline { display:block; margin-top:9px; color:#5d6774; font-size:.54rem; letter-spacing:.16em; }

  /* stage is always laid out left→right so the rank list stays on the left */
  .impact-stage { position:relative; z-index:2; flex:1; min-height:0; display:flex; align-items:center; gap:clamp(10px,2.5vw,44px); padding:4px clamp(14px,3vw,56px) 14px; direction:ltr; }
  .impact-stage > * { flex:0 0 auto; }

  .rank-list { display:flex; flex-direction:column; gap:3px; width:clamp(150px,17vw,210px); order:1; }
  .rank-item { display:flex; align-items:baseline; gap:12px; padding:8px 8px; cursor:pointer; background:transparent; border:0; color:#5b6470; transition:color .35s ease; position:relative; }
  .is-rtl .rank-item { text-align:right; }
  .rank-no { font-size:.55rem; letter-spacing:.16em; color:#4a5360; }
  .rank-name { font-family:var(--font-luxury), Georgia, serif; font-size:.9rem; font-weight:500; letter-spacing:.03em; }
  .rank-item:after { content:""; position:absolute; bottom:2px; left:8px; right:8px; height:1px; background:linear-gradient(90deg,#dfe8f2,transparent); opacity:0; transform:scaleX(0); transform-origin:left; transition:opacity .35s ease, transform .35s ease; }
  .rank-item:hover { color:#cfd7e1; }
  .rank-item:hover:after { opacity:.5; transform:scaleX(1); }
  .rank-item.is-on { color:#f2f5f9; text-shadow:0 0 14px rgba(225,234,246,.4); }
  .rank-item.is-on:after { opacity:.9; transform:scaleX(1); }
  .rank-item.is-on .rank-no { color:#aebdcd; }

  .pyramid-wrap { flex:1; min-width:0; position:relative; display:flex; align-items:center; justify-content:center; order:2; }
  .impact-canvas { width:100%; height:clamp(420px, 72svh, 780px); }

  /* Volumetric fog covering the closed pyramid + ghost call-to-open */
  .pyramid-fog { position:absolute; inset:-4%; z-index:5; display:flex; align-items:center; justify-content:center; pointer-events:none; background:radial-gradient(ellipse 52% 58% at 50% 50%, rgba(170,185,200,.1) 0%, rgba(150,165,182,.05) 34%, rgba(60,70,82,.035) 60%, transparent 78%); backdrop-filter:blur(1.4px); }
  .ghost-open { pointer-events:auto; cursor:pointer; background:transparent; border:0; padding:22px 40px; color:#dde6ef; font-size:.62rem; letter-spacing:.4em; text-shadow:0 0 18px rgba(225,234,246,.75), 0 0 40px rgba(225,234,246,.4); }
  .is-rtl .ghost-open { letter-spacing:.12em; }

  .impact-hint { position:absolute; bottom:8px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:10px; color:#4a535f; font-size:.5rem; letter-spacing:.18em; white-space:nowrap; opacity:.8; }
  .impact-hint-line { width:34px; height:1px; background:linear-gradient(90deg,transparent,#57606c); }

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
    .info-panel { width:100%; min-height:0; padding:4px 0 14px; }
    .info-record, .is-rtl .info-record { border-inline-start:0; border-inline-end:0; border-top:1px solid rgba(214,226,238,.18); padding:12px 2px 0; }
    .info-overview { max-width:100%; }
    .impact-hint { display:none; }
    .ghost-open { letter-spacing:.22em; }
  }
`;
