"use client";

import DivisionView from "@/components/DivisionView";
import NextMatchPanel from "@/components/NextMatchPanel";
import AdvanceChip from "@/components/AdvanceChip";
import { CardSkeleton } from "@/components/Skeleton";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function ElitePage() {
  const { t } = useI18n();
  const { registrations, hydrated } = useStore();
  const n = registrations.filter((r) => r.division === "elite").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-5xl font-black tracking-tight">
        <span className="bg-gradient-to-r from-rivals-gold via-rivals-red to-rivals-blue bg-clip-text text-transparent">Elite</span>
      </h1>
      <p className="mt-2 text-slate-400">{t("div.eliteSub").replace("{n}", String(n))}</p>
      {hydrated ? (
        <div className="fade-slide">
          <AdvanceChip division="elite" />
          <NextMatchPanel division="elite" titleLabel={t("bracket.nextUp")} />
          <DivisionView division="elite" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}
    </div>
  );
}
