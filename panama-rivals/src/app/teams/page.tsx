"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Division } from "@/lib/league";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const groupKeys = ["A", "B", "C", "D"];

export default function TeamsPage() {
  const { lang } = useI18n();
  const { registrations } = useStore();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matchFilter = (r: (typeof registrations)[number]) =>
    !q ||
    r.teamName.toLowerCase().includes(q) ||
    r.captain.discord.toLowerCase().includes(q) ||
    r.captain.epicId.toLowerCase().includes(q) ||
    r.players.some((p) => (p.discord || "").toLowerCase().includes(q) || (p.epicId || "").toLowerCase().includes(q));
  const results = q ? registrations.filter(matchFilter) : null;

  const divisions: { div: Division; label: string; filter: (r: { division?: Division }) => boolean }[] = [
    { div: "challenger", label: lang === "en" ? "Challenger · ≤ Champion 2" : "Challenger · ≤ Champion 2", filter: (r) => r.division === "challenger" || !r.division },
    { div: "elite", label: lang === "en" ? "Elite · Champion 3+" : "Elite · Champion 3+", filter: (r) => r.division === "elite" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Breadcrumbs items={[{ label: lang === "en" ? "Teams" : "Equipos" }]} lang={lang} />
      <h1 className="font-display text-4xl font-black">{lang === "en" ? "Teams" : "Equipos"}</h1>
      <p className="mt-2 text-slate-400">
        {lang === "en" ? `${registrations.length} teams registered` : `${registrations.length} equipos registrados`}
      </p>

      {registrations.length > 0 && (
        <div className="mt-6 max-w-md">
          <label className="sr-only" htmlFor="team-search">
            {lang === "en" ? "Search teams" : "Buscar equipos"}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              id="team-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "en" ? "Search team, player or captain…" : "Busca equipo, jugador o capitán…"}
              className="soft-ring w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 backdrop-blur transition focus:border-rivals-blue/50"
            />
          </div>
          {q && (
            <p className="mt-2 px-2 text-xs text-slate-500">
              {lang === "en"
                ? `${results?.length ?? 0} result${results?.length === 1 ? "" : "s"} for "${query.trim()}"`
                : `${results?.length ?? 0} resultado${results?.length === 1 ? "" : "s"} para "${query.trim()}"`}
            </p>
          )}
        </div>
      )}

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
      ) : q ? (
        results && results.length === 0 ? (
          <div className="mt-10 glass-card glass-dashed rounded-3xl p-10 text-center">
            <span className="emoji text-3xl">🔍</span>
            <p className="mt-3 font-display text-lg font-bold text-slate-300">
              {lang === "en" ? "No teams match your search." : "Ningún equipo coincide con tu búsqueda."}
            </p>
            <button
              onClick={() => setQuery("")}
              className="soft-ring mt-5 rounded-full bg-rivals-red px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
            >
              {lang === "en" ? "✕ Clear search" : "✕ Limpiar búsqueda"}
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(results ?? []).map((team) => (
              <div key={team.id} className="glass-card rounded-3xl p-5">
                <p className="font-semibold text-rivals-gold">{team.teamName}</p>
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
        )
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