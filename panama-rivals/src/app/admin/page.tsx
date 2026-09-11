"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Match, StatLine } from "@/lib/types";
import type { Division } from "@/lib/league";

export default function AdminPage() {
  const { t, lang } = useI18n();
  const {
    submissions,
    matches,
    registrations,
    supabaseConfigured,
    approve,
    reviewRegistration,
    deleteRegistration,
    decline,
    teamById,
    assignGroup,
    generateSchedule,
    generateBracket,
    reportToken,
    rosterOf,
  } = useStore();

  const pending = submissions.filter((s) => s.status === "pending");
  const processed = submissions.filter((s) => s.status !== "pending");
  const groupMatches = matches.filter((m) => m.stage === "group");
  const unassigned: Record<Division, number> = { challenger: 0, elite: 0 };
  const anyRegistrations = registrations.length > 0;
  for (const r of registrations) {
    if (!r.groupId) unassigned[(r.division ?? "challenger") as Division]++;
  }
  
  const [startAt, setStartAt] = useState("");
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, StatLine>>>({});

  const setDraftLine = (subId: string, playerId: string, teamId: string, field: "goals" | "assists" | "saves" | "shots", value: number) => {
    setDrafts((d) => {
      const prev = d[subId]?.[playerId] ?? { playerId, teamId, goals: 0, assists:   0, saves:   0, shots: 0 };
      return { ...d, [subId]: { ...(d[subId] ?? {}), [playerId]: { ...prev, [field]: value } } };
    });
  };

  const draftLinesFor = (subId: string, teamId: string, players: { id: string; handle: string }[]): StatLine[] => {
    const fields: ("goals" | "assists" | "saves" | "shots")[] = ["goals", "assists", "saves", "shots"];
    return players.map((p) => {
      const draft = drafts[subId]?.[p.id];
      if (!draft) return { playerId: p.id, teamId, goals:  0, assists:   0, saves:   0, shots:  0 };
      return { playerId: p.id, teamId, goals: draft.goals ??  0, assists: draft.assists ??  0, saves: draft.saves ??  0, shots: draft.shots ??  0 };
    });
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking || !code.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res.ok) {
        setUnlocked(true);
        setWrong(false);
      } else {
        setWrong(true);
      }
    } catch {
      setWrong(true);
    } finally {
      setChecking(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <p className="emoji text-4xl">🔒</p>
        <h1 className="mt-4 font-display text-2xl font-black text-rivals-gold">Solo admin</h1>
        <p className="mt-2 text-sm text-slate-400">Ingresa el código de admin para continuar.</p>
        <form onSubmit={verifyCode} className="mt-6 flex gap-2">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de admin"
            className="w-full soft-ring rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 outline-none focus:border-rivals-blue"
            autoFocus
          />
          <button
            type="submit"
            disabled={checking}
            className="soft-ring rounded-full bg-rivals-red px-5 py-2 font-bold text-white shadow-[0_4px_16px_rgba(230,57,70,0.35)] transition hover:brightness-110 disabled:opacity-50"
          >
            {checking ? (lang === "es" ? "Verificando…" : "Checking…") : "Entrar"}
          </button>
        </form>
        {wrong && <p className="mt-3 text-sm text-red-400">Código incorrecto.</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">{t("nav.admin")}</h1>
      {!supabaseConfigured && (
        <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
          ⚠️ Supabase no está configurado (faltan las variables{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Los registros
          solo viven en este navegador. Configúralas en{" "}
          <code className="font-mono">.env.example</code> para sincronizar entre dispositivos.

        </p>
      )}
      <p className="mt-2 text-slate-400">
        Revisa resultados enviados por capitanes. Aprobar actualiza standings y leaderboards al instante.

      </p>

      <h2 className="mt-10 font-display text-2xl font-bold text-rivals-gold">Registros Temporada 2</h2>
      <div className="mt-4 space-y-3">
        {registrations.map((r) => (
          <div key={r.id} className="glass-card rounded-3xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {r.teamName}{" "}
                  <span className={`text-xs font-bold uppercase ${r.division === "elite" ? "text-rivals-gold" : "text-rivals-blue"}`}>
                    {r.division === "elite" ? "⚡ Elite" : "🛡️ Challenger"}
                  </span>
                </p>
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
                {(["challenger", "elite"] as const).map((div) => (
                  <optgroup key={div} label={div === "challenger" ? "Challenger (≤C2)" : "Elite (C3+)"}>
                    {["A", "B", "C", "D"].map((g) => (
                      <option key={`${div}-${g}`} value={`${div}-${g}`}>
                        {div === "challenger" ? "Challenger" : "Elite"} · Grupo {g}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              <span className={`text-xs font-bold uppercase tracking-widest ${r.status === "approved" ? "text-emerald-400" : r.status === "declined" ? "text-rose-400" : "text-amber-400"}`}>
                {r.status === "approved" ? "✓ Aprobado" : r.status === "declined" ? "✕ Rechazado" : "⏳ Pendiente"}
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="soft-ring rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:brightness-110"
                >
                  {openId === r.id ? "▲ Ocultar detalle" : "▼ Ver detalle"}
                </button>
                {r.status !== "approved" && (
                  <button
                    onClick={() => reviewRegistration(r.id, "approved")}
                    className="soft-ring rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white transition hover:brightness-110"
                  >
                    ✓ Aceptar equipo
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Rechazar y eliminar el registro de "${r.teamName}"? Se borrará permanentemente.`)) {
                      deleteRegistration(r.id);
                      if (openId === r.id) setOpenId(null);
                    }
                  }}
                  className="soft-ring rounded-full bg-rose-500/20 text-rose-400 px-3 py-1 text-xs font-bold transition hover:bg-rose-500/40"
                >
                  ✕ Rechazar
                </button>
              </div>
            </div>
            {openId === r.id && (
              <div className="mt-3 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-rivals-gold">Capitán</p>
                  <dl className="mt-2 space-y-1.5">
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-slate-500">Discord</dt>
                      <dd className="break-all">{r.captain.discord || "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-slate-500">Epic</dt>
                      <dd className="break-all">{r.captain.epicId || "—"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-slate-500">WhatsApp</dt>
                      <dd className="break-all">{r.captain.phone || "—"}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-rivals-gold">Jugadores</p>
                  {r.players.map((p, i) => (
                    <div key={i} className="mt-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                      <p className="font-semibold">{i === 0 ? "🎮 In-game" : `Jugador ${i + 1}`}</p>
                      <p className="text-xs text-slate-400 break-all">
                        {[p.discord, p.epicId].filter(Boolean).join(" / ") || "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.phone && p.phone !== "NA" ? `📞 ${p.phone}` : "sin teléfono"}
                        {" · "}{p.nationality === "int" ? "🌎 Internacional" : "🇵🇦 Panamá"}
                        {" · Rank: "}{p.peakRank || "NA"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {registrations.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
            <p className="emoji text-3xl">📢</p>
            <p className="mt-2 font-semibold text-white">Sin equipos registrados todavía</p>
            <p className="mt-1 text-sm text-slate-400">
              Compartí el link de registro en Discord para arrancar la temporada.

            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/register"
                className="soft-ring rounded-full bg-rivals-red px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
              >
                ➕ Abrir registro
              </Link>
              <a
                href="https://discord.gg/panamarivals"
                target="_blank"
                rel="noopener noreferrer"
                className="soft-ring rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
              >
                💬 Compartir en Discord
              </a>
            </div>
          </div>
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

      <h2 className="mt-10 font-display text-2xl font-bold text-rivals-gold">Bracket</h2>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-slate-400">
          Se genera automáticamente al aprobar todos los resultados de grupo — o fuérzalo aquí.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {(["challenger", "elite"] as const).map((d) => (
            <button
              key={d}
              onClick={() => generateBracket(d, startAt ? new Date(startAt).getTime() : undefined)}
              className="soft-ring rounded-full bg-rivals-red/90 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
            >
              {d === "challenger" ? "🛡️" : "⚡"} Generar bracket {d}
            </button>
          ))}
          <label className="flex items-center gap-2 text-sm text-slate-400">
            Inicio 15-min:
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="soft-ring rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm backdrop-blur-md transition"
            />
          </label>
        </div>
      </div>

      {/* ── RESULTADOS EN VIVO ── */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold text-rivals-gold">Resultados en vivo</h2>
        <p className="mt-1 text-xs text-slate-500">
          Se actualiza solo(realtime Supabase)— quién ya reportó y quién falta por marcar.

        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(["challenger", "elite"] as const).map((d) => {
            const ko = matches.filter((m) => m.groupId === d && m.stage !== "group").sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
            const groupMs = matches.filter((m) => m.groupId === d && m.stage === "group");
            const reported = groupMs.filter((m) => m.status === "approved" || m.status === "ff");
            const missing = groupMs.filter((m) => m.status === "scheduled");
            const reviewing = groupMs.filter((m) => m.status === "pending_review");
            return (
              <div key={d} className="glass-card rounded-3xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`font-display text-sm font-black uppercase tracking-widest ${d === "elite" ? "text-rivals-gold" : "text-rivals-blue"}`}>
                    {d === "elite" ? "⚡ Elite" : "🛡️ Challenger"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-slate-300">
                      Grupos: {reported.length}/{groupMs.length} reportados
                    </span>
                  </div>
                </div>

                {groupMs.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Grupos — quién falta por reportar
                    </p>
                    {missing.length === 0 && reviewing.length === 0 ? (
                      <p className="mt-1.5 text-xs font-semibold text-emerald-400">
                        ✓ Todos los resultados de grupo aprobados. 🎉
                      </p>
                    ) : (
                      <ul className="mt-1.5 space-y-1 text-xs">
                        {[...missing, ...reviewing].map((m) => (
                          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/3 px-2.5 py-1.5">
                            <span className="font-medium text-slate-200">
                              {teamById(m.homeTeamId)?.name ?? "?"} <span className="text-slate-500">vs</span>{" "}
                              {teamById(m.awayTeamId)?.name ?? "?"}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                m.status === "scheduled"
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "bg-rivals-blue/15 text-rivals-blue"
                              }`}
                            >
                              {m.status === "scheduled" ? "⚠ falta reportar" : "⏳ en revisión"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {groupMs.length === 0 && ko.length === 0 && (
                  <div className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
                    <p className="emoji text-2xl">🗂️</p>
                    <p className="mt-1.5 text-xs font-semibold text-white">
                      Sin partidos aún en {d === "challenger" ? "Challenger" : "Elite"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Aparecen después del sorteo de grupos.{" "}
                      {unassigned[d] > 0 && (
                        <>
                          — hay <b className="text-rivals-gold">{unassigned[d]}</b>{" "}
                          {lang === "en" ? "team(s) sin grupo" : "equipo(s) sin grupo"}.{" "}
                          Asignales grupo en la lista de arriba.
                        </>
                      )}
                    </p>
                    {anyRegistrations && (
                      <button
                        onClick={generateSchedule}
                        className="mt-3 soft-ring rounded-full bg-rivals-red px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
                      >
                        {lang === "en" ? "📅 Generate group schedule now" : "📅 Generar calendario de grupos ahora"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {(groupMatches.length > 0 || matches.some((m) => m.stage !== "group" && m.status === "scheduled")) && (
        <>
          <h2 className="mt-10 font-display text-2xl font-bold text-rivals-gold">
            Links de reporte para capitanes
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Copia el link y mándaselo por DM al capitán de cada equipo — solo con ese link pueden reportar.
          </p>
          <div className="mt-4 space-y-2 text-xs">
            {[...groupMatches, ...matches.filter((m) => m.stage !== "group" && m.status === "scheduled")].map((m) => (
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
              <div className="mt-3 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Stats individuales — las cargan los admins (los capitanes ya no las envían)
                </p>
                {(() => {
                  const teamIds = [m?.homeTeamId ?? "", m?.awayTeamId ?? ""];
                  return teamIds.map((tid) => (
                    <div key={tid}>
                      <p className="text-xs font-bold uppercase tracking-widest text-rivals-gold">
                        {teamById(tid)?.name ?? tid}
                      </p>
                      <div className="mt-1 space-y-1">
                        {rosterOf(tid).map((p) => {
                          const line = drafts[s.id]?.[p.id] ?? s.stats.find((st) => st.playerId === p.id) ?? { playerId: p.id, teamId: tid, goals:  0, assists:  0, saves:  0, shots:  0 };
                          return (
                            <div key={p.id} className="flex items-center gap-2 rounded border border-rivals-border/40 px-2 py-1 text-xs">
                              <span className="min-w-0 flex-1 truncate font-semibold text-slate-200">{p.handle}</span>
                              {(["goals", "assists", "saves", "shots"] as const).map((f) => (
                                <label key={f} className="flex items-center gap-1 text-slate-400">
                                  <span className="uppercase">{f.slice(0, 1)}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={line[f]}
                                    onChange={(e) => setDraftLine(s.id, p.id, tid, f, Number(e.target.value) || 0)}
                                    className="w-14 soft-ring rounded-lg border border-white/10 bg-white/5 px-1 py-0.5 text-center backdrop-blur-md transition"
                                  />
                                </label>
                              ))}
                            </div>
                          );
                        })}
                        {rosterOf(tid).length === 0 && (
                          <p className="text-slate-500">Roster pendiente</p>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              {s.photo ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Foto del marcador final — verifica que TODOS los jugadores aparecen
                  </p>
                  <a href={s.photo} target="_blank" rel="noreferrer" className="mt-1 inline-block">
                    <img
                      src={s.photo}
                      alt="Marcador final"
                      className="h-24 w-auto rounded-lg border border-white/10 object-contain hover:brightness-110"
                    />
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-xs text-amber-400">Sin foto del marcador</p>
              )}
              {s.replay ? (
                <p className="mt-1 text-xs text-emerald-300">
                  ✓ Replay adjunto:{" "}
                  <a href={s.replay} download className="underline">
                    descargar .replay
                  </a>
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => approve(
                    s.id,
                    draftLinesFor(s.id, m?.homeTeamId ?? "", rosterOf(m?.homeTeamId ?? null)).concat(
                      draftLinesFor(s.id, m?.awayTeamId ?? "", rosterOf(m?.awayTeamId ?? null))
                    )
                )}
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
