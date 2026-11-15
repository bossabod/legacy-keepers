"use client";
import { useState } from "react";
import { Banknote, Car, Plane, Hotel, FileText, Calendar, Users, Gift, Check, Loader2, X } from "lucide-react";
import { SectionHeading, Reveal } from "@/components/ui";
import { play } from "@/lib/sound";

interface Service {
  id: string;
  title: string;
  icon: typeof Banknote;
  description: string;
}

const SERVICES: Service[] = [
  { id: "financial", title: "Financial Requests", icon: Banknote, description: "Submit financial support requests for approved projects or exceptional circumstances." },
  { id: "invoice", title: "Invoice Requests", icon: FileText, description: "Request invoice generation, payment processing, or billing adjustments." },
  { id: "vehicle", title: "Executive Vehicles", icon: Car, description: "Request an executive vehicle with a professional driver. Bentley, Rolls-Royce, or Mercedes-Maybach." },
  { id: "flight", title: "Flight Reservations", icon: Plane, description: "Book private or first-class flights with full concierge coordination." },
  { id: "hotel", title: "Hotel Reservations", icon: Hotel, description: "Reserve premium accommodations at partnered luxury properties worldwide." },
  { id: "visa", title: "Travel Visa Assistance", icon: FileText, description: "Request diplomatic or expedited visa processing through authorized channels." },
  { id: "meeting", title: "Private Meetings", icon: Users, description: "Arrange confidential meetings with vetted members or external parties." },
  { id: "event", title: "Event Reservations", icon: Gift, description: "Reserve seats at exclusive galas, summits, and private gatherings." },
];

const inputClass = "w-full bg-[#050609]/85 border border-[#383f4d]/80 focus:border-[#c3c9d3]/60 rounded-xl px-4 py-3 text-[#eaeef5] text-sm outline-none transition-all duration-300 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] focus:bg-[#07090f] font-sans";
const labelClass = "block mb-2 text-[0.68rem] uppercase tracking-[0.22em] text-[#aeb6c2]";

export default function FeaturesSection() {
  const [active, setActive] = useState<Service | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [form, setForm] = useState({ purpose: "", priority: "Standard", date: "", details: "", attachments: "" });

  const openService = (s: Service) => {
    setActive(s);
    setStatus("idle");
    setForm({ purpose: "", priority: "Standard", date: "", details: "", attachments: "" });
    play("open");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    play("vault");
    setTimeout(() => { setStatus("done"); play("granted"); }, 1600);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="Member Services"
        title="Premium Concierge"
        desc="Exclusive services reserved for verified members of the inner circle."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((s, i) => (
          <Reveal key={s.id} delay={(i % 4) * 0.05}>
            <button
              onClick={() => openService(s)}
              onMouseEnter={() => play("hover")}
              className="group flex h-full w-full flex-col items-start rounded-2xl border border-[#c3c9d3]/12 bg-gradient-to-b from-[#0e1118]/90 to-[#06080c] p-6 text-left transition-all duration-400 hover:border-[#c3c9d3]/30 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#c3c9d3]/20 bg-[#c3c9d3]/5 transition-all duration-300 group-hover:border-[#c3c9d3]/40 group-hover:bg-[#c3c9d3]/10">
                <s.icon size={20} className="text-[#c3c9d3]" />
              </div>
              <h3 className="text-base font-semibold text-[#eaeef5] mb-1.5" style={{ fontFamily: "var(--font-luxury)" }}>{s.title}</h3>
              <p className="text-[0.76rem] leading-relaxed text-[#7f8896]">{s.description}</p>
            </button>
          </Reveal>
        ))}
      </div>

      {/* Service Request Modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={() => setActive(null)} />
          <div className="glass-strong relative z-10 w-full max-w-lg rounded-2xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setActive(null); setStatus("idle"); }} className="absolute top-5 right-5 text-[#8b95a5] hover:text-[#eaeef5] transition-colors">
              <X size={18} />
            </button>

            {status === "done" ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#c3c9d3]/30 bg-gradient-to-b from-[#1e2430] to-[#0a0d12] shadow-[0_0_30px_rgba(195,201,211,0.15)]">
                  <Check size={28} className="text-[#c3c9d3]" />
                </div>
                <h3 className="text-xl font-semibold text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>Request Submitted</h3>
                <p className="max-w-sm text-sm leading-relaxed text-[#aeb6c2]">
                  Your {active.title.toLowerCase()} request has been received and assigned to the concierge division. You will be notified via encrypted channel.
                </p>
                <button onClick={() => { setActive(null); setStatus("idle"); }} className="mt-3 text-[0.72rem] uppercase tracking-[0.2em] text-[#565d68] hover:text-[#aeb6c2] transition-colors" style={{ fontFamily: "var(--font-luxury)" }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c3c9d3]/20 bg-[#c3c9d3]/5">
                    <active.icon size={20} className="text-[#c3c9d3]" />
                  </div>
                  <div>
                    <div className="text-[0.6rem] uppercase tracking-[0.2em] text-[#565d68]" style={{ fontFamily: "var(--font-ibm-mono)" }}>Service Request</div>
                    <h3 className="text-xl font-semibold text-[#eaeef5]" style={{ fontFamily: "var(--font-luxury)" }}>{active.title}</h3>
                  </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className={labelClass}>Purpose</label>
                    <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Priority</label>
                      <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={`${inputClass} [color-scheme:dark]`}>
                        <option>Standard</option>
                        <option>Elevated</option>
                        <option>Critical</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Preferred Date</label>
                      <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`${inputClass} [color-scheme:dark]`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Details</label>
                    <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
                  </div>
                  <div>
                    <label className={labelClass}>Attachments</label>
                    <input value={form.attachments} onChange={(e) => setForm({ ...form, attachments: e.target.value })} placeholder="File references or links" className={inputClass} />
                  </div>
                  <button type="submit" disabled={status === "submitting"} onMouseEnter={() => play("hover")} className="w-full rounded-xl border border-[#c3c9d3]/30 bg-gradient-to-b from-[#2a313d] to-[#0a0d13] py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#eaeef5] transition-all duration-300 hover:border-[#c3c9d3]/50 hover:text-white disabled:opacity-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.6)]" style={{ fontFamily: "var(--font-luxury)" }}>
                    {status === "submitting" ? (
                      <span className="flex items-center justify-center gap-2.5 mono text-xs tracking-widest">
                        <Loader2 className="animate-spin text-[#c3c9d3]" size={16} /> PROCESSING...
                      </span>
                    ) : "Submit Request"}
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
