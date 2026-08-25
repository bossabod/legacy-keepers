"use client";
import { publicPath } from "@/lib/public-path";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { t } from "@/lib/i18n";

/**
 * واجهة دخول قسم المشاريع.
 *
 * الصورة هي البطل: تُعرض كاملة بنسبتها الأصلية (contain) فلا تُقص
 * ولا تُشوَّه، وتتوسّط الشاشة على خلفية مطابقة للون خلفية الصورة
 * نفسها (#141416) فتبدو وكأنها تملأ الإطار بلا حواف ظاهرة.
 *
 * النصوص عناصر HTML فوق الصورة — لم تُعدَّل الصورة إطلاقاً.
 */
export default function ProjectsGate({ onEnter }: { onEnter: () => void }) {
  const { lang } = useApp();
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      /* ملء الشاشة تحت شريط التنقل، ويكسر حشوة <main> بهوامش سالبة */
      className="relative -mb-7 -mt-7 flex h-[calc(100vh-4.2rem)] w-screen flex-col items-center justify-between overflow-hidden"
      style={{
        backgroundColor: "#141416",
        // نخرج من حشوة <main> دون الاعتماد على اتجاه الكتابة
        marginInlineStart: "calc(50% - 50vw)",
        marginInlineEnd: "calc(50% - 50vw)",
      }}
      dir="ltr"
    >
      {/* طبقة امتداد: نسخة مكبّرة ومموّهة بشدّة من الصورة نفسها تملأ
          الجانبين، فيبدو الإطار مشهداً واحداً متصلاً بدل شريطين أسودين.
          الصورة الأصلية تبقى فوقها كاملة بلا قص.                        */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${publicPath("/images/projects-gate.jpg")})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(96px) brightness(0.34) saturate(0.7)",
          transform: "scale(1.45)",
        }}
      />

      {/* ===== الصورة ===== */}
      {/* الحاوية تأخذ نسبة الصورة نفسها (1023×1537) فتطابق حدودها
          البكسلات المرئية تماماً، ومن ثم يعمل التمويه الجانبي عليها
          لا على صندوق فارغ.                                        */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-y-0 mx-auto h-full"
        style={{
          insetInline: 0,
          aspectRatio: "1023 / 1537",
          maxWidth: "100vw",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)",
        }}
      >
        <img
          src={publicPath("/images/projects-gate.jpg")}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-cover object-center"
        />
      </motion.div>

      {/* تعتيم لطيف أعلى وأسفل ليقرأ النص بوضوح دون حجب الصورة */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.16) 22%, rgba(0,0,0,0) 42%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.30) 82%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      {/* ===== العنوان العلوي ===== */}
      <motion.h1
        initial={{ opacity: 0, y: -14, letterSpacing: "0.55em" }}
        animate={{ opacity: 1, y: 0, letterSpacing: "0.40em" }}
        transition={{ delay: 0.45, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-[7vh] px-6 text-center text-[clamp(0.95rem,2.6vw,2rem)] font-extralight uppercase text-white"
        style={{
          fontFamily: "var(--font-luxury)",
          textShadow:
            "0 0 10px rgba(255,255,255,0.42), 0 0 30px rgba(255,255,255,0.20), 0 0 70px rgba(255,255,255,0.10)",
        }}
      >
        {t("gate.club", lang)}
      </motion.h1>

      {/* ===== الدخول ===== */}
      <motion.button
        type="button"
        onClick={onEnter}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="gate-enter group relative z-10 mb-[7vh] flex cursor-pointer flex-col items-center bg-transparent px-8 py-3"
      >
        <span
          className="gate-enter__label text-[clamp(0.6rem,1.25vw,0.82rem)] font-light uppercase text-white"
          style={{ fontFamily: "var(--font-luxury)" }}
        >
          {t("gate.enter", lang)}
        </span>
        <span className="gate-enter__rule mt-3 block h-px w-[clamp(9rem,20vw,15rem)]" />
      </motion.button>

      <style jsx>{`
        .gate-enter__label {
          letter-spacing: 0.34em;
          text-indent: 0.34em;
          text-shadow:
            0 0 8px rgba(255, 255, 255, 0.34),
            0 0 24px rgba(255, 255, 255, 0.16);
          transition:
            letter-spacing 900ms cubic-bezier(0.22, 1, 0.36, 1),
            text-shadow 900ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
          transform: scale(1);
          transform-origin: center;
          display: inline-block;
        }

        .gate-enter__rule {
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.62) 22%,
            rgba(255, 255, 255, 0.82) 50%,
            rgba(255, 255, 255, 0.62) 78%,
            rgba(255, 255, 255, 0) 100%
          );
          box-shadow:
            0 0 7px rgba(255, 255, 255, 0.34),
            0 0 18px rgba(255, 255, 255, 0.16);
          transition:
            box-shadow 900ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
          opacity: 0.92;
          transform: scaleX(1);
        }

        :global(.gate-enter):hover .gate-enter__label,
        :global(.gate-enter):focus-visible .gate-enter__label {
          transform: scale(1.045);
          letter-spacing: 0.4em;
          text-indent: 0.4em;
          text-shadow:
            0 0 14px rgba(255, 255, 255, 0.85),
            0 0 38px rgba(255, 255, 255, 0.45),
            0 0 80px rgba(255, 255, 255, 0.22);
        }

        :global(.gate-enter):hover .gate-enter__rule,
        :global(.gate-enter):focus-visible .gate-enter__rule {
          opacity: 1;
          transform: scaleX(1.1);
          box-shadow:
            0 0 12px rgba(255, 255, 255, 0.8),
            0 0 32px rgba(255, 255, 255, 0.42),
            0 0 64px rgba(255, 255, 255, 0.2);
        }

        :global(.gate-enter):focus-visible {
          outline: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .gate-enter__label,
          .gate-enter__rule {
            transition-duration: 1ms;
          }
        }
      `}</style>
    </motion.section>
  );
}
