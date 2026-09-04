"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { leaderboard } from "@/lib/league";

const keys = ["goals", "assists", "saves", "shots", "points"] as const;

export default function StatsPage() {
  const { t } = useI18n();
  const { matches } = useStore();
  const [sortBy, setSortBy] = useState<(typeof keys)[number]>("points");
  const rows = leaderboard(matches).sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">{t("stats.leaderboard")}</h1>
      <p className="mt-2 text-slate-400">Sort by stat:</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setSortBy(k)}
            className={`rounded border px-3 py-1 text-sm transition ${
              sortBy === k ? "border-rivals-gold bg-rivals-gold/10 text-rivals-gold" : "border-rivals-border text-slate-300 hover:text-white"
            }`}
          >
            {t(`stats.${k}`)}
          </button>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="mt-8 mx-auto max-w-md glass-card glass-dashed rounded-3xl p-10 text-center">
          <span className="emoji text-4xl">📈</span>
          <p className="mt-4 font-display text-xl font-bold text-rivals-gold">Sin stats aún</p>
          <p className="mt-2 text-sm text-slate-400">
            El leaderboard se llena cuando se aprueben los primeros resultados de la Temporada 2.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            The leaderboard fills in once the first Season 2 results get approved.
          </p>
        </div>
      )}
      {rows.length > 0 && (
      <div className="mt-8 overflow-x-auto rounded-xl border border-rivals-border">
        <table className="w-full text-sm">
          <thead className="bg-white/2 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-left">Team</th>
              {keys.map((k) => (
                <th key={k} className="px-4 py-3 text-right">
                  {t(`stats.${k}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.playerId} className="border-t border-rivals-border/50">
                <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-semibold">{r.playerId}</td>
                <td className="px-4 py-3 text-slate-300">{r.teamId}</td>
                {keys.map((k) => (
                  <td key={k} className={`px-4 py-3 text-right font-bold ${k === sortBy ? "text-rivals-gold" : ""}`}>
                    {r[k]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
