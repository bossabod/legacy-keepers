"use client";
import { useState } from "react";
import { Banknote, FileText, Plane, Car, Hotel, AlertTriangle, Check, Loader2, X } from "lucide-react";
import { SectionHeading, Reveal } from "@/components/ui";
import { play } from "@/lib/sound";

const SERVICES = [
  { id: "financial", title: "Financial Support", icon: Banknote, desc: "Request financial assistance for approved needs." },
  { id: "invoice", title: "Invoice Payment", icon: FileText, desc: "Pay or manage outstanding invoices." },
  { id: "travel", title: "Travel Expenses", icon: Plane, desc: "Submit travel-related expense claims." },
  { id: "vehicle", title: "Vehicle Expenses", icon: Car, desc: "Request vehicle allocation and expenses." },
  { id: "accommodation", title: "Accommodation", icon: Hotel, desc: "Arrange premium accommodation bookings." },
  { id: "emergency", title: "Emergency Support", icon: AlertTriangle, desc: "Urgent financial or logistical assistance." },
];

export default function PaymentsSection() {
  const [active, setActive] = useState<typeof SERVICES[0] | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting"); play("vault");
    setTimeout(() => { setStatus("done"); play("granted"); }, 1600);
  };

  const inputClass = "w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/60 rounded-xl px-4 py-3 text-[#eaeef5] text-sm outline-none transition-all duration-300";

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading eyebrow="Financial Center" title="Payments" desc="Manage all financial transactions and service payments." />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s, i) => (
          <Reveal key={s.id} delay={(i % 3) * 0.05}>
            <button onClick={() => { setActive(s); setStatus("idle"); setAmount(""); setDetails(""); play("open"); }} onMouseEnter={() => play("hover")}
              className="group flex h-full w-full flex-col items-start rounded-2xl border border-[#c3c9d3]/12 bg-gradient-to-b from-[#0e1118]/90 to-[#06080c] p-6 text-left transition-all duration-400 hover:border-[#c3c9d3]/30 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#c3c9d3]/20 bg-[#c3c9d3]/5 transition-all group-hover:border-[#c3c9d3]/40">
                <s.icon size={20} className="text-[#c3c9d3]" />
              </div>
              <h3 className="text-base font-semibold text-[#eaeef5] mb-1.5" style={{ fontFamily: "var(--font-luxury)" }}>{s.title}</h3>
              <p className="text-[0.76rem] leading-relaxed text-[#7f8896]">{s.desc}</p>
            </button>
          </Reveal>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={() => setActive(null)} />
          <div className="glass-strong relative z-10 w-full max-w-md rounded-2xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.9)]">
            <button onClick={() => { setActive(null); setStatus("idle"); }} className="absolute top-5 right-5 text-[#8b95a5] hover:text-[#eaeef5]"><X size={18} /></button>
            {status === "done" ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c3c9d3]/30 bg-gradient-to-b from-[#1e2430] to-[#0a0d12]"><Check size={24} className="text-[#c3c9d3]" /></div>
                <p className="text-sm text-[#aeb6c2]">Your {active.title.toLowerCase()} request has been submitted for processing.</p>
                <button onClick={() => { setActive(null); setStatus("idle"); }} className="text-[0.72rem] uppercase tracking-[0.2em] text-[#565d68] hover:text-[#aeb6c2]" style={{ fontFamily: "var(--font-luxury)" }}>Close</button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c3c9d3]/20 bg-[#c3c9d3]/5"><active.icon size={18} className="text-[#c3c9d3]" /></div>
                  <h3 className="text-lg font-semibold text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>{active.title}</h3>
                </div>
                <form onSubmit={submit} className="space-y-4">
                  <div><label className="block mb-2 text-[0.68rem] uppercase tracking-[0.2em] text-[#aeb6c2]">Amount</label><input value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} required /></div>
                  <div><label className="block mb-2 text-[0.68rem] uppercase tracking-[0.2em] text-[#aeb6c2]">Details</label><textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className={`${inputClass} resize-none`} /></div>
                  <button type="submit" disabled={status === "submitting"} onMouseEnter={() => play("hover")} className="w-full rounded-xl border border-[#c3c9d3]/30 bg-gradient-to-b from-[#2a313d] to-[#0a0d13] py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#eaeef5] transition-all hover:border-[#c3c9d3]/50 hover:text-white disabled:opacity-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.6)]" style={{ fontFamily: "var(--font-luxury)" }}>
                    {status === "submitting" ? <span className="flex items-center justify-center gap-2 mono text-xs"><Loader2 className="animate-spin text-[#c3c9d3]" size={16} /> PROCESSING...</span> : "Submit Request"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
