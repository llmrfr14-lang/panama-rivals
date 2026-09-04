"use client";

import DivisionView from "@/components/DivisionView";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function ChallengerPage() {
  const { t } = useI18n();
  const { registrations } = useStore();
  const n = registrations.filter((r) => r.division === "challenger" || !r.division).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-5xl font-black tracking-tight">
        <span className="bg-gradient-to-r from-rivals-blue via-rivals-gold to-rivals-red bg-clip-text text-transparent">Challenger</span>
      </h1>
      <p className="mt-2 text-slate-400">{t("div.challengerSub").replace("{n}", String(n))}</p>
      <DivisionView division="challenger" />
    </div>
  );
}
