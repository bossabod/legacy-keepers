"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type CSSProperties } from "react";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import type { AppData } from "@/lib/types";

type LadderCopy = {
  ar: { name: string; desc: string; requirements: string; access: string; status: string };
  en: { name: string; desc: string; requirements: string; access: string; status: string };
};

/* The names and ordinal sequence here are deliberately canonical, rather than
   database-driven, so the institutional hierarchy can never be reordered by data. */
const LADDER: LadderCopy[] = [
  { ar: { name: "الزائر", desc: "عتبة الدخول إلى الدائرة. حضورٌ مراقب ومساحة أولى لفهم لغة الأثر.", requirements: "دعوة موثّقة · تعريف بالميثاق", access: "OBSERVATION", status: "INITIALIZED" }, en: { name: "The Visitor", desc: "The threshold of the circle. A witnessed entry point into the language of impact.", requirements: "Verified invitation · Covenant orientation", access: "OBSERVATION", status: "INITIALIZED" } },
  { ar: { name: "أفق التكوين", desc: "مرحلة بناء البصيرة؛ حيث تتحول النية إلى اتجاه يمكن قياسه.", requirements: "سجل حضور · إشارة موثوقة", access: "FORMATION", status: "IN FORMATION" }, en: { name: "Horizon of Formation", desc: "A stage of building perspective, where intent becomes a measurable direction.", requirements: "Attendance record · Trusted signal", access: "FORMATION", status: "IN FORMATION" } },
  { ar: { name: "الحاجب", desc: "حارس العتبات. يميّز بين الإشارة العابرة والالتزام الذي يستحق المرور.", requirements: "تزكية داخلية · انضباط مثبت", access: "GATEKEEPER", status: "VERIFIED" }, en: { name: "The Chamberlain", desc: "Keeper of thresholds, distinguishing a passing signal from a commitment worth passage.", requirements: "Internal endorsement · Proven discipline", access: "GATEKEEPER", status: "VERIFIED" } },
  { ar: { name: "كارينا", desc: "مدارٌ يجمع المسارات المتباعدة ويمنح العمل المشترك اتجاهاً هادئاً.", requirements: "مبادرة مشتركة · أثر موثّق", access: "ORBITAL", status: "ALIGNED" }, en: { name: "Karina", desc: "An orbit that brings distant paths together and gives shared work a quiet direction.", requirements: "Joint initiative · Documented impact", access: "ORBITAL", status: "ALIGNED" } },
  { ar: { name: "المؤثر", desc: "صاحب بصمة تتجاوز حضوره؛ يحرّك القرار ويترك أثراً قابلاً للاستمرار.", requirements: "أثر مثبت · رعاية عضوين", access: "INFLUENCE", status: "ACTIVE" }, en: { name: "The Influencer", desc: "A signature beyond presence: moving decisions and leaving impact built to remain.", requirements: "Proven impact · Two member sponsors", access: "INFLUENCE", status: "ACTIVE" } },
  { ar: { name: "القيثار", desc: "صانع الانسجام بين القوة والمعنى؛ يحوّل المبادرات إلى نغمة مؤسسية واحدة.", requirements: "قيادة مسار · مراجعة الميثاق", access: "HARMONIC", status: "RESONANT" }, en: { name: "The Lyre", desc: "Maker of harmony between force and meaning, bringing initiatives into one institutional note.", requirements: "Track leadership · Covenant review", access: "HARMONIC", status: "RESONANT" } },
  { ar: { name: "الميثاق", desc: "حامل الوعد المشترك. تُصان عنده استمرارية النادي وميزان الثقة.", requirements: "إجماع المجلس · سجلّ خدمة", access: "COVENANT", status: "ENTRUSTED" }, en: { name: "The Covenant", desc: "Bearer of the shared promise, entrusted with continuity and the balance of trust.", requirements: "Council consensus · Service record", access: "COVENANT", status: "ENTRUSTED" } },
  { ar: { name: "مفاتيح الخلق", desc: "يفتح الإمكانات التي لا تُمنح إلا لمن يحسن بناء ما يدوم.", requirements: "أثر متعدد المجالات · تفويض خاص", access: "CREATION", status: "CLEARED" }, en: { name: "Keys of Creation", desc: "Opens possibilities reserved for those who know how to build what endures.", requirements: "Cross-domain impact · Special mandate", access: "CREATION", status: "CLEARED" } },
  { ar: { name: "أعمدة الخلق", desc: "القمة الحارسة للأفق؛ حضورها يثبت البنية ويمنح الأثر امتداده.", requirements: "إجماع كامل · إرث مستمر", access: "FOUNDATION", status: "SOVEREIGN" }, en: { name: "Pillars of Creation", desc: "The summit that guards the horizon: a presence that steadies the structure and extends impact.", requirements: "Full consensus · Enduring legacy", access: "FOUNDATION", status: "SOVEREIGN" } },
];

