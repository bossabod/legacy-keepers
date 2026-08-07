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

          <AnimatePresence>
            {!opened && (
              <motion.button
                key="open"
                className="open-btn"
                onClick={open}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <span className="open-seal" />
                <span className="open-label">{ar ? "فتح المسرح الهرمي" : "OPEN THE PYRAMID"}</span>
              </motion.button>
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
                initial={{ opacity: 0, x: ar ? 22 : -22, filter: "blur(5px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: ar ? -16 : 16, filter: "blur(4px)" }}
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
  .impact-ladder { position:relative; isolation:isolate; width:100vw; margin-inline:calc(50% - 50vw); min-height:calc(100svh - 66px); display:flex; flex-direction:column; overflow:hidden; color:#e9edf3; background:radial-gradient(ellipse 66% 82% at 50% 52%, #11151c 0%, #07090d 40%, #020305 100%); }
  .impact-ladder:before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.32; background:repeating-linear-gradient(90deg, transparent 0, transparent 110px, rgba(191,205,220,.015) 111px), radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.03), transparent 46%); }
  .impact-ladder:after { content:""; position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse 36% 22% at 50% 97%, rgba(190,205,222,.045), transparent 70%); }

  .impact-heading { position:relative; z-index:3; padding:26px clamp(20px,4vw,64px) 4px; }
  .impact-title, .impact-tagline, .info-num, .info-meta dt, .impact-foot, .impact-hint span, .rank-no, .open-label { font-family:var(--font-ibm-mono), monospace; }
  .impact-title { margin:0; font-size:.7rem; letter-spacing:.3em; color:#eef2f7; }
  .impact-tagline { display:block; margin-top:9px; color:#66707d; font-size:.55rem; letter-spacing:.16em; }

  .impact-stage { position:relative; z-index:2; flex:1; min-height:0; display:flex; align-items:center; gap:clamp(12px,3vw,52px); padding:6px clamp(14px,3.5vw,60px) 18px; }
  .impact-stage > * { flex:0 0 auto; }

  /* Rank list — left in Arabic, right in English (explicit, dir-independent) */
  .rank-list { display:flex; flex-direction:column; gap:2px; width:clamp(150px,17vw,220px); }
  .is-ltr .rank-list { order:1; }
  .is-rtl .rank-list { order:3; }
  .rank-item { display:flex; align-items:baseline; gap:12px; padding:7px 8px; cursor:pointer; background:transparent; border:0; color:#5d6774; text-align:left; transition:color .35s ease; position:relative; }
  .is-rtl .rank-item { text-align:right; }
  .rank-no { font-size:.55rem; letter-spacing:.16em; color:#4a5360; }
  .rank-name { font-family:var(--font-luxury), Georgia, serif; font-size:.9rem; font-weight:500; letter-spacing:.03em; }
  .rank-item:after { content:""; position:absolute; bottom:2px; left:8px; right:8px; height:1px; background:linear-gradient(90deg,#dfe8f2,transparent); opacity:0; transform:scaleX(0); transform-origin:left; transition:opacity .35s ease, transform .35s ease; }
  .is-rtl .rank-item:after { transform-origin:right; background:linear-gradient(270deg,#dfe8f2,transparent); }
  .rank-item:hover { color:#cfd7e1; }
  .rank-item:hover:after { opacity:.5; transform:scaleX(1); }
  .rank-item.is-on { color:#f2f5f9; text-shadow:0 0 14px rgba(225,234,246,.4); }
  .rank-item.is-on:after { opacity:.9; transform:scaleX(1); }
  .rank-item.is-on .rank-no { color:#aebdcd; }

  .pyramid-wrap { flex:1; min-width:0; position:relative; display:flex; align-items:center; justify-content:center; }
  .is-ltr .pyramid-wrap { order:2; }
  .is-rtl .pyramid-wrap { order:2; }
  .impact-canvas { width:100%; height:clamp(360px, 60svh, 660px); }

  .open-btn { position:absolute; left:50%; top:56%; transform:translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:14px; background:transparent; border:0; cursor:pointer; color:#eef2f7; }
  .open-seal { width:58px; height:58px; border-radius:50%; border:1px solid rgba(223,232,242,.5); box-shadow:0 0 22px rgba(220,230,242,.25), inset 0 0 16px rgba(220,230,242,.18); display:flex; align-items:center; justify-content:center; transition:box-shadow .5s ease, border-color .5s ease; }
  .open-seal:before { content:""; width:26px; height:26px; border-radius:50%; border:1px solid rgba(238,243,250,.7); box-shadow:inset 0 0 8px rgba(238,243,250,.4); }
  .open-btn:hover .open-seal { border-color:rgba(240,245,252,.9); box-shadow:0 0 34px rgba(230,238,248,.5), inset 0 0 22px rgba(230,238,248,.3); }
  .open-label { font-size:.58rem; letter-spacing:.34em; text-shadow:0 0 12px rgba(225,234,246,.5); }

  .impact-hint { position:absolute; bottom:4px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:10px; color:#4f5864; font-size:.5rem; letter-spacing:.18em; white-space:nowrap; opacity:.85; }
  .impact-hint-line { width:34px; height:1px; background:linear-gradient(90deg,transparent,#5a6572); }
  .is-rtl .impact-hint-line { transform:scaleX(-1); }

  .info-panel { width:min(92vw, 360px); display:flex; align-items:center; min-height:300px; }
  .is-ltr .info-panel { order:3; }
  .is-rtl .info-panel { order:1; }
  .info-record { border-inline-start:1px solid rgba(214,226,238,.2); padding-inline-start:clamp(16px,2.5vw,32px); }
  .is-rtl .info-record { border-inline-start:0; border-inline-end:1px solid rgba(214,226,238,.2); padding-inline-start:0; padding-inline-end:clamp(16px,2.5vw,32px); text-align:right; }
  .info-num { margin:0 0 8px; color:#8fa0b6; font-size:.6rem; letter-spacing:.28em; }
  .info-num-slash { color:#4d5662; }
  .info-name { margin:0; font-family:var(--font-luxury), Georgia, serif; font-weight:600; letter-spacing:.03em; font-size:clamp(1.7rem,3vw,2.6rem); color:#f4f7fb; text-shadow:0 0 20px rgba(225,234,246,.13); }
  .info-overview { max-width:310px; margin:12px 0 0; color:#a6b0bd; font-size:.82rem; line-height:1.8; }
  .info-rule { width:44px; height:1px; margin:18px 0 14px; background:linear-gradient(90deg,#e9eff6,transparent); }
  .is-rtl .info-rule { margin-inline-start:auto; background:linear-gradient(270deg,#e9eff6,transparent); }
  .info-meta { margin:0; display:grid; gap:10px; }
  .info-meta div { display:grid; grid-template-columns:118px 1fr; gap:12px; }
  .is-rtl .info-meta div { grid-template-columns:1fr 118px; }
  .info-meta dt { color:#5e6976; font-size:.5rem; letter-spacing:.14em; padding-top:2px; }
  .info-meta dd { margin:0; color:#d6dee7; font-size:.64rem; line-height:1.5; }
  .info-instruction { margin:0; max-width:230px; color:#5b6470; font-family:var(--font-ibm-mono), monospace; font-size:.56rem; letter-spacing:.08em; line-height:2; border-inline-start:1px solid rgba(214,226,238,.13); padding-inline-start:clamp(16px,2.5vw,32px); }
  .is-rtl .info-instruction { border-inline-start:0; border-inline-end:1px solid rgba(214,226,238,.13); padding-inline-start:0; padding-inline-end:clamp(16px,2.5vw,32px); text-align:right; }

  .impact-foot { position:relative; z-index:3; display:flex; align-items:center; gap:10px; padding:6px clamp(14px,3.5vw,60px) 16px; color:rgba(138,152,168,.5); font-size:.48rem; letter-spacing:.22em; }
  .impact-foot-dot { width:4px; height:4px; border-radius:50%; background:#c3cdd9; box-shadow:0 0 6px rgba(220,230,242,.8); }

  @media (max-width:980px) {
    .rank-list { width:clamp(130px,16vw,180px); }
    .rank-name { font-size:.8rem; }
  }
  @media (max-width:820px) {
    .impact-ladder { min-height:calc(100svh - 56px); }
    .impact-heading { padding-top:20px; }
    .impact-stage { flex-direction:column; gap:6px; padding-inline:18px; align-items:stretch; }
    .rank-list, .info-panel { width:100%; order:0!important; }
    .rank-list { flex-direction:row; flex-wrap:wrap; gap:2px; justify-content:center; }
    .rank-item { padding:6px 8px; }
    .rank-no { display:none; }
    .rank-item:after { display:none; }
    .pyramid-wrap { order:0!important; }
    .impact-canvas { height:min(52svh, 430px); }
    .info-panel { min-height:0; padding:4px 0 14px; }
    .info-record, .is-rtl .info-record { border-inline-start:0; border-inline-end:0; border-top:1px solid rgba(214,226,238,.18); padding:12px 2px 0; }
    .info-overview { max-width:100%; }
    .impact-hint { display:none; }
    .open-btn { top:50%; }
  }
`;
