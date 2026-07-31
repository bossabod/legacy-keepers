export type Lang = "en" | "ar";

const translations: Record<string, { en: string; ar: string }> = {
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.network": { en: "Network", ar: "الشبكة" },
  "nav.projects": { en: "Projects", ar: "المشاريع" },
  "nav.messages": { en: "Messages", ar: "الرسائل" },
  "nav.archive": { en: "Archive", ar: "الأرشيف" },
  "nav.features": { en: "Features", ar: "الخدمات" },
  "nav.investments": { en: "Investments", ar: "الاستثمارات" },
  "nav.members": { en: "Members", ar: "الأعضاء" },
  "nav.payments": { en: "Payments", ar: "المدفوعات" },
  "nav.activity": { en: "Activity", ar: "النشاط" },
  "nav.reports": { en: "Reports", ar: "التقارير" },
  "nav.ladder": { en: "Rank Ladder", ar: "سلم الأثر" },
  "nav.identity": { en: "People of Impact", ar: "أصحاب الأثر" },
  "nav.organizations": { en: "Organizations", ar: "المنظمات" },
  "nav.rules": { en: "Rules", ar: "القواعد" },
  "nav.goals": { en: "Objectives", ar: "الأهداف" },
  "nav.invoices": { en: "Invoices", ar: "الفواتير" },
  "nav.more": { en: "More", ar: "المزيد" },
  "nav.logout": { en: "Logout", ar: "تسجيل الخروج" },
  "cat.member": { en: "Member", ar: "عضو" },
  "cat.organization": { en: "Organization", ar: "منظمة" },
  "cat.company": { en: "Company", ar: "شركة" },
  "cat.investment": { en: "Investment", ar: "استثمار" },
  "cat.government": { en: "Government", ar: "حكومة" },
  "cat.asset": { en: "Strategic Asset", ar: "أصل استراتيجي" },
  "common.submit": { en: "Submit Request", ar: "إرسال الطلب" },
  "common.cancel": { en: "Cancel", ar: "إلغاء" },
  "common.close": { en: "Close", ar: "إغلاق" },
  "common.loading": { en: "Loading…", ar: "جارٍ التحميل…" },
};

export function t(key: string, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}
