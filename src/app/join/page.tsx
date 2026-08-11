"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Send, CheckCircle2, X } from "lucide-react";
import { Cursor, Logo } from "@/components/brand";
import { Pulse } from "@/components/ui";
import { play } from "@/lib/sound";
import Link from "next/link";

export default function JoinPage() {
  const [name, setName] = useState("");
  const [who, setWho] = useState("");
  const [why, setWhy] = useState("");
  const [add, setAdd] = useState("");
  const [search, setSearch] = useState("");
  const [how, setHow] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    // simple validation
    if (!name.trim() || !who.trim() || !why.trim() || !add.trim() || !search.trim() || !how.trim()) {
      play("click");
      return;
    }
    setSending(true);
    play("vault");
    setTimeout(() => {
      play("granted");
      setSuccess(true);
      setSending(false);
    }, 1200);
  };

  return (
    <motion.div
      className="relative min-h-screen w-full overflow-x-hidden bg-[#020203] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      dir="rtl"
    >
      <Cursor />

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/login-bg-eye.jpg)" }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(130% 100% at 50% 40%, rgba(4,6,9,0.35), rgba(1,2,3,0.72) 100%)",
          }}
        />
      </div>

      <div className="absolute inset-0 flex pointer-events-none">
        <div className="w-1/2 bg-[#020305]/55" />
        <div className="w-1/2 bg-[#06080e]/35" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-48 bg-gradient-to-r from-[#020305]/80 via-[#0a0d14]/30 to-transparent" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>

      {/* Header */}
      <header className="relative z-30 flex items-center justify-between px-6 py-6 sm:px-12 lg:px-16 w-full" dir="ltr">
        <Link
          href="/"
          onClick={() => play("click")}
          onMouseEnter={() => play("hover")}
          className="group inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-mono tracking-widest text-[#8b95a5] border border-white/[0.08] bg-black/40 backdrop-blur-md transition-all duration-300 hover:border-[#c3c9d3]/40 hover:text-[#eaeef5] hover:bg-white/[0.04]"
        >
          <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
          <span>BACK TO GATEWAY</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-[#565d68] hidden sm:inline-block">
            ATHAR &middot; ENCRYPTED PORTAL
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-20 flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative w-full max-w-[680px] rounded-2xl p-7 sm:p-10 backdrop-blur-2xl bg-gradient-to-b from-[#0e1118]/90 via-[#080a0e]/92 to-[#040507]/95 border border-[#c3c9d3]/20 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden"
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-50" />

          <div className="flex items-center justify-between" dir="ltr">
            <span className="font-mono text-[0.65rem] tracking-[0.3em] uppercase text-[#8b95a5]">
              MEMBERSHIP REQUEST
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#c3c9d3] shadow-[0_0_8px_#c3c9d3]" />
          </div>

          <h1 className="font-luxury text-2xl sm:text-3xl font-semibold tracking-[0.08em] text-[#eaeef5] text-center mt-6" style={{ fontFamily: "var(--font-luxury)" }}>
            طلب الانضمام إلى النادي
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7f8896] leading-relaxed text-center mt-3">
            أخبرنا عن نفسك، وما الذي دفعك إلى الوصول إلى هذا المكان.
          </p>

          <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                className="py-10 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#1e232d] to-[#0a0c10] border border-[#c3c9d3]/30 flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.6)]">
                  <CheckCircle2 size={28} className="text-[#c3c9d3]" />
                </div>
                <h3 className="font-luxury text-2xl font-semibold tracking-[0.1em] text-[#eaeef5]">تم استلام طلبك</h3>
                <p className="font-sans text-sm text-[#8b95a5] leading-relaxed mt-3 max-w-md">
                  سيتم مراجعة طلبك من قبل أعضاء النادي.
                </p>
                <div className="mt-8 h-px w-16 bg-gradient-to-r from-transparent via-[#c3c9d3]/40 to-transparent" />
                <Link
                  href="/"
                  onClick={() => play("click")}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-mono tracking-[0.2em] uppercase text-[#c3c9d3] border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#c3c9d3]/30 hover:text-white transition-all"
                >
                  العودة إلى البوابة
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* الاسم أو الاسم المستعار */}
                <div className="space-y-2 text-right">
                  <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                    الاسم أو الاسم المستعار <span className="text-[#c3c9d3]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اكتب اسمك هنا"
                    className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-sans text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f] placeholder:text-[#4a515d] text-right"
                    required
                  />
                </div>

                {/* من أنت؟ */}
                <div className="space-y-2 text-right">
                  <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                    من أنت؟ <span className="text-[#c3c9d3]">*</span>
                  </label>
                  <textarea
                    value={who}
                    onChange={(e) => setWho(e.target.value)}
                    placeholder="عرفنا بنفسك باختصار"
                    rows={3}
                    className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-sans text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f] placeholder:text-[#4a515d] text-right resize-none"
                    required
                  />
                </div>

                {/* لماذا ترغب في الانضمام */}
                <div className="space-y-2 text-right">
                  <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                    لماذا ترغب في الانضمام إلى النادي؟ <span className="text-[#c3c9d3]">*</span>
                  </label>
                  <textarea
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    placeholder="ما الدافع الحقيقي وراء رغبتك؟"
                    rows={3}
                    className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-sans text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f] placeholder:text-[#4a515d] text-right resize-none"
                    required
                  />
                </div>

                {/* ماذا يمكنك أن تضيف */}
                <div className="space-y-2 text-right">
                  <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                    ماذا يمكنك أن تضيف إلى النادي؟ <span className="text-[#c3c9d3]">*</span>
                  </label>
                  <textarea
                    value={add}
                    onChange={(e) => setAdd(e.target.value)}
                    placeholder="مهاراتك، خبراتك، أو ما يميزك"
                    rows={3}
                    className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-sans text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f] placeholder:text-[#4a515d] text-right resize-none"
                    required
                  />
                </div>

                {/* ما الذي تبحث عنه */}
                <div className="space-y-2 text-right">
                  <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                    ما الذي تبحث عنه داخل النادي؟ <span className="text-[#c3c9d3]">*</span>
                  </label>
                  <textarea
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="التجربة أو القيمة التي تنتظرها"
                    rows={3}
                    className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-sans text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f] placeholder:text-[#4a515d] text-right resize-none"
                    required
                  />
                </div>

                {/* كيف وصلت إلينا */}
                <div className="space-y-2 text-right">
                  <label className="block font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]">
                    كيف وصلت إلينا؟ <span className="text-[#c3c9d3]">*</span>
                  </label>
                  <input
                    type="text"
                    value={how}
                    onChange={(e) => setHow(e.target.value)}
                    placeholder="صديق، دعوة، وسائل التواصل..."
                    className="w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/70 rounded-xl px-4 py-3.5 text-[#eaeef5] font-sans text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:shadow-[0_0_20px_rgba(195,201,211,0.12),inset_0_2px_6px_rgba(0,0,0,0.9)] focus:bg-[#07090f] placeholder:text-[#4a515d] text-right"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={sending}
                    onMouseEnter={() => play("hover")}
                    className="group relative w-full overflow-hidden rounded-xl py-4 px-6 font-luxury text-sm font-semibold tracking-[0.2em] uppercase text-[#eaeef5] transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(180deg, #2a313d 0%, #161b24 50%, #0a0d13 100%)",
                      border: "1px solid rgba(195,201,211,0.35)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(174,182,194,0.08)",
                    }}
                  >
                    <span className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-100" />
                    {sending ? (
                      <span className="flex items-center justify-center gap-2.5 font-mono text-xs tracking-widest">
                        <span className="h-4 w-4 rounded-full border-2 border-transparent" style={{ borderTopColor: "#c3c9d3", animation: "spin-cw 0.8s linear infinite" }} />
                        جاري الإرسال...
                      </span>
                    ) : (
                      <>
                        <Send size={14} />
                        <span className="relative z-10">إرسال الطلب</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {!success && (
            <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between text-[0.68rem] font-mono text-[#565d68]" dir="ltr">
              <span className="flex items-center gap-2">
                <Pulse color="#7f8896" />
                SECURE CHANNEL
              </span>
              <span>ENCRYPTED FORM</span>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="relative z-20 pb-6 pt-8 flex flex-col items-center justify-center gap-1.5 text-center pointer-events-none">
        <p className="font-luxury text-xs sm:text-sm tracking-[0.35em] uppercase text-[#8b95a5]">
          Legal &amp; Authorized Club
        </p>
        <p className="font-mono text-[0.58rem] sm:text-[0.65rem] tracking-[0.28em] uppercase text-[#4a515d]">
          Closed System &middot; Est. 2012
        </p>
      </footer>
    </motion.div>
  );
}
