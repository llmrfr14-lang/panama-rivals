"use client";

import Link from "next/link";
import DivisionView from "@/components/DivisionView";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export default function TournamentPage() {
  const { t } = useI18n();
  const { registrations } = useStore();
  const challenger = registrations.filter((r) => r.division === "challenger" || !r.division);
  const elite = registrations.filter((r) => r.division === "elite");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black">{t("tournament.groups")}</h1>
          <p className="mt-2 text-sm text-slate-400">{t("tournament.legend")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/challenger" className="soft-ring rounded-full border border-rivals-border bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-rivals-gold hover:text-rivals-gold">
            {t("tournament.viewChallenger")}
          </Link>
          <Link href="/elite" className="soft-ring rounded-full border border-rivals-border bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-rivals-gold hover:text-rivals-gold">
            {t("tournament.viewElite")}
          </Link>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-black text-rivals-gold">
          Challenger <span className="text-sm font-bold text-slate-500">· ≤ Champion 2 · {challenger.length} {t("tournament.teams")}</span>
        </h2>
        <DivisionView division="challenger" />
      </section>

      <section className="mt-20">
        <h2 className="font-display text-3xl font-black text-rivals-gold">
          Elite <span className="text-sm font-bold text-slate-500">· Champion  ​3+ · {elite.length} {t("tournament.teams")}</span>
        </h2>
        <DivisionView division="elite" />
      </section>
    </div>
  );
}