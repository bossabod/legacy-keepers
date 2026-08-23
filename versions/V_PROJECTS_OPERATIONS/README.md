# Romantic Couple · The Legacy Keepers

> An elite closed circle since 2012. Entry is by covenant, not coincidence.

واجهة ويب فخمة ثنائية اللغة (عربي / إنجليزي) لنادٍ مغلق — لوحة تحكم تفاعلية مع كرة أرضية ثلاثية الأبعاد و17 قسم.

---

## التقنيات

| الطبقة | التقنية |
|---|---|
| الإطار | Next.js 16.2.6 (Turbopack) |
| الواجهة | React 19.2.6 + TypeScript 5.9 |
| التنسيق | Tailwind CSS v4 |
| الحركة | Framer Motion 12 |
| الخرائط | MapLibre GL 6 + Terra Draw |
| قاعدة البيانات | PostgreSQL + Drizzle ORM 0.45 |
| الخطوط | IBM Plex Sans Arabic · IBM Plex Mono · Cormorant Garamond · Tangerine |

---

## التشغيل محلياً

```bash
npm install
npm run dev
```

ثم افتح <http://localhost:3000>

### الأوامر المتاحة

```bash
npm run dev        # تشغيل بيئة التطوير
npm run build      # بناء نسخة الإنتاج
npm run start      # تشغيل نسخة الإنتاج
npm run lint       # فحص ESLint
npm run typecheck  # فحص أنواع TypeScript
```

---

## قاعدة البيانات (اختياري)

المشروع يعمل بدون قاعدة بيانات — يرجع تلقائياً إلى `src/lib/fallback-data.ts`.

لتفعيل PostgreSQL:

```bash
# 1. حدّث رابط الاتصال في drizzle.config.json
# 2. ادفع المخطط
npx drizzle-kit push

# 3. عبّئ البيانات الأولية
node scripts/seed.mjs
```

---

## هيكل المشروع

```
src/
├── app/
│   ├── page.tsx              # التدفق: welcome → login → loading → dashboard
│   ├── layout.tsx            # الخطوط + الميتاداتا
│   ├── globals.css           # أنماط Tailwind + التأثيرات
│   └── api/
│       ├── data/route.ts     # جلب البيانات
│       └── health/route.ts   # فحص الحالة
│
├── components/
│   ├── WelcomeScreen.tsx     # شاشة الترحيب
│   ├── LoginScreen.tsx       # شاشة الدخول
│   ├── LoadingScreen.tsx     # شاشة التحميل
│   ├── Dashboard.tsx         # الهيكل الرئيسي
│   ├── GlobalCommandGlobe.tsx# الكرة الأرضية التفاعلية
│   ├── brand.tsx             # الهوية البصرية
│   ├── design-system/        # Button · Badge · Panel · Input · Tooltip …
│   ├── search/               # البحث الشامل
│   └── sections/             # 17 قسم
│
├── lib/
│   ├── store.tsx             # إدارة الحالة
│   ├── i18n.ts               # الترجمة (عربي / إنجليزي)
│   ├── theme.ts              # نظام الألوان
│   ├── earth-data.ts         # بيانات جغرافية
│   ├── world-polygons.ts     # حدود الدول
│   ├── fallback-data.ts      # بيانات احتياطية
│   └── entities/             # الكيانات والتحليلات
│
├── db/
│   ├── schema.ts             # مخطط Drizzle
│   └── index.ts              # الاتصال
│
└── hooks/                    # useFps · useGeoCoordinates
```

---

## الأقسام السبعة عشر

الرئيسية · الشبكة · المشاريع · الرسائل · الأرشيف · الخدمات · الاستثمارات · الأعضاء · المدفوعات · النشاط · التقارير · سلم الأثر · أصحاب الأثر · القواعد · الأهداف · الفواتير · الخزنة

---

## ملاحظات

- **الشعار مفقود:** الكود يستدعي `/images/emblem-intro-aligned.png` — أضف مجلد `public/images/` وضع الشعار فيه، أو احذف سطر `<link rel="preload">` من `src/app/layout.tsx`.
- المشروع يعمل بالكامل بدون قاعدة بيانات بفضل البيانات الاحتياطية.

---

## الترخيص

خاص — جميع الحقوق محفوظة.
