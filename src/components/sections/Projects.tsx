"use client";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import RankGate from "@/components/projects/RankGate";
import MountainScene, { type TrackChoice } from "@/components/projects/MountainScene";
import ProjectList from "@/components/projects/ProjectList";
import RequestVenture from "@/components/projects/RequestVenture";
import type { AppData } from "@/lib/types";

/** رتبة المستخدم الحالي — أعلى رتبة في النادي */
const CURRENT_RANK = { ord: 9, nameAr: "أعمدة الخلق", nameEn: "Pillars of Creation" };

type Phase = "gate" | "peaks" | "list" | "request";

export default function ProjectsSection({ data }: { data: AppData }) {
  const { lang } = useApp();
  const isAr = lang === "ar";

  const [phase, setPhase] = useState<Phase>("gate");
  const [selected, setSelected] = useState<TrackChoice | null>(null);
  const [confirmed, setConfirmed] = useState<TrackChoice | null>(null);

  const handleEnter = () => {
    if (!selected) return;
    setConfirmed(selected);
    setPhase(selected === "request" ? "request" : "list");
  };

  const backToPeaks = () => {
    setPhase("peaks");
    setConfirmed(null);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <AnimatePresence mode="wait">
        {phase === "gate" && (
          <RankGate
            key="gate"
            rankName={isAr ? CURRENT_RANK.nameAr : CURRENT_RANK.nameEn}
            rankOrd={CURRENT_RANK.ord}
            isAr={isAr}
            onDone={() => setPhase("peaks")}
          />
        )}
      </AnimatePresence>

      {phase === "peaks" && (
        <MountainScene
          isAr={isAr}
          rankOrd={CURRENT_RANK.ord}
          selected={selected}
          onSelect={setSelected}
          onEnter={handleEnter}
        />
      )}

      {phase === "list" && confirmed && confirmed !== "request" && (
        <ProjectList
          track={confirmed as Exclude<TrackChoice, "request">}
          isAr={isAr}
          rankOrd={CURRENT_RANK.ord}
          onBack={backToPeaks}
        />
      )}

      {phase === "request" && (
        <RequestVenture isAr={isAr} onBack={backToPeaks} />
      )}
    </div>
  );
}
