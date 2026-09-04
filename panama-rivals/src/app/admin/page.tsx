"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE ?? "fieles-2026-campeon";

export default function AdminPage() {
  const { t } = useI18n();
  const {
    submissions,
    matches,
    registrations,
    approve,
    decline,
    teamById,
    assignGroup,
    generateSchedule,
    reportToken,
  } = useStore();

  const pending = submissions.filter((s) => s.status === "pending");
  const processed = submissions.filter((s) => s.status !== "pending");
  const groupMatches = matches.filter((m) => m.stage === "group");
    const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [wrong, setWrong] = useState(false);

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <p className="emoji text-4xl">🔒</p>
        <h1 className="mt-4 font-display text-2xl font-black text-rivals-gold">Solo admin</h1>
        <p className="mt-2 text-sm text-slate-400">Ingresa el código de admin para continuar.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim() === ADMIN_CODE) {
              setUnlocked(true);
              setWrong(false);
            } else {
              setWrong(true);
            }
          }}
          className="mt-6 flex gap-2"
        >
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de admin"
            className="w-full soft-ring rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 outline-none focus:border-rivals-blue"
            autoFocus
          />
          <button type="submit" className="soft-ring rounded-full bg-rivals-red px-5 py-2 font-bold text-white shadow-[0_4px_16px_rgba(230,57,70,0.35)] transition hover:brightness-110">
            Entrar
          </button>
        </form>
        {wrong && <p className="mt-3 text-sm text-red-400">Código incorrecto.</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">{t("nav.admin")}</h1>
      <p className="mt-2 text-slate-400">
        Revisa resultados enviados por capitanes. Aprobar actualiza standings y leaderboards al instante.
      </p>

      <h2 className="mt-10 font-display text-2xl font-bold text-rivals-gold">Registros Temporada 2</h2>
      <div className="mt-4 space-y-3">
        {registrations.map((r) => (
          <div key={r.id} className="glass-card rounded-3xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{r.teamName}</p>
                <p className="text-xs text-slate-500">
                  Cap: {r.captain.discord || r.captain.epicId
                    ? `${r.captain.discord || "?"} / ${r.captain.epicId || "?"}`
                    : "—"}
                  {r.captain.phone && (
                    <>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <a href={`tel:${r.captain.phone}`} className="text-rivals-gold">
                        📞 {r.captain.phone}
                      </a>
                    </>
                  )}
                  <span className="mx-1.5 text-slate-600">·</span>
                  {r.players
                    .map((p) => `${[p.discord, p.epicId].filter(Boolean).join(" / ") || "—"}${p.phone && p.phone !== "NA" ? " · 📞 " + p.phone : ""} ${p.nationality === "int" ? "🌎" : "🇵🇦"} ${p.peakRank || ""}`.trim())
                    .join(" · ")}
                </p>
              </div>
              <select
                value={r.groupId ?? ""}
                onChange={(e) => assignGroup(r.id, e.target.value || null)}
                className="soft-ring rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm backdrop-blur-md transition focus:border-white/20"
              >
                <option value="">Sin grupo</option>
                {["A", "B", "C", "D"].map((g) => (
                  <option key={g} value={g}>
                    Grupo {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {registrations.length === 0 && (
          <p className="text-slate-500">Sin registros aún — comparte el link de Registro en Discord.</p>
        )}
      </div>

      {registrations.some((r) => r.groupId) && (
        <button
          onClick={generateSchedule}
          className="mt-4 w-full soft-ring rounded-full bg-rivals-red py-3 font-bold text-white shadow-[0_8px_24px_rgba(230,57,70,0.35)] transition hover:brightness-110"
        >
          Generar calendario de grupos (round robin)
        </button>
      )}

      {groupMatches.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl font-bold text-rivals-gold">
            Links de reporte para capitanes
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Copia el link y mándaselo por DM al capitán de cada equipo — solo con ese link pueden reportar.
          </p>
          <div className="mt-4 space-y-2 text-xs">
            {groupMatches.map((m) => (
              <div key={m.id} className="rounded border border-rivals-border px-3 py-2">
                <p className="font-semibold text-slate-200">
                  {teamById(m.homeTeamId)?.name} vs {teamById(m.awayTeamId)?.name}{" "}
                  <span className="text-slate-500">({m.groupId})</span>
                </p>
                <p className="mt-1 font-mono text-slate-400">
                  Home: /report/{m.id}?token={reportToken(m.id, "home")} · Away: /report/{m.id}
                  ?token={reportToken(m.id, "away")}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 font-display text-2xl font-bold text-rivals-gold">{t("admin.pending")}</h2>
      <div className="mt-4 space-y-3">
        {pending.map((s) => {
          const m = matches.find((x) => x.id === s.matchId);
          const home = teamById(m?.homeTeamId ?? null)?.name ?? m?.homeTeamId;
          const away = teamById(m?.awayTeamId ?? null)?.name ?? m?.awayTeamId;
          return (
            <div key={s.id} className="glass-card rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {home} {s.homeScore} — {away} {s.awayScore}
                </p>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  envió: {s.submittedBy}
                </span>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-1 text-left">Player</th>
                      <th className="py-1 text-center">G</th>
                      <th className="py-1 text-center">A</th>
                      <th className="py-1 text-center">S</th>
                      <th className="py-1 text-center">Shots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.stats.map((st) => (
                      <tr key={st.playerId} className="border-t border-rivals-border/40">
                        <td className="py-1">{st.playerId}</td>
                        <td className="py-1 text-center">{st.goals}</td>
                        <td className="py-1 text-center">{st.assists}</td>
                        <td className="py-1 text-center">{st.saves}</td>
                        <td className="py-1 text-center">{st.shots}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approve(s.id)}
                  className="soft-ring rounded-full bg-rivals-red px-4 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(230,57,70,0.3)] transition hover:brightness-110"
                >
                  {t("admin.approve")}
                </button>
                <button
                  onClick={() => {
                    const note = prompt("Nota para el capitán (opcional):") ?? undefined;
                    decline(s.id, note);
                  }}
                  className="rounded border border-rivals-border px-4 py-2 text-sm font-bold hover:border-rivals-gold hover:text-rivals-gold"
                >
                  {t("admin.decline")}
                </button>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && <p className="text-slate-500">{t("admin.none")}</p>}
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold text-rivals-gold">Procesados</h2>
      <div className="mt-4 space-y-2 text-sm">
        {processed.map((s) => {
          const m = matches.find((x) => x.id === s.matchId);
          return (
            <div key={s.id} className="flex items-center justify-between rounded border border-rivals-border px-3 py-2">
              <span>
                {teamById(m?.homeTeamId ?? null)?.name} {s.homeScore}-{s.awayScore}{" "}
                {teamById(m?.awayTeamId ?? null)?.name}
              </span>
              <span className={`text-xs font-bold uppercase ${s.status === "approved" ? "text-emerald-400" : "text-rose-400"}`}>
                {s.status}
              </span>
            </div>
          );
        })}
        {processed.length === 0 && <p className="text-slate-500">Aún no hay resultados procesados.</p>}
      </div>
    </div>
  );
}
