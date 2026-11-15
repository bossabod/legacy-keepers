"use client";

/**
 * صورة مفهوم مصغّرة لكل مشروع.
 *
 * مولّدة بالكامل كـ SVG حتمي مشتقّ من معرّف المشروع، فلا تُحمَّل أي
 * صور خارجية وتبقى الهوية أحادية اللون: أسود وفحمي ورمادي وفضي.
 */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function ConceptThumb({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const h = hash(seed);
  const variant = h % 4;
  const a = (h >> 3) % 7;
  const b = (h >> 7) % 5;
  const gid = `ct-${h.toString(36)}`;

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14171d" />
          <stop offset="55%" stopColor="#0d1015" />
          <stop offset="100%" stopColor="#080a0e" />
        </linearGradient>
        <linearGradient id={`${gid}-ln`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" fill={`url(#${gid}-bg)`} />

      {/* شبكة دقيقة */}
      <g stroke="rgba(255,255,255,0.05)" strokeWidth="0.5">
        {[20, 40, 60, 80, 100].map((v) => (
          <line key={`h${v}`} x1="0" y1={v} x2="120" y2={v} />
        ))}
        {[20, 40, 60, 80, 100].map((v) => (
          <line key={`v${v}`} x1={v} y1="0" x2={v} y2="120" />
        ))}
      </g>

      <g stroke={`url(#${gid}-ln)`} fill="none" strokeWidth="1.1">
        {variant === 0 && (
          <>
            {/* أبراج / بنية تحتية */}
            {[0, 1, 2, 3].map((i) => {
              const x = 18 + i * 26;
              const top = 84 - ((a + i * 3) % 6) * 9 - 14;
              return <rect key={i} x={x} y={top} width="16" height={100 - top} />;
            })}
            <line x1="6" y1="100" x2="114" y2="100" strokeWidth="1.4" />
          </>
        )}

        {variant === 1 && (
          <>
            {/* شبكة عُقد */}
            {[
              [30, 34],
              [82, 28],
              [60, 60],
              [26, 84],
              [92, 82],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={2.6 + ((a + i) % 3)} />
            ))}
            <path d="M30 34 L60 60 L82 28 M60 60 L26 84 M60 60 L92 82" />
          </>
        )}

        {variant === 2 && (
          <>
            {/* مسار بياني */}
            <path
              d={`M8 ${88 - a * 3} L30 ${70 - b * 4} L52 ${78 - a * 2} L74 ${48 - b * 3} L96 ${56 - a} L112 ${30 + b * 2}`}
              strokeWidth="1.5"
            />
            <path d="M8 100 L112 100" strokeWidth="0.8" opacity="0.5" />
            {[30, 74, 112].map((x, i) => (
              <circle key={i} cx={x} cy={[70 - b * 4, 48 - b * 3, 30 + b * 2][i]} r="2" fill="rgba(255,255,255,0.7)" />
            ))}
          </>
        )}

        {variant === 3 && (
          <>
            {/* معيّنات متداخلة — رمز النادي */}
            {[34, 24, 14].map((s, i) => (
              <rect
                key={i}
                x={60 - s}
                y={60 - s}
                width={s * 2}
                height={s * 2}
                transform={`rotate(45 60 60)`}
                opacity={1 - i * 0.26}
              />
            ))}
            <line x1="60" y1="18" x2="60" y2="102" strokeWidth="0.6" opacity="0.45" />
          </>
        )}
      </g>

      {/* تعتيم الحواف */}
      <rect
        width="120"
        height="120"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
    </svg>
  );
}
