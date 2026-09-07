"use client";

import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { leaderboard } from "@/lib/league";

export default function StatsPage() {
  const { t } = useI18n();
  const { matches, registrations, teamById } = useStore();
  const ch = leaderboard("challenger", matches, registrations).slice(0, 10);
  const el = leaderboard("elite", matches, registrations).slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">Leaderboard</h1>
      <p className="mt-2 text-slate-400">{t("stats.leaderboardSub")}</p>

      {(ch.length === 0 && el.length === 0) && (
        <div className="mt-8 mx-auto max-w-md glass-card glass-dashed rounded-3xl p-10 text-center">
          <span className="emoji text-4xl">📈</span>
          <p className="mt-4 font-display text-xl font-bold text-rivals-gold">{t("stats.emptyTitle")}</p>
          <p className="mt-2 text-sm text-slate-400">
            {t("stats.emptyBody")}
          </p>
        </div>
      )}

      <StatRadars rows={ch} teamById={teamById} />
      <StatsTable title="Challenger · ≤ Champion 2" rows={ch} teamById={teamById} />

      <StatRadars rows={el} teamById={teamById} />
      <StatsTable title="Elite · Champion 3+" rows={el} teamById={teamById} />
    </div>
  );
}

function StatRadars({ rows, teamById }: { rows: { playerId: string; teamId: string; goals: number; assists: number; saves: number; shots: number; points: number }[]; teamById: (id: string | null) => { name: string } | null }) {
  const { t } = useI18n();
  const stats = [
    { key: "goals", label: t("stats.goals"), color: "#e63946" },
    { key: "assists", label: t("stats.assists"), color: "#3a86ff" },
    { key: "saves", label: t("stats.saves"), color: "#10b981" },
    { key: "shots", label: t("stats.shots"), color: "#ffd166" },
  ] as const;

  if (rows.length === 0) return null;

  const totals = Object.fromEntries(
    stats.map((s) => [s.key, rows.reduce((acc, r) => acc + r[s.key], 0)]),
  ) as Record<string, number>;

  return (
    <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s) => {
        const lead = rows.reduce((best, r) => (r[s.key] > (best?.[s.key] ?? -1) ? r : best), null as (typeof rows[number]) | null);
        const pct = totals[s.key] > 0 ? Math.round((lead?.[s.key] ?? 0) / totals[s.key] * 100) : 0;
        return (
          <div key={s.key} className="glass-card rounded-3xl p-5 text-center">
            <div
              className="relative mx-auto h-20 w-20 rounded-full"
              style={{
                background: `conic-gradient(${s.color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div className="absolute inset-[7px] flex flex-col items-center justify-center rounded-full bg-[#0b111c]">
                <span className="font-display text-xl font-black" style={{ color: s.color }}>{lead?.[s.key] ?? 0}</span>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{lead ? teamById(lead.teamId)?.name ?? lead.playerId : "—"}</p>
            <p className="text-[11px] text-slate-500">{pct}%</p>
          </div>
        );
      })}
    </div>
  );
}

function StatsTable({ title, rows, teamById }: { title: string; rows: { playerId: string; teamId: string; goals: number; assists: number; saves: number; shots: number; points: number }[]; teamById: (id: string | null) => { name: string } | null }) {
  const { t } = useI18n();
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-black text-rivals-gold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm italic text-slate-500">{t("stats.noResults")}</p>
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