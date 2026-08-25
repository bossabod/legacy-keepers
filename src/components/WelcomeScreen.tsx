"use client";
import { publicPath } from "@/lib/public-path";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Cursor } from "@/components/brand";
import { play } from "@/lib/sound";

// Module-level flag: ensures the intro sequence plays only once per browser session/page load.
// Navigating between pages/screens within the SPA does not replay the intro.
// Reloading the page (F5) or starting a new browser session resets memory and plays the intro again.
let hasPlayedIntroThisSession = false;

export default function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  const [introStage, setIntroStage] = useState<"intro-emblem" | "intro-fade" | "done">(() => {
    if (hasPlayedIntroThisSession) {
      return "done";
    }
    return "intro-emblem";
  });

  useEffect(() => {
    if (hasPlayedIntroThisSession) return;
    hasPlayedIntroThisSession = true;

    // Stage 1: At t=0, the screen is black and only the face image is visible.
    // After ~1.2s the face fades out and the full plate image crossfades in.
    const timer1 = setTimeout(() => {
      setIntroStage("intro-fade");
    }, 1200);

    // Stage 3: At ~2.6s (after 1.4s crossfade/blend), the intro sequence is complete.
    const timer2 = setTimeout(() => {
      setIntroStage("done");
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  type ExitStage = "idle" | "fading-out-site" | "holding-emblem" | "fading-out-emblem";
  const [exitStage, setExitStage] = useState<ExitStage>("idle");

  const handleEnter = () => {
    if (exitStage !== "idle") return; // prevent double-fire during exit
    // If intro still playing, skip straight to login path
    if (introStage !== "done") {
      setIntroStage("done");
    }
    try { play("select"); } catch { /* noop */ }
    setExitStage("fading-out-site");
    // Never leave a blocking layer if user double-taps during exit

    // المرحلة الأولى: خلال 1.2 ثانية تتلاشى عناصر الموقع للخلفية السوداء ويبقى الشعار الفارس ثابتاً في المنتصف
    // يستمر عرض الشعار منفرداً على الشاشة السوداء لمدة 0.9 ثانية (حتى t = 2100ms)
    setTimeout(() => {
      setExitStage("holding-emblem");
    }, 600);

    // المرحلة الثانية: عند t = 2100ms يبدأ الشعار بالتلاشي ببطء للظلام الدامس خلال 1.2 ثانية
    setTimeout(() => {
      setExitStage("fading-out-emblem");
    }, 1000);

    // المرحلة الثالثة: فور اكتمال تلاشي الشعار (عند t = 3300ms) ننتقل بسلاسة للصفحة التالية
    setTimeout(() => {
      onEnter();
    }, 1600);
  };

  const getEmblemOpacity = () => {
    if (introStage === "intro-emblem") return 1;
    if (introStage === "intro-fade") return 0;
    if (exitStage === "fading-out-site" || exitStage === "holding-emblem") return 1;
    if (exitStage === "fading-out-emblem") return 0;
    return 0;
  };

  const getEmblemDuration = () => {
    if (introStage === "intro-emblem") return 1.8;
    if (introStage === "intro-fade") return 1.5;
    if (exitStage === "fading-out-site") return 1.2;
    if (exitStage === "fading-out-emblem") return 1.2;
    return 0.5;
  };

  const getSiteOpacity = () => {
    if (introStage === "intro-emblem") return 0;
    if (exitStage !== "idle") return 0;
    return 1;
  };

  const getSiteDuration = () => {
    if (introStage === "intro-fade") return 1.5;
    if (exitStage === "fading-out-site") return 1.2;
    return 0.5;
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-hidden bg-black"
      style={{ zIndex: 20 }}
      initial={{ opacity: hasPlayedIntroThisSession ? 0 : 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.01 }, pointerEvents: "none" }}
      transition={{ duration: exitStage !== "idle" ? 0.1 : 0.6, ease: "easeInOut" }}
    >
      <Cursor />

      {/* ====== طبقة الوجه — صورة الوجه فقط (خلفية سوداء + وجه فضي في المنتصف) ====== */}
      <motion.div
        className="absolute inset-0 z-50 bg-black bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: `url(${publicPath("/images/BD60D113-2836-48F0-A78C-CD8269081B2A.png")})`,
        }}
        initial={{ opacity: 0, scale: 1 }}
        animate={{
          opacity: getEmblemOpacity(),
          scale: 1.03,
        }}
        transition={{
          opacity: {
            duration: getEmblemDuration(),
            ease: "easeInOut",
          },
          scale: {
            duration: 30,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          },
        }}
      />

      {/* ====== المحتوى الكامل للموقع (يختفي عند الخروج، ويظهر بعد التمهيد) ====== */}
      <motion.div
        className={`absolute inset-0 flex min-h-screen w-full flex-col items-center ${
          introStage !== "done" || exitStage !== "idle" ? "pointer-events-none" : "pointer-events-auto"
        }`}
        initial={{ opacity: introStage === "done" ? 1 : 0 }}
        animate={{ opacity: getSiteOpacity() }}
        transition={{
          duration: getSiteDuration(),
          ease: "easeInOut",
        }}
      >
        {/* صورة اللوحة الفضية الكاملة (الخلفية) */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${publicPath("/images/bilinmeyen.jpg")})` }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />

        {/* ستار داكن خفيف لإبراز النص */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(125% 100% at 50% 30%, rgba(4,6,8,0.30), rgba(1,2,3,0.88) 100%)",
          }}
        />

        {/* المحتوى الداخلي — على محور واحد في المنتصف */}
        <div className="relative z-10 flex min-h-screen w-full flex-col items-center">
          {/* ====== العنوان: PEOPLE OF IMPACT — معتمد كما هو ====== */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="pt-[11vh] text-center sm:pt-[13vh]"
          >
            <h1
              style={{
                fontFamily: "var(--font-luxury)",
                fontWeight: 600,
                fontSize: "clamp(2rem, 4.6vw, 4rem)",
                lineHeight: 1.05,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#191b1f",
                textShadow: "0 1px 3px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,0.9)",
              }}
            >
              People of Impact
            </h1>
          </motion.div>

          {/* المساحة الوسطى النظيفة والبسيطة بعد إزالة الشعار */}
          <div className="flex-1" />

          {/* ====== بوابة الدخول ====== */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
            className="flex w-full flex-col items-center pb-[8vh]"
          >
            <div
              role="button"
              tabIndex={0}
              className="entry-zone"
              onClick={handleEnter}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleEnter();
                }
              }}
              onMouseEnter={() => { try { play("hover"); } catch { /* noop */ } }}
            >
              {/* توهج سينمائي دائم */}
              <div className="entry-glow" />

              {/* خط معدني علوي */}
              <div className="entry-line" />

              {/* نص الدخول — كبير، مطابق للون العنوان */}
              <div className="entry-text-wrap" style={{ margin: "1.4rem 0" }}>
                <span
                  className="entry-text"
                  style={{
                    fontFamily: "var(--font-luxury)",
                    fontWeight: 600,
                    fontSize: "clamp(1.2rem, 1.8vw, 1.6rem)",
                    letterSpacing: "0.42em",
                    textTransform: "uppercase",
                  }}
                >
                  Enter the System
                </span>
                <span
                  className="entry-shine"
                  style={{
                    fontFamily: "var(--font-luxury)",
                    fontWeight: 600,
                    fontSize: "clamp(1.2rem, 1.8vw, 1.6rem)",
                    letterSpacing: "0.42em",
                    textTransform: "uppercase",
                  }}
                >
                  Enter the System
                </span>
              </div>

              {/* خط معدني سفلي */}
              <div className="entry-line" />
            </div>

            {/* النص الفرعي — ثابت، استاتيكي ومحفور تحت البوابة */}
            <p
              style={{
                fontFamily: "var(--font-luxury)",
                fontWeight: 400,
                fontSize: "clamp(0.75rem, 1.06vw, 0.98rem)",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: "#0c0e12",
                textShadow: "0 1px 2px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,0.9)",
                marginTop: "1.4rem",
              }}
            >
              Elite Club &mdash; Est. 2012
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
