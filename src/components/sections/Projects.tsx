"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectsGate from "@/components/projects/ProjectsGate";
import PerformanceCard from "@/components/projects/PerformanceCard";
import type { AppData } from "@/lib/types";

/**
 * قسم المشاريع.
 *
 * يبدأ بواجهة دخول مستقلة، ثم ينتقل بتلاشٍ ناعم إلى لوحة المشروع.
 *
 * اللوحة مبنية على شبكة مرنة من ١٢ عموداً: بطاقة الأداء تشغل
 * أربعة أعمدة على الشاشات الكبيرة، وتبقى الأعمدة الباقية فارغة
 * جاهزة لبطاقات وإحصاءات تُضاف لاحقاً بجانبها وتحتها دون إعادة
 * بناء الهيكل.
 */
export default function ProjectsSection(_props: { data: AppData }) {
  const [entered, setEntered] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <ProjectsGate key="gate" onEnter={() => setEntered(true)} />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[60vh] w-full"
          dir="ltr"
        >
          {/* شبكة اللوحة — قابلة للتوسّع */}
          <div className="mx-auto grid max-w-7xl auto-rows-min grid-cols-1 gap-5 md:grid-cols-8 lg:grid-cols-12">
            {/* بطاقة الأداء — جانبية، لا تملأ الصفحة */}
            <div className="md:col-span-5 lg:col-span-4">
              <PerformanceCard />
            </div>

            {/* الأعمدة المتبقية محجوزة لبطاقات قادمة */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