export default function LadderSection({ data }: { data: AppData }) {
  const { lang } = useApp();
  const [active, setActive] = useState<number | null>(null);
  const ar = lang === "ar";
  const selected = active === null ? null : LADDER[active];
  const holderCount = active === null ? 0 : data.ranks.find((rank) => rank.ord === active + 1)?.holders;

  const engage = (index: number) => {
    setActive(index);
    play("hover");
  };
  const release = () => setActive(null);

  return (
    <section className={`impact-ladder ${ar ? "is-rtl" : "is-ltr"}`} aria-label={ar ? "سلم الأثر" : "Impact Ladder"}>
      <style>{impactStyles}</style>
      <div className="impact-atmosphere" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <header className="impact-heading">
        <p>{ar ? "سلم الأثر" : "IMPACT LADDER"}</p>
        <span>{ar ? "تسعة مستويات. صعود واحد." : "Nine levels. One ascent."}</span>
      </header>

      <div className="impact-layout">
        <div className="impact-stage" onMouseLeave={release}>
          <div className={`impact-pyramid ${active !== null ? "has-focus" : ""}`}>
            <div className="impact-apex" />
            {LADDER.map((tier, index) => {
              const width = 92 - index * 8.1;
              const isActive = active === index;
              const isMuted = active !== null && !isActive;
              return (
                <div
                  className={`impact-tier-anchor ${isMuted ? "is-muted" : ""}`}
                  key={tier.ar.name}
                  style={{ "--tier-width": `${width}%`, "--tier-index": index } as CSSProperties}
                >
                  <button
                    className={`impact-tier ${isActive ? "is-active" : ""}`}
                    aria-label={`${String(index + 1).padStart(2, "0")} — ${ar ? tier.ar.name : tier.en.name}`}
                    aria-pressed={isActive}
                    onMouseEnter={() => engage(index)}
                    onFocus={() => engage(index)}
                    onClick={() => { setActive((current) => current === index ? null : index); play("select"); }}
                    onBlur={release}
                    style={{ "--spin-duration": `${42 + index * 3.7}s`, "--spin-direction": index % 3 === 1 ? "reverse" : "normal" } as CSSProperties}
                  >
                    <span className="tier-surface" />
                    <span className="tier-front" />
                    <span className="tier-side" />
                    <span className="tier-index">{String(index + 1).padStart(2, "0")}</span>
                  </button>
                </div>
              );
            })}
            <div className="impact-plinth" aria-hidden="true" />
          </div>
        </div>

        <div className="impact-readout" aria-live="polite">
          <AnimatePresence mode="wait">
            {selected && active !== null && (
              <motion.article
                key={active}
                initial={{ opacity: 0, x: ar ? 18 : -18, filter: "blur(5px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: ar ? -12 : 12, filter: "blur(4px)" }}
                transition={{ duration: 0.38, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <p className="readout-number">{String(active + 1).padStart(2, "0")}</p>
                <h2>{ar ? selected.ar.name : selected.en.name}</h2>
                <p className="readout-description">{ar ? selected.ar.desc : selected.en.desc}</p>
                <div className="readout-rule" />
                <dl>
                  <div><dt>RANK</dt><dd>{String(active + 1).padStart(2, "0")} / 09</dd></div>
                  <div><dt>STATUS</dt><dd>{ar ? selected.ar.status : selected.en.status}</dd></div>
                  <div><dt>REQUIREMENTS</dt><dd>{ar ? selected.ar.requirements : selected.en.requirements}</dd></div>
                  <div><dt>ACCESS LEVEL</dt><dd>{ar ? selected.ar.access : selected.en.access}</dd></div>
                  {holderCount !== undefined && <div><dt>{ar ? "الحَمَلة" : "HOLDERS"}</dt><dd>{holderCount}</dd></div>}
                </dl>
              </motion.article>
            )}
          </AnimatePresence>
          {!selected && <p className="impact-instruction">{ar ? "مرّر المؤشر فوق إحدى الطبقات للكشف عن السجلّ." : "Hover over a layer to reveal its record."}</p>}
        </div>
      </div>
      <p className="impact-classification">OOI / CLASSIFIED HIERARCHY / 09 LEVELS</p>
    </section>
  );
}

const impactStyles = `
  .impact-ladder { position:relative; isolation:isolate; min-height:calc(100svh - 154px); overflow:hidden; padding:12px clamp(4px, 3vw, 46px) 18px; color:#e9edf3; background:radial-gradient(ellipse 58% 70% at 48% 57%, #171c23 0%, #090b0f 45%, #040507 100%); }
  .impact-ladder:before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.42; background:repeating-linear-gradient(90deg, transparent 0, transparent 74px, rgba(191,205,220,.018) 75px), linear-gradient(180deg, rgba(255,255,255,.025), transparent 18%); }
  .impact-heading { position:relative; z-index:3; padding:4px 5px; }
  .impact-heading p, .impact-heading span, .impact-classification, .readout-number, .impact-readout dt { font-family:var(--font-ibm-mono), monospace; letter-spacing:.18em; }
  .impact-heading p { margin:0; font-size:.63rem; color:#edf1f5; }
  .impact-heading span { display:block; margin-top:8px; color:#737e8c; font-size:.57rem; }
  .impact-layout { position:relative; z-index:2; display:grid; min-height:clamp(570px, 74svh, 780px); grid-template-columns:minmax(0, 1fr) minmax(235px, .44fr); align-items:center; gap:clamp(18px, 4vw, 72px); }
  .is-rtl .impact-layout { grid-template-columns:minmax(235px, .44fr) minmax(0, 1fr); }
  .impact-stage { position:relative; height:clamp(550px, 70svh, 740px); min-width:0; perspective:1150px; perspective-origin:50% 45%; }
  .impact-stage:before { content:""; position:absolute; width:min(72%, 520px); height:70px; left:50%; bottom:7%; border-radius:50%; transform:translateX(-50%) rotateX(67deg); background:radial-gradient(ellipse, rgba(224,234,245,.22), rgba(106,120,138,.08) 35%, transparent 70%); filter:blur(5px); }
  .impact-pyramid { position:absolute; left:50%; bottom:8%; width:min(76vw, 570px); height:min(74vw, 590px); max-height:590px; transform:translateX(-50%) rotateX(57deg) rotateZ(-1deg); transform-style:preserve-3d; animation:impact-float 12s ease-in-out infinite; }
  .impact-tier-anchor { position:absolute; left:50%; bottom:calc(5% + var(--tier-index) * 9.7%); width:var(--tier-width); height:54px; transform:translateX(-50%); transform-style:preserve-3d; transition:filter .42s ease, opacity .42s ease; }
  .impact-tier-anchor.is-muted { opacity:.42; filter:blur(1.25px) brightness(.57); }
  .impact-tier { position:relative; width:100%; height:100%; border:0; padding:0; cursor:pointer; background:transparent; transform-style:preserve-3d; animation:impact-orbit var(--spin-duration) linear infinite var(--spin-direction); outline:none; }
  .impact-tier.is-active { animation-play-state:paused; }
  .impact-tier:focus-visible .tier-surface { box-shadow:0 0 0 2px #f1f5fa, 0 0 24px rgba(231,239,248,.7), inset 0 1px 0 rgba(255,255,255,.48); }
  .tier-surface { position:absolute; inset:0 0 18px; clip-path:polygon(7% 0,93% 0,100% 100%,0 100%); background:linear-gradient(135deg, rgba(206,216,227,.32), rgba(48,56,66,.88) 25%, rgba(17,21,27,.98) 74%, rgba(117,130,145,.42)); border:1px solid rgba(230,237,246,.46); box-shadow:0 10px 14px rgba(0,0,0,.63), inset 0 1px 0 rgba(255,255,255,.25), inset 0 -10px 15px rgba(0,0,0,.47); transition:box-shadow .4s ease, filter .4s ease; }
  .tier-surface:after { content:""; position:absolute; inset:3px 7% 7px; clip-path:inherit; border-top:1px solid rgba(255,255,255,.35); opacity:.6; }
  .tier-front { position:absolute; left:0; right:0; bottom:0; height:19px; clip-path:polygon(0 0,100% 0,93% 100%,7% 100%); background:linear-gradient(180deg, #5f6a77, #171c23 28%, #080a0d); border-bottom:1px solid rgba(215,225,236,.18); box-shadow:0 9px 11px rgba(0,0,0,.65); }
  .tier-side { position:absolute; right:4%; bottom:4px; width:16%; height:27px; transform:skewY(-27deg); transform-origin:bottom; background:linear-gradient(90deg, rgba(12,15,19,.2), #000); opacity:.66; }
  .tier-index { position:absolute; left:50%; top:18px; transform:translateX(-50%) rotateX(-57deg); font-family:var(--font-ibm-mono), monospace; font-size:9px; letter-spacing:.22em; color:rgba(229,236,244,.82); text-shadow:0 1px 4px #000; pointer-events:none; }
  .impact-tier.is-active .tier-surface { filter:brightness(1.32); box-shadow:0 0 2px rgba(255,255,255,.9), 0 0 22px rgba(220,230,242,.55), 0 10px 14px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.7); }
  .impact-tier.is-active .tier-front { background:linear-gradient(180deg,#dce5ef,#4d5965 28%,#101419); box-shadow:0 0 15px rgba(220,230,242,.38),0 9px 11px rgba(0,0,0,.65); }
  .impact-apex { position:absolute; left:50%; top:1.5%; width:18px; height:18px; transform:translateX(-50%) rotate(45deg); background:#f4f7fb; box-shadow:0 0 7px #fff,0 0 25px rgba(221,232,246,.8); animation:impact-apex 5s ease-in-out infinite; }
  .impact-plinth { position:absolute; z-index:-1; left:50%; bottom:0; width:100%; height:36px; transform:translateX(-50%); border-radius:50%; background:radial-gradient(ellipse,rgba(186,202,220,.2),rgba(18,22,28,.66) 45%,transparent 72%); filter:blur(1px); }
  .impact-readout { align-self:center; min-height:290px; padding:20px 0; max-width:350px; border-inline-start:1px solid rgba(213,224,235,.2); padding-inline-start:clamp(18px, 3vw, 40px); }
  .is-rtl .impact-readout { border-inline-start:0; border-inline-end:1px solid rgba(213,224,235,.2); padding-inline-start:0; padding-inline-end:clamp(18px, 3vw, 40px); text-align:right; }
  .readout-number { margin:0; color:#aebdce; font-size:.68rem; }
  .impact-readout h2 { margin:10px 0 0; font-family:var(--font-luxury), serif; font-weight:600; letter-spacing:.04em; font-size:clamp(1.8rem,3vw,2.8rem); color:#f3f6fa; }
  .readout-description { max-width:310px; margin:16px 0 0; color:#aeb8c4; font-size:.88rem; line-height:1.9; }
  .readout-rule { width:44px; height:1px; margin:24px 0 17px; background:linear-gradient(90deg,#e9eff6,transparent); }
  .is-rtl .readout-rule { background:linear-gradient(270deg,#e9eff6,transparent); margin-inline-start:auto; }
  .impact-readout dl { margin:0; display:grid; gap:12px; }
  .impact-readout dl div { display:grid; grid-template-columns:112px 1fr; gap:12px; }
  .is-rtl .impact-readout dl div { grid-template-columns:1fr 112px; }
  .impact-readout dt { color:#66717e; font-size:.54rem; }
  .impact-readout dd { margin:0; color:#dbe2e9; font-family:var(--font-ibm-mono), monospace; font-size:.62rem; letter-spacing:.07em; line-height:1.4; }
  .impact-instruction { margin:0; padding-top:100px; max-width:220px; color:#65707d; font-family:var(--font-ibm-mono), monospace; font-size:.61rem; letter-spacing:.1em; line-height:1.9; }
  .impact-classification { position:absolute; z-index:3; bottom:13px; inset-inline-end:8px; margin:0; color:rgba(135,150,165,.52); font-size:.48rem; }
  .impact-atmosphere i { position:absolute; z-index:1; width:2px; height:2px; border-radius:50%; background:#dbe6f2; opacity:.18; animation:impact-dust 13s ease-in-out infinite; }.impact-atmosphere i:nth-child(1){left:11%;top:28%}.impact-atmosphere i:nth-child(2){left:25%;top:72%;animation-delay:-4s}.impact-atmosphere i:nth-child(3){left:45%;top:16%;animation-delay:-9s}.impact-atmosphere i:nth-child(4){left:72%;top:27%;animation-delay:-2s}.impact-atmosphere i:nth-child(5){left:88%;top:62%;animation-delay:-7s}.impact-atmosphere i:nth-child(6){left:66%;top:82%;animation-delay:-5s}.impact-atmosphere i:nth-child(7){left:33%;top:47%;animation-delay:-8s}.impact-atmosphere i:nth-child(8){left:91%;top:12%;animation-delay:-10s}
  @keyframes impact-orbit { to { transform:rotateZ(360deg); } } @keyframes impact-float { 0%,100% { transform:translateX(-50%) rotateX(57deg) rotateZ(-1deg) translateY(0); } 50% { transform:translateX(-50%) rotateX(59deg) rotateZ(1deg) translateY(-8px); } } @keyframes impact-apex { 0%,100% { opacity:.66; transform:translateX(-50%) rotate(45deg) scale(.86); } 50% { opacity:1; transform:translateX(-50%) rotate(45deg) scale(1.15); } } @keyframes impact-dust { 0%,100% { transform:translateY(0); opacity:.08 } 50% { transform:translateY(-34px); opacity:.3 } }
  @media (max-width:800px) { .impact-ladder { min-height:calc(100svh - 135px); padding-inline:0; } .impact-heading { padding-inline:14px; } .impact-layout,.is-rtl .impact-layout { display:flex; flex-direction:column; gap:0; min-height:0; } .impact-stage { width:100%; height:min(67svh, 570px); } .impact-pyramid { width:min(94vw,500px); height:min(94vw,500px); } .impact-readout { width:calc(100% - 34px); min-height:260px; margin-top:-6px; margin-bottom:26px; padding-top:16px; border-inline-start:0; border-top:1px solid rgba(213,224,235,.2); padding-inline-start:0; } .is-rtl .impact-readout { border-inline-end:0; padding-inline-end:0; } .impact-instruction { padding-top:35px; } .impact-classification { display:none; } }
  @media (prefers-reduced-motion:reduce) { .impact-pyramid,.impact-tier,.impact-apex,.impact-atmosphere i { animation:none!important; } }
`;
