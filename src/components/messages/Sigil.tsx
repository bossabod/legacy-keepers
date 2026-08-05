"use client";

/**
 * الهوية الرقمية — تحلّ محلّ الصورة الشخصية.
 *
 * رمز هندسي مولّد من مُعرِّف العضو، يحمل داخله حروف/أرقام التعريف.
 * يتغيّر الشكل الخارجي حسب الرتبة: الرتب العليا تحصل على حلقات
 * وأضلاع أكثر، والإدارة تحصل على معالجة حمراء.
 */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** رأس المُعرِّف — أول جزء قبل الشرطة، مثل ID أو E أو ADM. */
function head(sigil: string) {
  return sigil.split("-")[0] ?? sigil.slice(0, 2);
}
/** ذيل المُعرِّف — الأرقام. */
function tail(sigil: string) {
  return sigil.split("-")[1] ?? "";
}

export default function Sigil({
  sigil,
  tier,
  admin,
  size = 38,
}: {
  sigil: string;
  tier: number;
  admin?: boolean;
  size?: number;
}) {
  const h = hash(sigil);
  const rot = h % 90;
  /* الرتب العليا: مضلّع بأضلاع أكثر. الدنيا: دائرة بسيطة. */
  const sides = tier >= 8 ? 6 : tier >= 6 ? 5 : tier >= 4 ? 4 : 3;
  const ring = tier >= 7;

  const stroke = admin ? "rgba(196,72,72,0.85)" : "rgba(226,233,244,0.55)";
  const inner = admin ? "rgba(196,72,72,0.30)" : "rgba(226,233,244,0.22)";
  const text = admin ? "#e2a0a0" : "#c8d1de";

  /* رؤوس المضلّع */
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2 + (rot * Math.PI) / 180;
    return `${(24 + Math.cos(a) * 19).toFixed(1)},${(24 + Math.sin(a) * 19).toFixed(1)}`;
  }).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-label={sigil}
      className="shrink-0"
    >
      {ring && (
        <circle
          cx="24"
          cy="24"
          r="22.5"
          stroke={inner}
          strokeWidth="0.7"
          strokeDasharray="2 3"
        />
      )}
      <polygon points={pts} stroke={stroke} strokeWidth="1" fill="none" />
      <polygon
        points={pts}
        stroke="none"
        fill={admin ? "rgba(196,72,72,0.07)" : "rgba(226,233,244,0.035)"}
      />

      {/* الحروف فوق الأرقام */}
      <text
        x="24"
        y="21.5"
        textAnchor="middle"
        fill={text}
        style={{
          fontFamily: "var(--font-ibm-mono)",
          fontSize: 7.5,
          letterSpacing: "0.06em",
        }}
      >
        {head(sigil)}
      </text>
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fill={text}
        opacity="0.72"
        style={{
          fontFamily: "var(--font-ibm-mono)",
          fontSize: 7,
          letterSpacing: "0.04em",
        }}
      >
        {tail(sigil)}
      </text>
    </svg>
  );
}
