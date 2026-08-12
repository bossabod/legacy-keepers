"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RefreshCw, Loader2, Lock, ArrowLeft, X, Mail, Check, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { Cursor, Logo } from "@/components/brand";
import { Pulse } from "@/components/ui";
import { play } from "@/lib/sound";

/* ===== QR Code حقيقي يتولّد برمجياً، يتناسب مع حاويته مربعاً 1:1 ===== */
function LiveQRCode({ value, size = 168 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // ارسم الـ QR بحجم ثابت عالي الدقة؛ ثم يُعرض canvas بملء الحاوية (مربع 1:1)
  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size * 2,
      margin: 3,
      errorCorrectionLevel: "M",
      color: { dark: "#080a0f", light: "#f0f3f8" },
    })
      .then(() => {})
      .catch(() => {});
  }, [value, size]);

  // قِس حاوية الـ QR واضبط ارتفاع canvas ليطابق عرضها (مربع 1:1 دائماً)
  useEffect(() => {
    const el = wrapRef.current;
    const cv = canvasRef.current;
    if (!el || !cv) return;
    const sync = () => {
      const w = el.clientWidth || 0;
      if (w > 0) {
        cv.style.width = `${w}px`;
        cv.style.height = `${w}px`;
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="flex items-center justify-center overflow-hidden rounded-xl bg-[#f0f3f8] shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
      style={{ width: "100%", aspectRatio: "1 / 1", flexShrink: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          display: "block",
          imageRendering: "auto",
          width: "100%",
          aspectRatio: "1 / 1",
        }}
      />
    </div>
  );
}

function randHex(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += "0123456789ABCDEF"[Math.floor(Math.random() * 16)];
  return s;
}

export default function LoginScreen({
  onAuthenticated,
  onBack,
}: {
  onAuthenticated: () => void;
  onBack: () => void;
}) {
  const [membership, setMembership] = useState("");
  const [pass, setPass] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [count, setCount] = useState(15);
  const [code, setCode] = useState(() => randHex(16));
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          setCode(randHex(16));
          return 15;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    setVerifying(true);
    play("vault");
    // Go straight to the app — no artificial delay, no loading screen.
    play("granted");
    onAuthenticated();
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#020203] flex flex-col justify-between"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      <Cursor />

      {/* ====== Background: Full cinematic visibility, no blur ====== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/login-bg-eye.jpg)" }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        {/* Subtle dark overlay for readability only */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 100% at 50% 40%, rgba(4,6,9,0.35), rgba(1,2,3,0.72) 100%)",
          }}
        />
      </div>

      {/* ====== Two-Column Layout Overlays: Left darker, right lighter, soft vertical gradient separator ====== */}
      <div className="absolute inset-0 flex pointer-events-none">
        {/* Left Side: slightly darker */}
        <div className="w-1/2 bg-[#020305]/55" />
        {/* Right Side: slightly lighter */}
        <div className="w-1/2 bg-[#06080e]/35" />

        {/* Soft Vertical Gradient Separator (no harsh line) */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-48 bg-gradient-to-r from-[#020305]/80 via-[#0a0d14]/30 to-transparent" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>

      {/* ====== Top Navigation ====== */}
      <header className="relative z-30 flex items-center justify-between px-6 py-6 sm:px-12 lg:px-16 w-full">
        {/* Left: Back Button */}
        <div className="flex items-center">
          <button
            onClick={() => { play("click"); onBack(); }}
            onMouseEnter={() => play("hover")}
            className="group inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-mono tracking-widest text-[#8b95a5] border border-white/[0.08] bg-black/40 backdrop-blur-md transition-all duration-300 hover:border-[#c3c9d3]/40 hover:text-[#eaeef5] hover:bg-white/[0.04]"
          >
            <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span>BACK TO GATEWAY</span>
          </button>
        </div>

        {/* Center: Contact the Club */}
        <div className="absolute left-1/2 top-6 -translate-x-1/2">
          <button
            onClick={() => { setContactOpen(true); play("open"); }}
            onMouseEnter={() => play("hover")}
            className="group relative px-5 py-2 text-xs sm:text-sm font-luxury tracking-[0.25em] uppercase text-[#c3c9d3] transition-all duration-300 hover:text-white"
          >
            <span className="relative z-10">Contact the Club</span>
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-gradient-to-r from-transparent via-[#c3c9d3] to-transparent transition-all duration-300 group-hover:w-full" />
          </button>
        </div>

        {/* Right: Institutional Badge */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-[#565d68] hidden sm:inline-block">
            ATHAR &middot; ENCRYPTED PORTAL
          </span>
        </div>
      </header>

      {/* ====== Main Two-Column Gateway Panels ====== */}
      <main className="relative z-20 flex-1 flex items-center justify-center py-10 px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 w-full max-w-5xl items-stretch">
          
          {/* ===== Left Panel: Member Login ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
            className="relative w-full h-full max-w-md mx-auto rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-gradient-to-b from-[#0e1118]/90 via-[#080a0e]/92 to-[#040507]/95 border border-[#c3c9d3]/20 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden"
          >
            {/* Subtle top metallic shine */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-50" />

            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[0.65rem] tracking-[0.3em] uppercase text-[#8b95a5]">
                MEMBER ACCESS
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#c3c9d3] shadow-[0_0_8px_#c3c9d3]" />
            </div>

            <h2 className="font-luxury text-2xl sm:text-3xl font-semibold tracking-[0.08em] text-[#eaeef5] uppercase mb-2">
              Member Login
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#7f8896] leading-relaxed mb-7">
              Enter your verified credentials to decrypt the inner circle channel.
            </p>

            <form onSubmit={submit} className="space-y-5">
              {/* Membership ID Field (No Placeholder) */}
              <div className="space-y-2 text-left">
                <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                  Membership ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={membership}
                    onChange={(e) => { setMembership(e.target.value); play("type"); }}
                    className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-mono tracking-widest text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f]"
                  />
                </div>
              </div>

              {/* Membership Password Field (No Placeholder) */}
              <div className="space-y-2 text-left">
                <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                  Membership Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => { setPass(e.target.value); play("type"); }}
                    className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-mono tracking-[0.5em] text-center text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={verifying}
                  onMouseEnter={() => play("hover")}
                  className="group relative w-full overflow-hidden rounded-xl py-4 px-6 font-luxury text-sm font-semibold tracking-[0.2em] uppercase text-[#eaeef5] transition-all duration-500 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(180deg, #2a313d 0%, #161b24 50%, #0a0d13 100%)",
                    border: "1px solid rgba(195,201,211,0.35)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(174,182,194,0.08)",
                  }}
                >
                  <span className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-100" />

                  {verifying ? (
                    <span className="flex items-center justify-center gap-2.5 font-mono text-xs tracking-widest">
                      <Loader2 className="animate-spin text-[#c3c9d3]" size={16} />
                      AUTHENTICATING...
                    </span>
                  ) : (
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                      Authenticate
                    </span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between text-[0.68rem] font-mono text-[#565d68]">
              <span className="flex items-center gap-2">
                <Pulse color="#7f8896" />
                MONITORED CHANNEL
              </span>
              <span>256-BIT ENCRYPTION</span>
            </div>
          </motion.div>

          {/* ===== Right Panel: QR Access Gate (أعيد بناؤه بالكامل) ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
            className="relative w-full h-full max-w-md mx-auto rounded-2xl p-6 sm:p-8 backdrop-blur-2xl bg-gradient-to-b from-[#0f1522]/95 via-[#0a0e18]/96 to-[#05070d]/97 border border-[#3a5a86]/40 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(120,180,255,0.10)] overflow-hidden"
          >
            {/* توهّج علوي أزرق */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7fb0ff]/60 to-transparent opacity-80" />
            {/* توهّج جانبي خفيف */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full opacity-40"
              style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(90,150,255,0.16), transparent 70%)", filter: "blur(6px)" }}
            />

            {/* ===== 1) العنوان العلوي ===== */}
            <div className="relative flex items-center justify-between mb-3">
              <span className="font-mono text-[0.6rem] sm:text-[0.65rem] tracking-[0.3em] uppercase text-[#8b95a5]">
                Visual Authentication
              </span>
              <span className="font-mono text-[0.6rem] sm:text-[0.65rem] tracking-widest text-[#7fb0ff]/80">
                TOKEN &middot; V2.4
              </span>
            </div>

            {/* ===== 2) العنوان الرئيسي والوصف ===== */}
            <h2 className="relative font-luxury text-xl sm:text-2xl font-semibold tracking-[0.12em] text-[#eaeef5] uppercase mb-1.5">
              QR Access Gate
            </h2>
            <p className="relative font-sans text-xs sm:text-sm text-[#8b95a5] leading-relaxed mb-4">
              Scan the dynamic security token with your verified mobile terminal. Regenerates automatically.
            </p>

            {/* ===== 3) منطقة QR — مربع كبير، قريب من النص، بهامش متساوٍ ===== */}
            <div className="relative flex flex-col items-center justify-center">
              {/* الإطار الخارجي — مربع يملأ معظم العرض المتاح */}
              <div className="relative grid place-items-center rounded-2xl border border-[#3a5a86]/40 bg-gradient-to-b from-[#0c1220] to-[#060a12] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8),0_12px_35px_rgba(0,0,0,0.6)] p-2.5"
                style={{ width: "min(100%, 268px)", height: "min(100%, 268px)", aspectRatio: "1 / 1" }}
              >
                {/* زوايا تقنية */}
                <span className="pointer-events-none absolute -top-0.5 -left-0.5 h-4 w-4 border-t-2 border-l-2 border-[#7fb0ff]/70 rounded-tl" />
                <span className="pointer-events-none absolute -top-0.5 -right-0.5 h-4 w-4 border-t-2 border-r-2 border-[#7fb0ff]/70 rounded-tr" />
                <span className="pointer-events-none absolute -bottom-0.5 -left-0.5 h-4 w-4 border-b-2 border-l-2 border-[#7fb0ff]/70 rounded-bl" />
                <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-4 w-4 border-b-2 border-r-2 border-[#7fb0ff]/70 rounded-br" />

                {/* الـ QR — أكبر، قريب جدًا من حدود الإطار بهامش صغير متساوٍ */}
                <div className="grid place-items-center" style={{ width: "97%", height: "97%" }}>
                  <LiveQRCode value={code} size={1} />
                </div>
              </div>

              {/* ===== 4) TOKEN + العداد (قريب من الـ QR) ===== */}
              <div className="relative mt-3 flex w-full items-center justify-between max-w-[250px] font-mono text-[0.65rem] sm:text-[0.7rem] text-[#8b95a5]">
                <span>
                  TOKEN: <span className="text-[#c3c9d3]">{code.slice(0, 8)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7fb0ff] shadow-[0_0_8px_#7fb0ff]" />
                  <span className="text-[#eaeef5]">{count}s</span>
                </span>
              </div>

              {/* شريط العد التنازلي */}
              <div className="relative mt-2.5 h-1 w-full max-w-[250px] overflow-hidden rounded-full bg-[#050609] border border-white/[0.06] p-[1px]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#2a4a7a] via-[#7fb0ff] to-[#c3d9ff]"
                  animate={{ width: `${(count / 15) * 100}%` }}
                  transition={{ ease: "linear", duration: 1 }}
                />
              </div>
            </div>

            {/* ===== 5) خط فاصل + زر Refresh ===== */}
            <div className="relative my-4 h-px w-full bg-gradient-to-r from-transparent via-[#3a5a86]/50 to-transparent" />
            <button
              type="button"
              onClick={() => {
                setCode(randHex(16));
                setCount(15);
                play("select");
              }}
              onMouseEnter={() => play("hover")}
              className="group relative w-full overflow-hidden rounded-xl py-3 px-6 font-mono text-xs tracking-[0.25em] uppercase text-[#c3c9d3] transition-all duration-300 hover:text-white border border-[#3a5a86]/50 bg-gradient-to-b from-[#0c1422]/80 to-[#060a12]/90 hover:border-[#7fb0ff]/60 hover:bg-white/[0.04] shadow-[inset_0_1px_0_rgba(127,176,255,0.10),0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2.5"
            >
              <RefreshCw size={14} className="transition-transform duration-500 group-hover:rotate-180" />
              <span>Refresh</span>
            </button>

            {/* ===== 6) Session Hash ===== */}
            <div className="relative mt-4 pt-3 border-t border-white/[0.06] text-center font-mono text-[0.6rem] sm:text-[0.65rem] text-[#565d68]">
              SESSION HASH: <span className="text-[#8b95a5] select-all">{code}</span>
            </div>
          </motion.div>

        </div>
      </main>

      {/* ====== Footer ====== */}
      <footer className="relative z-20 pb-6 pt-8 flex flex-col items-center justify-center gap-1.5 text-center pointer-events-none">
        <p className="font-luxury text-xs sm:text-sm tracking-[0.35em] uppercase text-[#8b95a5] text-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          Legal &amp; Authorized Club
        </p>
        <p className="font-mono text-[0.58rem] sm:text-[0.65rem] tracking-[0.28em] uppercase text-[#4a515d]">
          Closed System &middot; Est. 2012
        </p>
      </footer>

      {/* ====== Verification Scrim ====== */}
      <AnimatePresence>
        {verifying && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative h-16 w-16">
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{ borderTopColor: "#c3c9d3" }}
              >
                <motion.div
                  className="h-full w-full rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <Lock className="absolute inset-0 m-auto text-[#c3c9d3]" size={20} />
            </div>
            <p className="font-luxury text-sm tracking-[0.3em] uppercase text-[#eaeef5]">
              Decrypting Inner Circle...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== Contact the Club Modal & Scrim ====== */}
      <AnimatePresence>
        {contactOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <motion.div
              className="relative w-full max-w-md rounded-2xl p-8 sm:p-10 border border-[#c3c9d3]/25 bg-gradient-to-b from-[#141820]/95 via-[#0a0d12]/98 to-[#050608] shadow-[0_30px_80px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.12)] text-center overflow-hidden"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {/* Top metallic shine */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />

              {/* Minimal Close Button */}
              <button
                onClick={() => { setContactOpen(false); play("click"); }}
                onMouseEnter={() => play("hover")}
                className="absolute top-5 right-5 h-8 w-8 rounded-full flex items-center justify-center text-[#8b95a5] hover:text-[#eaeef5] hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div className="mx-auto w-12 h-12 rounded-full border border-[#c3c9d3]/20 bg-gradient-to-b from-[#1e2430] to-[#0a0d12] flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                <Logo size={24} />
              </div>

              <h3 className="font-luxury text-2xl sm:text-3xl font-semibold tracking-[0.1em] text-[#eaeef5] uppercase">
                Contact the Club
              </h3>

              <div className="my-5 mx-auto h-px w-16 bg-gradient-to-r from-transparent via-[#c3c9d3]/40 to-transparent" />

              <p className="font-sans text-xs sm:text-sm text-[#8b95a5] leading-relaxed mb-6">
                For membership inquiries, covenant verification, or diplomatic correspondence with the executive council:
              </p>

              <div className="rounded-xl border border-[#383f4d]/80 bg-[#06080c] p-4 mb-8 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 group/mail transition-all hover:border-[#c3c9d3]/40">
                <span className="font-mono text-xs sm:text-sm tracking-wider text-[#c3c9d3] select-all">
                  contact@athar-club.org
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText("contact@athar-club.org");
                    setCopied(true);
                    play("granted");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-[0.7rem] font-mono tracking-widest text-[#aeb6c2] hover:text-white hover:bg-white/10 transition-all"
                >
                  {copied ? "COPIED ✓" : "COPY"}
                </button>
              </div>

              <button
                onClick={() => { setContactOpen(false); play("click"); }}
                className="w-full py-3 rounded-xl border border-[#c3c9d3]/25 bg-gradient-to-b from-[#222834] to-[#12161e] text-xs font-mono tracking-[0.2em] uppercase text-[#c3c9d3] hover:text-white hover:border-[#c3c9d3]/50 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_20px_rgba(0,0,0,0.6)]"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
