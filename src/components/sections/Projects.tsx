"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProjectsGate from "@/components/projects/ProjectsGate";
import type { AppData } from "@/lib/types";

/**
 * قسم المشاريع.
 *
 * يبدأ بواجهة دخول مستقلة، ثم ينتقل بتلاشٍ ناعم إلى محتوى
 * القسم نفسه. المحتوى فارغ حالياً بانتظار التصميم الجديد.
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
        />
      )}
    </AnimatePresence>
  );
}
