"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { StatLine } from "@/lib/types";

export default function ReportPage() {
  const params = useParams<{ matchId: string }>();
  const search = useSearchParams();
  const matchId = decodeURIComponent(params.matchId);

  const {
    matches,
    teamById,
    rosterOf,
    isValidReportToken,
    submitResult,
  } = useStore();

  const match = matches.find((m) => m.id === matchId);
  const [tokenInput, setTokenInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [badToken, setBadToken] = useState(false);

  const token = search.get("token") ?? (unlocked ? tokenInput.trim().toLowerCase() : "");
  const authorized = Boolean(match) && token !== "" && isValidReportToken(matchId, token);

  const [score, setScore] = useState("1:0");
  const [stats, setStats] = useState<Record<string, StatLine>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!match) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="emoji text-4xl">🔍</p>
        <h1 className="mt-4 font-display text-2xl font-black text-rivals-gold">Partido no encontrado</h1>
        <p className="mt-2 text-sm text-slate-400">Este partido aún no existe — vuelve cuando el sorteo esté listo.</p>
        <Link href="/tournament" className="mt-6 inline-block text-sm text-rivals-blue hover:underline">
          ← Volver al torneo
        </Link>
      </div>
    );
  }

  const home = teamById(match.homeTeamId);
  const away = teamById(match.awayTeamId);

  if (!authorized) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="emoji text-4xl">🔒</p>
        <h1 className="mt-4 font-display text-2xl font-black text-rivals-gold">
          Reporte de capitanes
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {home?.name ?? "?"} vs {away?.name ?? "?"} — solo los capitanes pueden reportar este partido.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Ingresa el código de reporte que recibiste de la admin (o usa el link directo de tu partido).
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isValidReportToken(matchId, tokenInput)) {
              setUnlocked(true);
              setBadToken(false);
            } else {
              setBadToken(true);
            }
          }}
          className="mx-auto mt-6 flex max-w-xs gap-2"
        >
          <input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Código de reporte"
            className="w-full soft-ring rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-center font-mono uppercase tracking-widest outline-none focus:border-rivals-blue"
          />
          <button
            type="submit"
            className="soft-ring rounded-full bg-rivals-red px-5 py-2 font-bold text-white shadow-[0_4px_16px_rgba(230,57,70,0.35)] transition hover:brightness-110"
          >
            Entrar
          </button>
        </form>
        {badToken && <p className="mt-3 text-sm text-red-400">Código incorrecto — pídeselo a la admin.</p>}
        <Link href="/tournament" className="mt-6 inline-block text-sm text-rivals-blue hover:underline">
          ← Volver al torneo
        </Link>
      </div>
    );
  }

  const rosters = [
    { teamId: match.homeTeamId!, players: rosterOf(match.homeTeamId) },
    { teamId: match.awayTeamId!, players: rosterOf(match.awayTeamId) },
  ];

  const setLine = (
    playerId: string,
    teamId: string,
    field: "goals" | "assists" | "saves" | "shots",
    value: number
  ) => {
    setStats((s) => {
      const prev = s[playerId] ?? { playerId, teamId, goals: 0, assists: 0, saves: 0, shots: 0 };
      return { ...s, [playerId]: { ...prev, [field]: value } };
    });
  };

  const [h, a] = score.split(":").map(Number);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = rosters.flatMap(({ teamId, players }) =>
      players.map((p) => stats[p.id] ?? { playerId: p.id, teamId, goals: 0, assists: 0, saves: 0, shots: 0 })
    );
    submitResult(matchId, "captain", h || 0, a || 0, lines);
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">Reportar resultado</h1>
      <p className="mt-2 text-slate-400">
        {home?.name} vs {away?.name} — el resultado va a la admin para aprobación antes de contar en standings.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6 glass-card rounded-3xl p-6">
        <label className="block">
          <span className="text-sm text-slate-400">Marcador (series ganadas) — ej. 2:1</span>
          <input
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono backdrop-blur-md transition"
          />
        </label>

        <div>
          <p className="text-sm text-slate-400">Stats por jugador</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {rosters.map(({ teamId, players }) => (
              <div key={teamId}>
                <p className="text-xs font-semibold uppercase tracking-widest text-rivals-gold">
                  {teamById(teamId)?.name}
                </p>
                <div className="mt-3 space-y-3">
                  {players.map((p) => {
                    const line = stats[p.id] ?? { playerId: p.id, teamId, goals: 0, assists: 0, saves: 0, shots: 0 };
                    return (
                      <div key={p.id} className="rounded border border-rivals-border/60 p-3 text-xs">
                        <p className="font-semibold text-slate-200">{p.handle}</p>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-slate-400">
                          {(["goals", "assists", "saves", "shots"] as const).map((f) => (
                            <label key={f}>
                              <span className="uppercase">{f.slice(0, 1)}</span>
                              <input
                                type="number"
                                min={0}
                                value={line[f]}
                                onChange={(e) => setLine(p.id, teamId, f, Number(e.target.value) || 0)}
                                className="mt-1 w-full soft-ring rounded-lg border border-white/10 bg-white/5 px-1 py-1 text-center backdrop-blur-md transition"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {players.length === 0 && (
                    <p className="text-slate-500">Roster pendiente — agrega los handles desde Discord.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitted || match.status !== "scheduled"}
          className="w-full rounded bg-rivals-blue py-3 font-bold text-white transition disabled:opacity-50 hover:enabled:brightness-110"
        >
          {match.status !== "scheduled"
            ? "Ya reportado — esperando aprobación"
            : submitted
              ? "✓ Enviado para revisión"
              : "Enviar resultado"}
        </button>
        {submitted && (
          <p className="text-center text-sm text-emerald-300">
            La admin revisará y aprobará tu reporte. Se publica en standings y stats al aprobarse.
          </p>
        )}
      </form>
    </div>
  );
}
