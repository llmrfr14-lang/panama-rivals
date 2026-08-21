"use client";

import { players, teams } from "@/lib/seed";

export default function TeamsPage() {
  const grouped = ["A", "B", "C", "D"].map((g) => ({
    groupId: g,
    teams: teams.filter((x) => x.groupId === g),
  }));

  const total = teams.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">Teams</h1>
      {total === 0 ? (
        <div className="mt-16 mx-auto max-w-md rounded-xl border border-dashed border-rivals-border bg-rivals-surface p-10 text-center">
          <span className="emoji text-4xl">🛡️</span>
          <p className="mt-4 font-display text-xl font-bold text-rivals-gold">Temporada 2</p>
          <p className="mt-2 text-sm text-slate-400">
            Los equipos aparecen aquí cuando los capitanes se registren y se sorteen los grupos.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Teams appear here once captains register and the group draw happens.
          </p>
        </div>
      ) : (
        <p className="mt-2 text-slate-400">{total} equipos registrados</p>
      )}
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {grouped.filter(({ teams }) => teams.length > 0).map(({ groupId, teams }) => (
          <div key={groupId}>
            <h2 className="font-display text-lg font-bold text-rivals-gold">Group {groupId}</h2>
            <div className="mt-4 space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="rounded-xl border border-rivals-border bg-rivals-surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{team.name}</p>
                    <span className="text-xs uppercase tracking-widest text-slate-500">
                      Cap: {players.find((p) => p.id === team.captainId)?.handle}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-300">
                    {players
                      .filter((p) => p.teamId === team.id)
                      .map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-rivals-blue" />
                          {p.handle}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
