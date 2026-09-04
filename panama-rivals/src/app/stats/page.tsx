"use client";

import { useStore } from "@/lib/store";
import { leaderboard } from "@/lib/league";

export default function StatsPage() {
  const { matches, registrations, teamById } = useStore();
  const ch = leaderboard("challenger", matches, registrations).slice(0, 10);
  const el = leaderboard("elite", matches, registrations).slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">Leaderboard</h1>
      <p className="mt-2 text-slate-400">Líderes por división — goles, asistencias, salvadas, tiros.

.</p>

      {(ch.length === 0 && el.length === 0) && (
        <div className="mt-8 mx-auto max-w-md glass-card glass-dashed rounded-3xl p-10 text-center">
          <span className="emoji text-4xl">📈</span>
          <p className="mt-4 font-display text-xl font-bold text-rivals-gold">Sin stats aún</p>
          <p className="mt-2 text-sm text-slate-400">
            El leaderboard se llena cuando se aprueben los primeros resultados de la Temporada 2.
          </p>
        </div>
      )}

      <StatsTable title="Challenger · ≤ Champion 2" rows={ch} teamById={teamById} />
      <StatsTable title="Elite · Champion 3+" rows={el} teamById={teamById} />
    </div>
  );
}

function StatsTable({ title, rows, teamById }: { title: string; rows: { playerId: string; teamId: string; goals: number; assists: number; saves: number; shots: number; points: number }[]; teamById: (id: string | null) => { name: string } | null }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-black text-rivals-gold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm italic text-slate-500">Sin resultados aprobados aún.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-rivals-border">
          <table className="w-full text-sm">
            <thead className="bg-white/2 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-right">G</th>
                <th className="px-4 py-3 text-right">A</th>
                <th className="px-4 py-3 text-right">S</th>
                <th className="px-4 py-3 text-right">Shots</th>
                <th className="px-4 py-3 text-right">PTS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.playerId} className="border-t border-rivals-border/50">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold">{r.playerId}</td>
                  <td className="px-4 py-3 text-slate-300">{teamById(r.teamId)?.name ?? r.teamId}</td>
                  <td className="px-4 py-3 text-right">{r.goals}</td>
                  <td className="px-4 py-3 text-right">{r.assists}</td>
                  <td className="px-4 py-3 text-right">{r.saves}</td>
                  <td className="px-4 py-3 text-right">{r.shots}</td>
                  <td className="px-4 py-3 text-right font-bold text-rivals-gold">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}