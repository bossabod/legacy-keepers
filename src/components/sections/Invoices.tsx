"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { play } from "@/lib/sound";
import { formatMoney } from "@/lib/format";
import type { AppData } from "@/lib/types";
import {
  INVOICE_YEARS, OPEN_YEAR, ACCESSIBLE_MONTHS, invoicesForMonth,
  verificationHash, ROUTING, DIVISIONS, APPROVERS, PAY_METHODS,
  type InvoiceEntry, type SecLevel,
} from "@/components/invoices/invoice-data";

const MONO = "var(--font-ibm-mono)";
const LUX = "var(--font-luxury)";

const MONTHS_ORDER = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس"];

export default function InvoicesSection({
  data: _data,
  onNavigate,
}: {
  data: AppData;
  onNavigate?: (section: string) => void;
}) {
  const { lang, currency } = useApp();
  const ar = lang === "ar";

  const [year, setYear] = useState<number | null>(OPEN_YEAR);
  const [month, setMonth] = useState<string | null>(null);
  const [lockedYear, setLockedYear] = useState<number | null>(null);
  const [passwordFor, setPasswordFor] = useState<InvoiceEntry | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passError, setPassError] = useState(false);
  const [openInvoice, setOpenInvoice] = useState<InvoiceEntry | null>(null);

  const MONTH_LABELS = ar ? MONTHS_AR : MONTHS_ORDER.map((m) => m.toLowerCase());
  const invCounts = useMemo(
    () => Object.fromEntries(MONTHS_ORDER.map((m) => [m, invoicesForMonth(m).length])),
    []
  );

  const t = (en: string, arStr: string) => (ar ? arStr : en);

  const chooseYear = (y: number) => {
    if (y === OPEN_YEAR) {
      setYear(y);
      setLockedYear(null);
      play("open");
    } else {
      setLockedYear(y);
      play("reject");
    }
  };

  const openEntry = (inv: InvoiceEntry) => {
    if (inv.restriction.password) {
      setPasswordFor(inv);
      setPasswordInput("");
      setPassError(false);
      play("vault");
      return;
    }
    if (inv.restriction.rankGated) {
      // rank-gated: treat as requiring elevation (simulated)
      setPasswordFor(inv);
      play("reject");
      return;
    }
    setOpenInvoice(inv);
    play("open");
  };

  const submitPassword = () => {
    if (passwordFor && passwordInput.trim() === passwordFor.password) {
      const inv = passwordFor;
      setPasswordFor(null);
      setOpenInvoice(inv);
      play("granted");
    } else {
      setPassError(true);
      play("reject");
    }
  };

  const list = month ? invoicesForMonth(month) : [];

  /* ---------------- render ---------------- */
  return (
    <div className="w-full" dir={ar ? "rtl" : "ltr"}>
      <style>{styles}</style>

      {openInvoice ? (
        <InvoiceDetail inv={openInvoice} currency={currency} ar={ar} onBack={() => { setOpenInvoice(null); play("select"); }} />
      ) : passwordFor ? (
        <PasswordGate
          inv={passwordFor}
          ar={ar}
          value={passwordInput}
          error={passError}
          onChange={setPasswordInput}
          onCancel={() => setPasswordFor(null)}
          onSubmit={submitPassword}
        />
      ) : lockedYear ? (
        <LockedYear year={lockedYear} ar={ar} onGoArchive={() => onNavigate?.("archive")} onBack={() => setLockedYear(null)} />
      ) : (
        <div className="inv-archive">
          {/* ════ LEFT SIDEBAR — ARCHIVE YEARS ════ */}
          <aside className="inv-sidebar">
            <div className="inv-sidebar-head">
              <span className="inv-eyebrow">{t("FINANCIAL ARCHIVE", "الأرشيف المالي")}</span>
              <span className="inv-seal">OOI</span>
            </div>
            <nav className="inv-years">
              {INVOICE_YEARS.map((y) => {
                const open = y === OPEN_YEAR;
                const active = year === y;
                return (
                  <button
                    key={y}
                    onClick={() => chooseYear(y)}
                    className={`inv-year ${open ? "is-open" : "is-locked"} ${active ? "is-active" : ""}`}
                  >
                    <span className="inv-year-num">{y}</span>
                    <span className="inv-year-lock">{open ? "·" : "🔒"}</span>
                    <span className="inv-year-state">{open ? "OPEN" : "SEALED"}</span>
                  </button>
                );
              })}
            </nav>
            <div className="inv-sidebar-foot">
              <div>{t("RECORDS", "السجلات")} · {INVOICE_YEARS.length}</div>
              <div>SIG 0x77A1·D0</div>
            </div>
          </aside>

          {/* ════ MONTHS ════ */}
          <div className="inv-mid">
            <div className="inv-mid-head">
              <span className="inv-eyebrow">{year}</span>
              <span className="inv-mid-head-sub">{t("FISCAL YEAR · OPEN", "سنة مالية · مفتوحة")}</span>
            </div>
            <div className="inv-months">
              {MONTHS_ORDER.map((m, i) => (
                <button
                  key={m}
                  onClick={() => { setMonth(m); play("open"); }}
                  className={`inv-month ${month === m ? "is-active" : ""}`}
                >
                  <span className="inv-month-no">{String(i + 1).padStart(2, "0")}</span>
                  <span className="inv-month-name">{MONTH_LABELS[i]}</span>
                  <span className="inv-month-count">{invCounts[m]}</span>
                </button>
              ))}
            </div>
            {!month && (
              <div className="inv-mid-empty">
                <p className="inv-mid-empty-line">{t("Select a month to open its ledger.", "اختر شهراً لفتح دفتره.")}</p>
                <p className="inv-mid-empty-sub">{t("ACCESSIBLE · 2026", "متاح · ٢٠٢٦")}</p>
              </div>
            )}
          </div>

          {/* ════ INVOICE LIST ════ */}
          <div className="inv-list-wrap">
            <div className="inv-list-head">
              <span className="inv-eyebrow">{month ? MONTH_LABELS[MONTHS_ORDER.indexOf(month)] : "—"}</span>
              <span className="inv-list-count">{list.length} {t("ENTRIES", "سجل")}</span>
            </div>
            <div className="inv-list">
              <AnimatePresence mode="wait">
                {month && (
                  <motion.div key={month} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {list.map((inv, i) => (
                      <motion.button
                        key={inv.id}
                        onClick={() => openEntry(inv)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.035, ease: [0.22, 1, 0.36, 1] }}
                        className="inv-row"
                        onMouseEnter={() => play("hover")}
                      >
                        <div className="inv-row-main">
                          <span className="inv-row-id">{inv.id}</span>
                          <span className="inv-row-title">{inv.title}</span>
                        </div>
                        <div className="inv-row-side">
                          <span className="inv-row-date">{inv.date}</span>
                          <span className={`inv-row-status is-${inv.status.toLowerCase()}`}>
                            {t(inv.status, inv.status === "COMPLETED" ? "مكتمل" : inv.status === "PENDING" ? "معلّق" : "مقيد")}
                          </span>
                          <span className="inv-row-amount">
                            {inv.amountChf === null ? "••••••" : formatMoney(inv.amountChf, currency)}
                          </span>
                          <span className={`inv-row-level is-${inv.level.toLowerCase()}`}>{inv.level}</span>
                          <span className="inv-row-arrow">→</span>
                        </div>
                        {inv.restriction.password && <span className="inv-row-sec">PASSWORD REQUIRED</span>}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Locked Year ─────────────────────── */
function LockedYear({ year, ar, onGoArchive, onBack }: { year: number; ar: boolean; onGoArchive: () => void; onBack: () => void }) {
  return (
    <motion.div
      className="inv-locked"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <button className="inv-locked-back" onClick={onBack}>{ar ? "رجوع" : "BACK"}</button>
      <span className="inv-locked-seal">{year}</span>
      <h3 className="inv-locked-title">{ar ? "سجلات مالية مؤرشفة" : "ARCHIVED FINANCIAL RECORDS"}</h3>
      <p className="inv-locked-body">
        {ar ? "نُقلت هذه السنة المالية إلى الأرشيف الآمن." : "This financial year has been transferred to the secure archive."}
      </p>
      <button className="inv-locked-cta" onClick={onGoArchive}>
        {ar ? "الذهاب إلى الأرشيف ←" : "GO TO ARCHIVE →"}
      </button>
      <span className="inv-locked-class">CLS-A · SEALED · {year}</span>
    </motion.div>
  );
}

/* ─────────────────────── Password Gate ─────────────────────── */
function PasswordGate({ inv, ar, value, error, onChange, onCancel, onSubmit }: {
  inv: InvoiceEntry; ar: boolean; value: string; error: boolean;
  onChange: (v: string) => void; onCancel: () => void; onSubmit: () => void;
}) {
  return (
    <motion.div
      className="inv-password"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="inv-password-box">
        <span className="inv-password-label">{ar ? "ملف محمي بكلمة مرور" : "PASSWORD PROTECTED FILE"}</span>
        <h3 className="inv-password-title">{inv.id} · {inv.title}</h3>
        <p className="inv-password-hint">{ar ? "أدخل كلمة المرور للوصول إلى هذا السجل المالي." : "Enter the password to access this financial record."}</p>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          className={`inv-password-input ${error ? "is-error" : ""}`}
          placeholder={ar ? "كلمة المرور" : "••••••"}
        />
        {error && <p className="inv-password-error">{ar ? "كلمة مرور غير صحيحة" : "Incorrect password."}</p>}
        <div className="inv-password-actions">
          <button className="inv-password-btn is-ghost" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</button>
          <button className="inv-password-btn" onClick={onSubmit}>{ar ? "فتح" : "Unlock"}</button>
        </div>
        <span className="inv-password-meta">{inv.level} · SHA {verificationHash(inv.id)}</span>
      </div>
    </motion.div>
  );
}

function Row({ label, value, hidden }: { label: string; value: string; hidden?: boolean }) {
  return (
    <div className="inv-det-row">
      <span className="inv-det-label">{label}</span>
      <span className={`inv-det-value ${hidden ? "is-hidden" : ""}`}>{hidden ? "••••••" : value}</span>
    </div>
  );
}

/* ─────────────────────── Invoice Detail ─────────────────────── */
function InvoiceDetail({ inv, currency, ar, onBack }: {
  inv: InvoiceEntry; currency: "CHF" | "USD" | "BTC"; ar: boolean; onBack: () => void;
}) {
  const hash = verificationHash(inv.id);
  const route = ROUTING[Math.abs(hash.charCodeAt(2) % ROUTING.length) % ROUTING.length];
  const div = DIVISIONS[Math.abs(hash.charCodeAt(4) % DIVISIONS.length) % DIVISIONS.length];
  const approver = APPROVERS[Math.abs(hash.charCodeAt(6) % APPROVERS.length) % APPROVERS.length];
  const method = PAY_METHODS[Math.abs(hash.charCodeAt(3) % PAY_METHODS.length) % PAY_METHODS.length];
  const [monthIdx, invIdx] = [Number(inv.id.slice(6, 8)) - 1, Number(inv.id.slice(8))];
  const approvalNo = `AP-2026-${String(invIdx).padStart(3, "0")}`;

  const hideSupplier = inv.supplier === null;

  return (
    <motion.div
      className="inv-detail"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <button className="inv-det-back" onClick={onBack}>← {ar ? "رجوع إلى الأرشيف" : "Back to Archive"}</button>

      {/* Header */}
      <div className="inv-det-header">
        <div>
          <span className={`inv-det-class is-${inv.level.toLowerCase()}`}>{inv.level}</span>
          <h2 className="inv-det-id">{inv.id}</h2>
          <p className="inv-det-title">{inv.title}</p>
        </div>
        <div className="inv-det-stamp">
          <span className="inv-det-stamp-ring">OOI</span>
          <span className="inv-det-stamp-verified">{ar ? "موثّق رقمياً" : "DIGITALLY VERIFIED"}</span>
        </div>
      </div>

      <div className="inv-det-rule" />

      {/* Main columns */}
      <div className="inv-det-grid">
        <div className="inv-det-col">
          <span className="inv-det-colhead">{ar ? "التفاصيل" : "DETAILS"}</span>
          <Row label="PROJECT REFERENCE" value={`PRJ-${inv.id.replace("INV-", "")}`} />
          <Row label="DEPARTMENT" value={div} />
          <Row label="ISSUE DATE" value={inv.date} />
          <Row label="APPROVAL DATE" value={inv.date} hidden={inv.status === "PENDING"} />
          <Row label="PAYMENT STATUS" value={ar ? (inv.status === "COMPLETED" ? "مكتمل" : inv.status === "PENDING" ? "معلّق" : "مقيد") : inv.status} />
          <Row label="SUPPLIER" value={hideSupplier ? "" : (inv.supplier ?? "")} hidden={hideSupplier} />
        </div>
        <div className="inv-det-col">
          <span className="inv-det-colhead">{ar ? "التصنيف" : "CLASSIFICATION"}</span>
          <Row label="CLASSIFICATION LEVEL" value={inv.level} />
          <Row label="INTERNAL REFERENCE" value={route} />
          <Row label="RESPONSIBLE DIVISION" value={div} />
          <Row label="AUTHORIZED BY" value={approver} />
          <Row label="ROUTING ID" value={route} />
          <Row label="DOC REVISION" value="R2" />
        </div>
      </div>

      <div className="inv-det-rule" />

      {/* Amount block */}
      <div className="inv-det-amount">
        <div>
          <span className="inv-det-label">{ar ? "المبلغ" : "AMOUNT"}</span>
          <div className="inv-det-amount-value">{inv.amountChf === null ? "••••••" : formatMoney(inv.amountChf, currency)}</div>
        </div>
        <div>
          <span className="inv-det-label">CURRENCY</span>
          <div className="inv-det-amount-sub">CHF</div>
        </div>
        <div>
          <span className="inv-det-label">{ar ? "طريقة الدفع" : "PAYMENT METHOD"}</span>
          <div className="inv-det-amount-sub">{method}</div>
        </div>
      </div>

      <div className="inv-det-rule" />

      {/* Attachments + history */}
      <div className="inv-det-grid">
        <div className="inv-det-col">
          <span className="inv-det-colhead">{ar ? "المرفقات" : "ATTACHMENTS"}</span>
          {inv.restriction.hideAttachments ? (
            <p className="inv-det-hidden-note">{ar ? "المرفقات محجوبة" : "Attachments are withheld"}</p>
          ) : (
            <>
              <div className="inv-det-file">{inv.id}-REC.pdf</div>
              <div className="inv-det-file">{inv.id}-AUTH.pdf</div>
              <div className="inv-det-file">{inv.id}-VER.dat</div>
            </>
          )}
        </div>
        <div className="inv-det-col">
          <span className="inv-det-colhead">{ar ? "سجل الاعتماد" : "APPROVAL HISTORY"}</span>
          <div className="inv-det-timeline">
            <div className="inv-det-tl-row"><span className="inv-det-tl-dot" /><div><b>AP-2026-001</b><span>Initiated</span></div></div>
            <div className="inv-det-tl-row"><span className="inv-det-tl-dot" /><div><b>{approvalNo}</b><span>Approved · {approver}</span></div></div>
            <div className="inv-det-tl-row"><span className="inv-det-tl-dot" /><div><b>FIN-GVA</b><span>Settled</span></div></div>
          </div>
        </div>
      </div>

      <div className="inv-det-rule" />

      {/* Footer metadata */}
      <div className="inv-det-foot">
        <span>REF {route} · REV R2</span>
        <span>VERIFY {hash}</span>
        <span>{inv.month} {inv.dateISO}</span>
        <span>ACCESS · {inv.level}</span>
      </div>
      <div className="inv-det-note">
        {ar
          ? "هذا المستند سجل مالي داخلي سري. يُمنع التداول به خارج نطاق الصلاحية المصرّح به."
          : "This is a confidential internal financial record. Circulation is restricted to authorized clearance only."}
      </div>
    </motion.div>
  );
}

const styles = `
  .inv-archive { display:grid; grid-template-columns:190px minmax(150px,210px) 1fr; gap:clamp(16px,2.5vw,40px); min-height:calc(100svh - 150px); }
  @media (max-width:900px){ .inv-archive{grid-template-columns:1fr;} .inv-sidebar,.inv-mid{order:0} .inv-list-wrap{order:2} }

  .inv-eyebrow { font-family:${MONO}; font-size:.52rem; letter-spacing:.26em; color:#7b8494; }
  .inv-seal { font-family:${MONO}; font-size:.55rem; letter-spacing:.2em; color:#4a515e; border:1px solid rgba(255,255,255,.12); padding:4px 8px; }

  /* sidebar */
  .inv-sidebar { border-inline-end:1px solid rgba(255,255,255,.06); padding-inline-end:18px; display:flex; flex-direction:column; }
  .inv-sidebar-head { display:flex; align-items:center; justify-content:space-between; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,.06); }
  .inv-years { margin-top:14px; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }
  .inv-year { display:flex; align-items:center; gap:10px; padding:7px 8px; background:none; border:0; cursor:pointer; transition:background .3s, color .3s; }
  .inv-year-num { font-family:${MONO}; font-size:.74rem; color:#c3c9d3; letter-spacing:.06em; }
  .inv-year.is-locked .inv-year-num { color:#4a515e; }
  .inv-year.is-locked .inv-year-state { color:#3f4752; }
  .inv-year.is-active { background:rgba(255,255,255,.04); }
  .inv-year-lock { font-size:.6rem; opacity:.7; }
  .inv-year-state { margin-inline-start:auto; font-family:${MONO}; font-size:.42rem; letter-spacing:.18em; color:#5d6675; }
  .inv-sidebar-foot { margin-top:auto; padding-top:14px; border-top:1px solid rgba(255,255,255,.05); font-family:${MONO}; font-size:.42rem; letter-spacing:.1em; color:#3f4752; display:flex; justify-content:space-between; }

  /* months */
  .inv-mid { display:flex; flex-direction:column; }
  .inv-mid-head { display:flex; align-items:baseline; justify-content:space-between; padding-bottom:14px; border-bottom:1px solid rgba(255,255,255,.06); }
  .inv-mid-head-sub { font-family:${MONO}; font-size:.44rem; letter-spacing:.14em; color:#4a515e; }
  .inv-months { display:flex; flex-direction:column; gap:2px; margin-top:12px; }
  .inv-month { display:flex; align-items:center; gap:10px; padding:8px; background:none; border:0; cursor:pointer; color:#5d6675; transition:color .3s, background .3s; }
  .inv-month-no { font-family:${MONO}; font-size:.5rem; color:#4a515e; }
  .inv-month-name { font-family:${LUX}; font-size:.82rem; letter-spacing:.06em; text-transform:capitalize; }
  .inv-month-count { margin-inline-start:auto; font-family:${MONO}; font-size:.46rem; color:#4a515e; }
  .inv-month.is-active { color:#eef2f7; background:rgba(255,255,255,.04); }
  .inv-month.is-active .inv-month-no { color:#9aa5b3; }
  .inv-mid-empty { margin-top:40px; }
  .inv-mid-empty-line { font-family:${MONO}; font-size:.6rem; letter-spacing:.1em; color:#5d6675; }
  .inv-mid-empty-sub { margin-top:8px; font-family:${MONO}; font-size:.46rem; letter-spacing:.2em; color:#3f4752; }

  /* list */
  .inv-list-wrap { display:flex; flex-direction:column; min-width:0; }
  .inv-list-head { display:flex; align-items:center; justify-content:space-between; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,.06); }
  .inv-list-count { font-family:${MONO}; font-size:.44rem; letter-spacing:.16em; color:#4a515e; }
  .inv-list { overflow-y:auto; max-height:calc(100svh - 220px); }
  .inv-row { position:relative; display:flex; align-items:center; justify-content:space-between; gap:14px; width:100%; text-align:start; padding:13px 12px; margin-bottom:6px; background:#07080a; border:1px solid rgba(255,255,255,.05); cursor:pointer; transition:border-color .35s, background .35s, transform .35s; }
  .inv-row:hover { border-color:rgba(255,255,255,.18); background:#0a0c10; transform:translateX(2px); }
  .is-rtl .inv-row:hover{ transform:translateX(-2px); }
  .inv-row-main { display:flex; flex-direction:column; gap:4px; min-width:0; }
  .inv-row-id { font-family:${MONO}; font-size:.52rem; letter-spacing:.14em; color:#9aa5b3; }
  .inv-row-title { font-family:${LUX}; font-size:.88rem; color:#e8edf5; }
  .inv-row-side { display:flex; align-items:center; gap:16px; flex-shrink:0; }
  .inv-row-date { font-family:${MONO}; font-size:.5rem; color:#5d6675; }
  .inv-row-status { font-family:${MONO}; font-size:.46rem; letter-spacing:.1em; }
  .inv-row-status.is-completed{color:#9aa5b3;} .inv-row-status.is-pending{color:#6d7685;} .inv-row-status.is-restricted{color:#4a515e;}
  .inv-row-amount { font-family:${MONO}; font-size:.7rem; color:#eef2f7; }
  .inv-row-level { font-family:${MONO}; font-size:.42rem; letter-spacing:.12em; padding:2px 6px; border:1px solid rgba(255,255,255,.1); color:#7b8494; }
  .inv-row-arrow { color:#4a515e; }
  .inv-row-sec { position:absolute; bottom:-1px; inset-inline-end:12px; font-family:${MONO}; font-size:.4rem; letter-spacing:.18em; color:#3f4752; }

  /* locked year */
  .inv-locked { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center; }
  .inv-locked-back { position:absolute; top:0; inset-inline-start:0; background:none; border:0; color:#5d6675; font-family:${MONO}; font-size:.5rem; letter-spacing:.14em; cursor:pointer; }
  .inv-locked-seal { font-family:${MONO}; font-size:3rem; letter-spacing:.1em; color:#0e1014; text-shadow:0 0 30px rgba(195,201,211,.15); border:1px solid rgba(255,255,255,.12); padding:18px 26px; }
  .inv-locked-title { margin:26px 0 0; font-family:${LUX}; font-size:clamp(1.2rem,2.4vw,1.7rem); letter-spacing:.12em; color:#e6ecf3; }
  .inv-locked-body { margin:14px 0 0; font-family:${MONO}; font-size:.6rem; letter-spacing:.06em; color:#7b8494; max-width:40ch; line-height:1.9; }
  .inv-locked-cta { margin-top:28px; background:none; border:1px solid rgba(255,255,255,.16); color:#e6ecf3; font-family:${MONO}; font-size:.6rem; letter-spacing:.2em; padding:13px 26px; cursor:pointer; transition:border-color .3s, background .3s; }
  .inv-locked-cta:hover{ background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.3); }
  .inv-locked-class { margin-top:20px; font-family:${MONO}; font-size:.44rem; letter-spacing:.22em; color:#3f4752; }

  /* password gate */
  .inv-password { position:relative; display:flex; align-items:center; justify-content:center; min-height:60vh; }
  .inv-password-box { width:min(400px,92vw); padding:34px 30px; background:#07080a; border:1px solid rgba(255,255,255,.08); box-shadow:0 30px 80px rgba(0,0,0,.6); text-align:center; }
  .inv-password-label { font-family:${MONO}; font-size:.5rem; letter-spacing:.26em; color:#5d6675; }
  .inv-password-title { margin:16px 0 0; font-family:${LUX}; font-size:1.05rem; color:#e8edf5; }
  .inv-password-hint { margin:10px 0 0; font-family:${MONO}; font-size:.54rem; line-height:1.8; color:#7b8494; }
  .inv-password-input { width:100%; margin-top:22px; background:transparent; border:1px solid rgba(255,255,255,.14); color:#eef2f7; font-family:${MONO}; font-size:.8rem; letter-spacing:.3em; padding:13px 16px; text-align:center; outline:none; }
  .inv-password-input:focus{ border-color:rgba(255,255,255,.3); }
  .inv-password-input.is-error{ border-color:rgba(154,106,106,.5); }
  .inv-password-error { margin:10px 0 0; font-family:${MONO}; font-size:.5rem; color:#9a6a6a; }
  .inv-password-actions { display:flex; gap:10px; margin-top:18px; }
  .inv-password-btn { flex:1; padding:12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); color:#e6ecf3; font-family:${MONO}; font-size:.58rem; letter-spacing:.16em; cursor:pointer; transition:background .3s; }
  .inv-password-btn:hover{ background:rgba(255,255,255,.1); }
  .inv-password-btn.is-ghost{ background:none; color:#7b8494; }
  .inv-password-meta { display:block; margin-top:20px; font-family:${MONO}; font-size:.42rem; letter-spacing:.12em; color:#3f4752; }

  /* detail */
  .inv-detail { max-width:860px; margin:0 auto; }
  .inv-det-back { background:none; border:0; color:#7b8494; font-family:${MONO}; font-size:.56rem; letter-spacing:.14em; cursor:pointer; padding:4px 0; transition:color .3s; }
  .inv-det-back:hover{ color:#eef2f7; }
  .inv-det-header { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; padding:22px 0 20px; }
  .inv-det-class { font-family:${MONO}; font-size:.44rem; letter-spacing:.2em; padding:3px 8px; border:1px solid rgba(255,255,255,.14); color:#9aa5b3; }
  .inv-det-id { margin:14px 0 0; font-family:${MONO}; font-size:1.5rem; letter-spacing:.06em; color:#eef2f7; }
  .inv-det-title { margin:6px 0 0; font-family:${LUX}; font-size:1.05rem; color:#aeb8c5; }
  .inv-det-stamp { text-align:center; }
  .inv-det-stamp-ring { display:block; width:58px; height:58px; border-radius:50%; border:1px solid rgba(255,255,255,.2); color:#9aa5b3; font-family:${MONO}; font-size:.55rem; display:flex; align-items:center; justify-content:center; letter-spacing:.1em; box-shadow:0 0 18px rgba(195,201,211,.12), inset 0 0 12px rgba(195,201,211,.06); }
  .inv-det-stamp-verified { display:block; margin-top:8px; font-family:${MONO}; font-size:.42rem; letter-spacing:.16em; color:#4a515e; }
  .inv-det-rule { height:1px; background:linear-gradient(90deg,rgba(255,255,255,.14),transparent); margin:4px 0 18px; }
  .inv-det-grid { display:grid; grid-template-columns:1fr 1fr; gap:40px; }
  @media (max-width:720px){ .inv-det-grid{grid-template-columns:1fr;gap:24px;} }
  .inv-det-colhead { display:block; font-family:${MONO}; font-size:.46rem; letter-spacing:.24em; color:#5d6675; margin-bottom:14px; }
  .inv-det-row { display:flex; align-items:baseline; justify-content:space-between; gap:16px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,.04); }
  .inv-det-label { font-family:${MONO}; font-size:.48rem; letter-spacing:.12em; color:#4a515e; }
  .inv-det-value { font-family:${MONO}; font-size:.6rem; color:#d6dee7; text-align:end; }
  .inv-det-value.is-hidden{ letter-spacing:.3em; color:#6d7685; }
  .inv-det-amount { display:flex; gap:60px; padding:8px 0 20px; }
  .inv-det-amount-value { font-family:${MONO}; font-size:1.6rem; letter-spacing:.04em; color:#eef2f7; margin-top:6px; }
  .inv-det-amount-sub { font-family:${MONO}; font-size:.78rem; color:#aeb8c5; margin-top:6px; }
  .inv-det-file { font-family:${MONO}; font-size:.56rem; color:#9aa5b3; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .inv-det-hidden-note { font-family:${MONO}; font-size:.54rem; color:#5d6675; font-style:italic; }
  .inv-det-timeline { display:flex; flex-direction:column; gap:14px; }
  .inv-det-tl-row { display:flex; gap:10px; }
  .inv-det-tl-dot { width:6px; height:6px; border-radius:50%; background:#9aa5b3; margin-top:4px; }
  .inv-det-tl-row b { display:block; font-family:${MONO}; font-size:.54rem; color:#d6dee7; font-weight:500; }
  .inv-det-tl-row span:not(.inv-det-tl-dot) { display:block; font-family:${MONO}; font-size:.46rem; color:#4a515e; margin-top:2px; }
  .inv-det-foot { display:flex; flex-wrap:wrap; gap:10px 26px; padding:16px 0; font-family:${MONO}; font-size:.44rem; letter-spacing:.1em; color:#4a515e; }
  .inv-det-note { margin-top:6px; padding:16px 18px; background:rgba(255,255,255,.015); border-inline-start:1px solid rgba(255,255,255,.14); font-family:${MONO}; font-size:.54rem; line-height:1.9; color:#6d7685; }
`;
