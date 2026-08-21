"use client";

import { seasonOne } from "@/lib/season1";
import { useI18n } from "@/lib/i18n";

export default function SeasonOnePage() {
  const { t } = useI18n();
  const leaderCats = ["goals", "assists", "saves", "shots", "points"] as const;
  const qf = seasonOne.knockout.filter((m) => m.round === "QF");
  const sf = seasonOne.knockout.filter((m) => m.round === "SF");
  const fin = seasonOne.knockout.filter((m) => m.round === "Final");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-black tracking-tight md:text-5xl">
        <span className="bg-gradient-to-r from-rivals-red via-rivals-gold to-rivals-blue bg-clip-text text-transparent">
          {t("s1.title")}
        </span>
      </h1>

      <div className="mt-8 overflow-hidden rounded-2xl border border-rivals-gold/40 bg-gradient-to-r from-rivals-gold/15 via-rivals-surface to-rivals-blue/10 p-8 text-center">
        <p className="text-5xl">🏆</p>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-rivals-gold">{t("s1.champion")}</p>
        <p className="mt-1 font-display text-4xl font-black text-rivals-gold md:text-5xl">{seasonOne.champion}</p>
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-400">
          {t("s1.runnerup")}: <span className="text-slate-200">{seasonOne.runnerUp}</span> · {t("s1.final")} {seasonOne.finalScore}
        </p>
      </div>

      <h2 className="mt-16 font-display text-2xl font-black tracking-tight text-rivals-gold">{t("s1.groups")}</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {seasonOne.groups.map((g) => (
          <div key={g.name} className="rounded-xl border border-rivals-border bg-rivals-surface p-5">
            <h3 className="font-display text-lg font-black text-rivals-gold">{g.name}</h3>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-rivals-border text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-2">Team</th>
                  <th className="px-2 pb-2 text-right">PJ</th>
                  <th className="px-2 pb-2 text-right">W</th>
                  <th className="px-2 pb-2 text-right">L</th>
                  <th className="pb-2 pl-2 text-right">PTS</th>
                </tr>
              </thead>
              <tbody>
                {g.standings.map((s, i) => (
                  <tr key={s.team} className={`border-b border-rivals-border/50 ${i < 2 ? "text-emerald-300" : ""}`}>
                    <td className="py-1.5 pr-2 font-bold text-rivals-gold">{i + 1}</td>
                    <td className="py-1.5 pr-2">{s.team}</td>
                    <td className="px-2 py-1.5 text-right text-slate-400">{s.pj}</td>
                    <td className="px-2 py-1.5 text-right">{s.w}</td>
                    <td className="px-2 py-1.5 text-right">{s.l}</td>
                    <td className="py-1.5 pl-2 text-right font-bold">{s.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <h2 className="mt-16 font-display text-2xl font-black tracking-tight text-rivals-gold">{t("s1.bracket")}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {([
          [t("s1.qf"), qf],
          [t("s1.sf"), sf],
          [t("s1.final"), fin],
        ] as [string, typeof qf][]).map(([label, matches]) => (
          <div key={label} className="rounded-xl border border-rivals-border bg-rivals-surface p-5">
            <h3 className="font-display text-base font-black text-rivals-red">{label}</h3>
            <div className="mt-4 space-y-3">
              {matches.map((m) => (
                <div key={`${m.round}-${m.home}`} className="rounded-lg border border-rivals-border/60 bg-rivals-bg/50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className={m.winner === m.home ? "font-bold text-emerald-300" : "text-slate-300"}>{m.home}</span>
                    <span className="font-mono font-bold">{m.hs}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className={m.winner === m.away ? "font-bold text-emerald-300" : "text-slate-400"}>{m.away}</span>
                    <span className="font-mono font-bold text-slate-400">{m.as}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-16 font-display text-2xl font-black tracking-tight text-rivals-gold">{t("s1.leaders")}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {leaderCats.map((cat) => (
          <div key={cat} className="rounded-xl border border-rivals-border bg-rivals-surface p-4">
            <h3 className="font-display text-sm font-black uppercase tracking-wider text-rivals-blue">
              {t(cat === "points" ? "s1.pointsLabel" : `s1.${cat}`)}
            </h3>
            <ol className="mt-3 space-y-1.5 text-sm">
              {seasonOne.leaders[cat].map((p, i) => (
                <li key={p.name} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">
                    <span className="mr-1 font-bold text-rivals-gold">{i + 1}.</span>
                    <span className="font-semibold">{p.name}</span>
                    <span className="ml-1 text-[11px] text-slate-500">{p.team}</span>
                  </span>
                  <span className="font-mono font-bold text-rivals-gold">{p.value}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
