"use client";
import { publicPath } from "@/lib/public-path";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";

/* ==================================================================
   VIP / ELITE ACCESS — كبار الشخصيات.
   A private members-club concierge. Elegant, quiet, photographic,
   minimal — no neon, no emojis, no AI-card look. Services open into
   a request form (real, in-app). Bilingual.
   ================================================================== */

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

interface Service {
  id: string;
  title: string;
  titleAr: string;
  img: string;
  blurb: string;
  blurbAr: string;
  desc: string;
  descAr: string;
  options: string[];
  optionsAr: string[];
  hasCity?: boolean;
  hasDate?: boolean;
  hasGuests?: boolean;
}

const SERVICES: Service[] = [
  {
    id: "dining",
    title: "Private Dining",
    titleAr: "المطاعم الخاصة",
    img: publicPath("/images/vip-dining.jpg"),
    blurb: "Access to exclusive restaurants and reserved tables.",
    blurbAr: "وصول إلى مطاعم راقية وحجوزات مميزة.",
    desc: "We secure reservations at some of the most sought-after dining rooms, where a table is rarely available to the public. Your concierge handles the arrangement and any special requests privately.",
    descAr: "نؤمّن حجوزات في أرقى المطاعم حيث يصعب الحصول على طاولة. يتولّى فريقك الخاص الترتيب وتنفيذ الطلبات الخاصة.",
    options: ["Chef's Table", "Private Room", "Tasting Menu", "Sommelier Pairing"],
    optionsAr: ["طاولة الشيف", "غرفة خاصة", "قائمة تذوّق", "مواكبة السوملييه"],
    hasCity: true, hasDate: true, hasGuests: true,
  },
  {
    id: "realestate",
    title: "Luxury Real Estate",
    titleAr: "العقارات الفاخرة",
    img: publicPath("/images/vip-realestate.jpg"),
    blurb: "Private viewings of exclusive villas and residences.",
    blurbAr: "معاينات خاصة لفلل ومساكن حصرية.",
    desc: "Private access to a curated portfolio of villas, penthouses and exclusive residences. Arrange a discreet viewing at a time that suits you.",
    descAr: "وصول خاص إلى مجموعة منتقاة من الفلل والبنتهاوس والمساكن الحصرية، مع ترتيب معاينة خاصة في الوقت المناسب لك.",
    options: ["Private Villa", "Penthouse", "Island Residence", "Waterfront"],
    optionsAr: ["فيلا خاصة", "بنتهاوس", "إقامة جزيرة", "واجهة مائية"],
    hasCity: true, hasDate: true,
  },
  {
    id: "travel",
    title: "Luxury Travel",
    titleAr: "السفر الفاخر",
    img: publicPath("/images/vip-travel.jpg"),
    blurb: "Private jets, five-star stays and dedicated transfers.",
    blurbAr: "طائرات خاصة، فنادق فاخرة، ونقل مخصص.",
    desc: "End-to-end travel orchestration — private aviation, the finest hotels and dedicated ground transport, tailored to your schedule.",
    descAr: "تنظيم كامل للسفر — طيران خاص، أرقى الفنادق ونقل بري مخصص بما يناسب جدولك.",
    options: ["Private Jet", "Five-Star Hotel", "Dedicated Transfer", "Chauffeured"],
    optionsAr: ["طائرة خاصة", "فندق خمس نجوم", "نقل مخصص", "سائق خاص"],
    hasCity: true, hasDate: true, hasGuests: true,
  },
  {
    id: "yacht",
    title: "Private Yacht Charter",
    titleAr: "تأجير اليخوت الخاصة",
    img: publicPath("/images/vip-yacht.jpg"),
    blurb: "Crewed yachts for private cruises and occasions.",
    blurbAr: "يخوت بطاقم كامل لرحلات ومناسبات خاصة.",
    desc: "Charter a fully crewed yacht for private cruises and celebrations. Choose your destination, duration and the level of service on board.",
    descAr: "استأجر يختاً كاملاً بطاقمه لرحلات ومناسبات خاصة. اختر وجهتك ومدّتك ومستوى الخدمة على المتن.",
    options: ["Crewed Yacht", "Captain Included", "Events at Sea", "Full Service"],
    optionsAr: ["يخت بطاقم", "مع قائد", "مناسبات في البحر", "خدمة كاملة"],
    hasCity: true, hasDate: true, hasGuests: true,
  },
  {
    id: "car",
    title: "Luxury Cars",
    titleAr: "السيارات الفاخرة",
    img: publicPath("/images/vip-car.jpg"),
    blurb: "Exotic and sports cars, with chauffeur when needed.",
    blurbAr: "سيارات فاخرة ورياضية، مع سائق عند الحاجة.",
    desc: "Access to a fleet of luxury and performance vehicles, delivered where you need them, with a professional chauffeur on request.",
    descAr: "وصول إلى أسطول من السيارات الفاخرة والرياضية، تُسلَّم حيث تحتاجها، مع سائق محترف عند الطلب.",
    options: ["Sports Car", "Executive Sedan", "Chauffeured", "Event Delivery"],
    optionsAr: ["سيارة رياضية", "سيدان تنفيذية", "مع سائق", "توصيل للمناسبات"],
    hasCity: true, hasDate: true,
  },
  {
    id: "event",
    title: "Private Events",
    titleAr: "المناسبات الخاصة",
    img: publicPath("/images/vip-event.jpg"),
    blurb: "VIP access to exclusive events and limited-seat experiences.",
    blurbAr: "وصول VIP لفعاليات حصرية وتجارب محدودة المقاعد.",
    desc: "Reserved access to private events, galas and limited-seat experiences across selected cities, arranged discreetly on your behalf.",
    descAr: "حجز مسبق لفعاليات خاصة وأمسيات وتجارب محدودة المقاعد في مدن مختارة، بترتيب خاص.",
    options: ["Private Gala", "VIP Seating", "Backstage", "Limited Seats"],
    optionsAr: ["أمسية خاصة", "مقاعد VIP", "خلف الكواليس", "مقاعد محدودة"],
    hasCity: true, hasDate: true, hasGuests: true,
  },
  {
    id: "concierge",
    title: "Concierge Access",
    titleAr: "الدخول إلى كبار الشخصيات",
    img: publicPath("/images/vip-concierge.jpg"),
    blurb: "A personal assistant for every request and booking.",
    blurbAr: "مساعد شخصي لترتيب كل طلب وحجز.",
    desc: "A dedicated personal assistant manages your requests, reservations and special arrangements with priority handling throughout.",
    descAr: "مساعد شخصي مخصص يدير طلباتك وحجوزاتك وترتيباتك الخاصة مع أولوية في المعاملة.",
    options: ["Personal Assistant", "Priority Handling", "24h Access", "Discreet Service"],
    optionsAr: ["مساعد شخصي", "معاملة ذات أولوية", "متاح ٢٤ ساعة", "خدمة سرّية"],
    hasCity: true, hasDate: true,
  },
  {
    id: "shopping",
    title: "Private Shopping",
    titleAr: "التسوق الخاص",
    img: publicPath("/images/vip-shopping.jpg"),
    blurb: "Private access to luxury stores and appointments.",
    blurbAr: "وصول خاص لمتاجر فاخرة ومواعيد حصرية.",
    desc: "Arrange private shopping sessions at luxury houses, with dedicated appointments and a personal stylist when available.",
    descAr: "ننظّم جلسات تسوق خاصة لدى دور الأزياء الفاخرة، بمواعيد حصرية ومساعد شخصي عند توفّره.",
    options: ["Private Appointment", "Personal Stylist", "After-Hours", "Curated Selection"],
    optionsAr: ["موعد خاص", "منسّق أزياء", "خارج ساعات العمل", "اختيار منسّق"],
    hasCity: true, hasDate: true,
  },
];

