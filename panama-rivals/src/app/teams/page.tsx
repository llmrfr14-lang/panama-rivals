"use client";

import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Division } from "@/lib/league";

const groupKeys = ["A", "B", "C", "D"];

export default function TeamsPage() {
  const { lang } = useI18n();
  const { registrations } = useStore();

  const divisions: { div: Division; label: string; filter: (r: { division?: Division }) => boolean }[] = [
    { div: "challenger", label: lang === "en" ? "Challenger · ≤ Champion 2" : "Challenger · ≤ Champion 2", filter: (r) => r.division === "challenger" || !r.division },
    { div: "elite", label: lang === "en" ? "Elite · Champion 3+" : "Elite · Champion 3+", filter: (r) => r.division === "elite" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">{lang === "en" ? "Teams" : "Equipos"}</h1>
      <p className="mt-2 text-slate-400">
        {lang === "en" ? `${registrations.length} teams registered` : `${registrations.length} equipos registrados`}
      </p>

      {registrations.length === 0 ? (
        <div className="mt-16 mx-auto max-w-md glass-card glass-dashed rounded-3xl p-10 text-center">
          <span className="emoji text-4xl">🛡️</span>
          <p className="mt-4 font-display text-xl font-bold text-rivals-gold">
            {lang === "en" ? "Season 2" : "Temporada 2"}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {lang === "en"
              ? "Teams appear here once captains register and the group draw happens."
              : "Los equipos aparecen aquí cuando los capitanes se registren y se sorteen los grupos."}
          </p>
        </div>
      ) : (
        divisions.map(({ div, label, filter }) => {
          const divTeams = registrations.filter(filter);
          if (divTeams.length === 0) return null;
          return (
            <section key={div} className="mt-12">
              <h2 className="font-display text-2xl font-black text-rivals-gold">{label}</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {groupKeys.map((g) => {
                  const groupTeams = divTeams.filter((r) => r.groupId === `${div}-${g}`);
                  if (groupTeams.length === 0) return null;
                  return (
                    <div key={g}>
                      <h3 className="font-display text-lg font-bold text-rivals-gold">
                        {lang === "en" ? "Group" : "Grupo"} {g}
                      </h3>
                      <div className="mt-4 space-y-4">
                        {groupTeams.map((team) => (
                          <div key={team.id} className="glass-card rounded-3xl p-4">
                            <p className="font-semibold">{team.teamName}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Cap: {team.captain.discord || team.captain.epicId || "—"}
                            </p>
                            <div className="mt-3 space-y-1 text-sm text-slate-300">
                              {team.players.map((p, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rivals-blue" />
                                  {p.discord || p.epicId || "NA"} · {p.peakRank || ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}