export default function VipSection() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [open, setOpen] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const t = (en: string, arab?: string) => (ar ? (arab ?? en) : en);

  useEffect(() => { setSent(false); }, [open]);

  const svc = SERVICES.find((s) => s.id === open);

  return (
    <div className="mx-auto max-w-6xl px-1" dir={ar ? "rtl" : "ltr"}>
      <AnimatePresence mode="wait">
        {!svc ? (
          <motion.div key="vip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            {/* ═══ HERO ═══ */}
            <header className="border-b border-white/[0.08] py-10">
              <div className="text-[0.55rem] uppercase tracking-[0.4em] text-[#5d6675]" style={{ fontFamily: MONO }}>VIP / Elite Access</div>
              <h1 className="mt-3 text-[clamp(2.2rem,5vw,4rem)] font-semibold uppercase tracking-[0.12em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
                كبار الشخصيات
              </h1>
              <p className="mt-4 max-w-2xl text-[0.9rem] leading-relaxed text-[#8b95a5]">
                {t(
                  "Private services reserved for club members, designed to provide access to experiences and services that are difficult to obtain through conventional channels.",
                  "خدمات خاصة متاحة لأعضاء النادي، مصمّمة لتوفير الوصول إلى تجارب وخدمات يصعب الوصول إليها بشكل تقليدي."
                )}
              </p>
            </header>

            {/* ═══ PRIMARY SERVICES (2×3) ═══ */}
            <section className="mt-10">
              <SectionLabel n="01" label={t("Signature Services", "الخدمات المميزة")} />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[SERVICES[0], SERVICES[1], SERVICES[2], SERVICES[3], SERVICES[4], SERVICES[5]].map((s) => (
                  <ServiceCard key={s.id} s={s} ar={ar} onOpen={() => { setOpen(s.id); play("open"); }} />
                ))}
              </div>
            </section>

            {/* ═══ WIDE FEATURE ═══ */}
            <section className="mt-14">
              <SectionLabel n="02" label={t("Concierge", "كونسيرج")} />
              <WideCard s={SERVICES[6]} ar={ar} onOpen={() => { setOpen(SERVICES[6].id); play("open"); }} />
            </section>

            {/* ═══ ADDITIONAL ═══ */}
            <section className="mt-14">
              <SectionLabel n="03" label={t("Additional Services", "خدمات إضافية")} />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[SERVICES[7]].map((s) => (
                  <ServiceCard key={s.id} s={s} ar={ar} onOpen={() => { setOpen(s.id); play("open"); }} />
                ))}
              </div>
            </section>

            {/* ═══ PRIVATE CONCIERGE ═══ */}
            <section className="mt-16 border-t border-white/[0.08] pt-10">
              <div className="mb-2 text-[0.55rem] uppercase tracking-[0.3em] text-[#5d6675]" style={{ fontFamily: MONO }}>Private Concierge</div>
              <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
                {t("A Request Beyond the List", "طلب لا تجده في القائمة")}
              </h2>
              <p className="mt-3 max-w-2xl text-[0.85rem] leading-relaxed text-[#8b95a5]">
                {t(
                  "For private requests not covered by the services above, members can send a direct request to the VIP team.",
                  "للطلبات الخاصة التي لا تجدها ضمن الخدمات، يمكن للعضو إرسال طلب مباشر إلى فريق كبار الشخصيات."
                )}
              </p>
              <button onClick={() => { setOpen("special"); play("open"); }}
                className="mt-6 inline-flex items-center gap-3 border border-white/[0.12] px-6 py-3 text-[0.7rem] uppercase tracking-[0.25em] text-[#eef2f7] transition hover:border-[#7fb0ff]/50 hover:text-white"
                style={{ fontFamily: MONO }}>
                {t("Send Private Request", "إرسال طلب خاص")}
              </button>
            </section>
          </motion.div>
        ) : (
          /* ═══ SERVICE DETAIL / FORM ═══ */
          <motion.div key="detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <button onClick={() => { setOpen(null); play("click"); }}
              className="mb-6 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-[#7fb0ff] hover:text-sky-200" style={{ fontFamily: MONO }}>
              <ArrowLeft size={13} /> {t("Back", "رجوع")}
            </button>
            <Detail s={svc} ar={ar} sent={sent} onSent={() => setSent(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionLabel({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="text-[0.55rem] tracking-[0.3em] text-[#7fb0ff]" style={{ fontFamily: MONO }}>{n}</span>
      <span className="text-[0.7rem] uppercase tracking-[0.25em] text-[#8b95a5]" style={{ fontFamily: MONO }}>{label}</span>
    </div>
  );
}

function ServiceCard({ s, ar, onOpen }: { s: Service; ar: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group flex flex-col overflow-hidden border border-white/[0.08] bg-[#07080a] text-left transition-all duration-300 hover:border-[#7fb0ff]/40">
      {/* image */}
      <div className="h-52 w-full overflow-hidden">
        <img src={s.img} alt={ar ? s.titleAr : s.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
      </div>
      {/* body */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-[1.05rem] uppercase tracking-[0.1em] text-[#eef2f7]" style={{ fontFamily: LUX }}>{ar ? s.titleAr : s.title}</h3>
        <p className="mt-2 flex-1 text-[0.72rem] leading-relaxed text-[#7b8494]">{ar ? s.blurbAr : s.blurb}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.25em] text-[#7fb0ff]">
          {ar ? "اكتشف المزيد" : "Discover"} <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </button>
  );
}

function WideCard({ s, ar, onOpen }: { s: Service; ar: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group grid grid-cols-1 overflow-hidden border border-white/[0.08] bg-[#07080a] text-left transition-all duration-300 hover:border-[#7fb0ff]/40 sm:grid-cols-2">
      <div className="h-64 w-full overflow-hidden sm:h-auto">
        <img src={s.img} alt={ar ? s.titleAr : s.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
      </div>
      <div className="flex flex-col justify-center px-6 py-8">
        <h3 className="text-[1.4rem] uppercase tracking-[0.1em] text-[#eef2f7]" style={{ fontFamily: LUX }}>{ar ? s.titleAr : s.title}</h3>
        <p className="mt-3 max-w-md text-[0.8rem] leading-relaxed text-[#7b8494]">{ar ? s.descAr : s.desc}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.25em] text-[#7fb0ff]">
          {ar ? "اكتشف المزيد" : "Discover"} <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </button>
  );
}

function Detail({ s, ar, sent, onSent }: { s: Service; ar: boolean; sent: boolean; onSent: () => void }) {
  const isSpecial = s.id === "special";
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [opt, setOpt] = useState<string>("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const [details, setDetails] = useState("");

  const t = (en: string, arab?: string) => (ar ? (arab ?? en) : en);

  if (sent) {
    return (
      <div className="flex flex-col items-center border border-white/[0.08] bg-[#07080a] px-6 py-16 text-center">
        <div className="text-[0.9rem] uppercase tracking-[0.3em] text-[#eef2f7]" style={{ fontFamily: MONO }}>
          {t("Request Received", "تم استلام الطلب")}
        </div>
        <p className="mt-3 max-w-md text-[0.75rem] leading-relaxed text-[#7b8494]">
          {t("Your request has been passed to the VIP team and will be handled with priority. A representative will be in touch.", "تم تمرير طلبك إلى فريق كبار الشخصيات وسيتم التعامل معه بأولوية. سيتواصل معك أحد الممثلين.")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      {/* image + info */}
      <div>
        <div className="h-64 w-full overflow-hidden">
          <img src={s.img} alt={ar ? s.titleAr : s.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
        <h1 className="mt-5 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold uppercase tracking-[0.1em] text-[#f2f4f8]" style={{ fontFamily: LUX }}>
          {ar ? s.titleAr : s.title}
        </h1>
        <p className="mt-3 text-[0.82rem] leading-relaxed text-[#8b95a5]">{ar ? s.descAr : s.desc}</p>
        {s.options.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {s.options.map((o, i) => (
              <span key={o} className="border border-white/[0.08] px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-[#8b95a5]" style={{ fontFamily: MONO }}>
                {ar ? s.optionsAr[i] : o}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* request form */}
      <div className="border border-white/[0.08] bg-[#07080a] p-6">
        <div className="mb-5 text-[0.6rem] uppercase tracking-[0.25em] text-[#7fb0ff]" style={{ fontFamily: MONO }}>
          {t("Request Access", "طلب الوصول")}
        </div>

        {isSpecial ? (
          <div className="space-y-4">
            <Field label={t("Request Type", "نوع الطلب")} val={type} set={setType} ph={t("e.g. Private charter", "مثال: استئجار خاص")} />
            <Field label={t("City", "المدينة")} val={city} set={setCity} />
            <Field label={t("Date", "التاريخ")} val={date} set={setDate} type="date" />
            <Field label={t("Approximate Budget", "الميزانية التقريبية")} val={budget} set={setBudget} />
            <Field label={t("Details", "التفاصيل")} val={details} set={setDetails} area />
          </div>
        ) : (
          <div className="space-y-4">
            {s.hasCity && <Field label={t("City / Destination", "المدينة / الوجهة")} val={city} set={setCity} />}
            {s.hasDate && <Field label={t("Date", "التاريخ")} val={date} set={setDate} type="date" />}
            {s.hasGuests && <Field label={t("Number of People", "عدد الأشخاص")} val={guests} set={setGuests} type="number" />}
            <div>
              <label className="mb-1 block text-[0.55rem] uppercase tracking-[0.2em] text-[#6d7685]" style={{ fontFamily: MONO }}>{t("Preferred Option", "الخيار المفضل")}</label>
              <div className="flex flex-wrap gap-2">
                {s.options.map((o, i) => (
                  <button key={o} onClick={() => setOpt(o)}
                    className={`border px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.1em] transition ${opt === o ? "border-[#7fb0ff]/70 text-white" : "border-white/[0.1] text-[#8b95a5]"}`}
                    style={{ fontFamily: MONO }}>
                    {ar ? s.optionsAr[i] : o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button onClick={() => { onSent(); play("granted"); }}
          className="mt-6 w-full border border-[#7fb0ff]/50 px-5 py-3 text-[0.68rem] uppercase tracking-[0.25em] text-[#eef2f7] transition hover:bg-[#7fb0ff]/10"
          style={{ fontFamily: MONO }}>
          {isSpecial ? t("Send Request", "إرسال الطلب") : t("Submit Access Request", "إرسال طلب الوصول")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, val, set, ph, type, area }: { label: string; val: string; set: (v: string) => void; ph?: string; type?: string; area?: boolean }) {
  const base = "w-full border border-white/[0.1] bg-[#0a0c10] px-3 py-2.5 text-[0.72rem] text-[#eef2f7] outline-none transition focus:border-[#7fb0ff]/60";
  return (
    <div>
      <label className="mb-1 block text-[0.55rem] uppercase tracking-[0.2em] text-[#6d7685]" style={{ fontFamily: MONO }}>{label}</label>
      {area ? (
        <textarea value={val} onChange={(e) => set(e.target.value)} placeholder={ph} rows={4} className={`${base} resize-none`} style={{ fontFamily: MONO }} />
      ) : (
        <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph} type={type || "text"} className={base} style={{ fontFamily: MONO }} />
      )}
    </div>
  );
}
