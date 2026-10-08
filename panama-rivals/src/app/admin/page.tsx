"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Match, StatLine } from "@/lib/types";
import type { Division } from "@/lib/league";
import { hasPlatformId, platformIcon, platformIdLabel, platformLabel } from "@/lib/platforms";
import { EvidenceLightbox } from "@/components/EvidenceLightbox";

export default function AdminPage() {
  const { t, lang } = useI18n();
  const {
    submissions,
    matches,
    registrations,
    supabaseConfigured,
    lastSyncError,
    approve,
    reviewRegistration,
    deleteRegistration,
    decline,
    updateSubmissionScore,
    reopenMatch,
    editApprovedResult,
    archiveSeason,
    fetchSubmissionEvidence,
    teamById,
    assignGroup,
    generateSchedule,
    generateBracket,
    rosterOf,
  } = useStore();

  const pending = submissions.filter((s) => s.status === "pending");
  const processed = submissions.filter((s) => s.status !== "pending");
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
  const [evidence, setEvidence] = useState<Record<string, { photo?: string; replay?: string } | null>>({});
  const [evidenceLoading, setEvidenceLoading] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ photo?: string; replay?: string; replayName?: string } | null>(null);
  // Admin-editable scores: pending reports (before approving) and approved matches (typo fixes).
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, { h: string; a: string }>>({});
  const [editDrafts, setEditDrafts] = useState<Record<string, { h: string; a: string }>>({});
  const [archiving, setArchiving] = useState(false);

  const loadEvidence = async (id: string) => {
    if (evidence[id] !== undefined) return evidence[id];
    if (evidenceLoading[id]) return null;
    setEvidenceLoading((e) => ({ ...e, [id]: true }));
    try {
      const ev = await fetchSubmissionEvidence(id);
      setEvidence((e) => ({ ...e, [id]: ev }));
      return ev;
    } finally {
      setEvidenceLoading((e) => ({ ...e, [id]: false }));
    }
  };

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

  const openLightbox = async (subId: string, replayName?: string) => {
    const ev = await loadEvidence(subId);
    setLightbox(ev ? { photo: ev.photo, replay: ev.replay, replayName } : { replayName });
  };

  const submitScore = (subId: string, fallbackH: number, fallbackA: number) => {
    const d = scoreDrafts[subId];
    const h = d ? Number(d.h) : fallbackH;
    const a = d ? Number(d.a) : fallbackA;
    updateSubmissionScore(subId, Number.isFinite(h) ? h : fallbackH, Number.isFinite(a) ? a : fallbackA);
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
    <>
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
      {lastSyncError && (
        <p className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
          ⚠️ Error al guardar en Supabase: <code className="font-mono">{lastSyncError}</code>.{" "}
          La fila no se persistió; recarga y vuelve a intentar.

        </p>
      )}
      <p className="mt-2 text-slate-400">
        Revisa resultados enviados por capitanes. Aprobar actualiza standings y leaderboards al instante.

      </p>

      <h2 className="mt-10 font-display text-2xl font-bold text-rivals-gold">Registros Temporada 3</h2>
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
                    .map((p) => `${[p.discord, p.epicId].filter(Boolean).join(" / ") || "—"}${hasPlatformId(p.platformId) ? ` · ${platformIcon(p.platform)} ${platformIdLabel(p)}` : ""}${p.phone && p.phone !== "NA" ? " · 📞 " + p.phone : ""} ${p.nationality === "int" ? "🌎" : "🇵🇦"} ${p.peakRank || ""}`.trim())
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
                      <dt className="w-24 shrink-0 text-slate-500">Plataforma</dt>
                      <dd className="break-all">
                        {hasPlatformId(r.captain.platformId)
                          ? `${platformIcon(r.captain.platform)} ${platformIdLabel(r.captain)}`
                          : platformLabel(r.captain.platform) || "—"}
                      </dd>
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
                      {hasPlatformId(p.platformId) && (
                        <p className="text-xs text-slate-400 break-all">
                          {platformIcon(p.platform)} {platformIdLabel(p)}
                        </p>
                      )}
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
            // Group rows are namespaced per division ("challenger-A"), so match the
            // prefix — the old `=== d` never matched and the panel always showed 0.
            const groupMs = matches.filter((m) => m.stage === "group" && m.groupId?.startsWith(`${d}-`));
            const reported = groupMs.filter((m) => m.status === "approved" || m.status === "ff");
            // Anything not approved/ff and not already under review still needs a
            // report — including reopened ("declined") matches.
            const missing = groupMs.filter((m) => m.status === "scheduled" || m.status === "declined").sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || a.id.localeCompare(b.id));
            const reviewing = groupMs.filter((m) => m.status === "pending_review").sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || a.id.localeCompare(b.id));
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
                              {m.round ? <span className="mr-1.5 font-bold text-rivals-gold">J{m.round}</span> : null}
                              {teamById(m.homeTeamId)?.name ?? "?"} <span className="text-slate-500">vs</span>{" "}
                              {teamById(m.awayTeamId)?.name ?? "?"}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                m.status === "pending_review"
                                  ? "bg-rivals-blue/15 text-rivals-blue"
                                  : "bg-amber-500/15 text-amber-300"
                              }`}
                            >
                              {m.status === "pending_review" ? "⏳ en revisión" : m.status === "declined" ? "↺ reabierto" : "⚠ falta reportar"}
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


      <h2 className="mt-10 font-display text-2xl font-bold text-rivals-gold">{t("admin.pending")}</h2>
      <div className="mt-4 space-y-3">
        {pending.map((s) => {
          const m = matches.find((x) => x.id === s.matchId);
          const home = teamById(m?.homeTeamId ?? null)?.name ?? m?.homeTeamId;
          const away = teamById(m?.awayTeamId ?? null)?.name ?? m?.awayTeamId;
          return (
            <div key={s.id} className="glass-card rounded-3xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 font-semibold">
                  <span>{home}</span>
                  <input
                    type="number"
                    min={0}
                    aria-label="Marcador local"
                    value={scoreDrafts[s.id]?.h ?? String(s.homeScore)}
                    onChange={(e) => setScoreDrafts((d) => ({ ...d, [s.id]: { h: e.target.value, a: d[s.id]?.a ?? String(s.awayScore) } }))}
                    onBlur={() => submitScore(s.id, s.homeScore, s.awayScore)}
                    className="w-14 soft-ring rounded-lg border border-white/10 bg-white/5 px-1 py-0.5 text-center font-mono backdrop-blur-md transition"
                  />
                  <span className="text-slate-500">—</span>
                  <input
                    type="number"
                    min={0}
                    aria-label="Marcador visitante"
                    value={scoreDrafts[s.id]?.a ?? String(s.awayScore)}
                    onChange={(e) => setScoreDrafts((d) => ({ ...d, [s.id]: { h: d[s.id]?.h ?? String(s.homeScore), a: e.target.value } }))}
                    onBlur={() => submitScore(s.id, s.homeScore, s.awayScore)}
                    className="w-14 soft-ring rounded-lg border border-white/10 bg-white/5 px-1 py-0.5 text-center font-mono backdrop-blur-md transition"
                  />
                  <span>{away}</span>
                </div>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  envió: {s.submittedBy}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Si el capitán envió mal el marcador, corrígelo aquí — se guarda al salir del campo.
              </p>
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
              {(() => {
                const ev = evidence[s.id];
                if (ev === undefined) {
                  return (
                    <p className="mt-3 text-xs text-slate-500">
                      {s.photo || s.replay ? "Evidencia subida — usa «Ver foto/replay»." : "Sin fotos ni replays adjuntos."}
                    </p>
                  );
                }
                return (
                  <>
                    {ev?.photo ? (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                          Foto del marcador final — verifica que TODOS los jugadores aparecen
                        </p>
                        <button
                          type="button"
                          onClick={() => openLightbox(s.id)}
                          className="mt-1 block"
                          aria-label="Ampliar foto del marcador"
                        >
                          <img
                            src={ev.photo}
                            alt="Marcador final"
                            className="h-24 w-auto cursor-zoom-in rounded-lg border border-white/10 object-contain transition hover:brightness-110"
                          />
                          <span className="mt-1 block text-[10px] font-semibold text-rivals-blue">
                            🔍 Toca la foto para ampliarla
                          </span>
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-amber-400">Sin foto del marcador</p>
                    )}
                    {ev?.replay ? (
                      <p className="mt-1 text-xs text-emerald-300">
                        ✓ Replay adjunto:{" "}
                        <button type="button" onClick={() => openLightbox(s.id)} className="underline">
                          ver / descargar .replay
                        </button>
                      </p>
                    ) : null}
                  </>
                );
              })()}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    submitScore(s.id, s.homeScore, s.awayScore);
                    const sd = scoreDrafts[s.id];
                    const h = sd ? Number(sd.h) : s.homeScore;
                    const a = sd ? Number(sd.a) : s.awayScore;
                    approve(
                      s.id,
                      draftLinesFor(s.id, m?.homeTeamId ?? "", rosterOf(m?.homeTeamId ?? null)).concat(
                        draftLinesFor(s.id, m?.awayTeamId ?? "", rosterOf(m?.awayTeamId ?? null))
                      ),
                      Number.isFinite(h) ? h : s.homeScore,
                      Number.isFinite(a) ? a : s.awayScore
                    );
                  }}
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
                <button
                  onClick={() => openLightbox(s.id)}
                  className="rounded border border-rivals-border px-4 py-2 text-sm font-bold text-rivals-blue hover:border-rivals-blue"
                >
                  {evidenceLoading[s.id] ? "Cargando…" : "Ver foto/replay"}
                </button>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && <p className="text-slate-500">{t("admin.none")}</p>}
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold text-rivals-gold">Procesados</h2>
      <p className="mt-1 text-xs text-slate-500">
        Corrige un marcador aprobado aquí mismo, o reábrelo para que el capitán lo vuelva a enviar.
      </p>
      <div className="mt-4 space-y-2 text-sm">
        {processed.map((s) => {
          const m = matches.find((x) => x.id === s.matchId);
          const isApproved = s.status === "approved";
          const ed = editDrafts[s.id]?.h !== undefined || editDrafts[s.id]?.a !== undefined;
          const h = ed ? editDrafts[s.id].h : String(s.homeScore);
          const a = ed ? editDrafts[s.id].a : String(s.awayScore);
          return (
            <div key={s.id} className="rounded border border-rivals-border px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap items-center gap-1.5">
                  {teamById(m?.homeTeamId ?? null)?.name}
                  {isApproved ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        aria-label="Marcador local"
                        value={h}
                        onChange={(e) => setEditDrafts((d) => ({ ...d, [s.id]: { h: e.target.value, a: d[s.id]?.a ?? String(s.awayScore) } }))}
                        className="w-12 soft-ring rounded-lg border border-white/10 bg-white/5 px-1 py-0.5 text-center font-mono backdrop-blur-md transition"
                      />
                      <span className="text-slate-500">-</span>
                      <input
                        type="number"
                        min={0}
                        aria-label="Marcador visitante"
                        value={a}
                        onChange={(e) => setEditDrafts((d) => ({ ...d, [s.id]: { h: d[s.id]?.h ?? String(s.homeScore), a: e.target.value } }))}
                        className="w-12 soft-ring rounded-lg border border-white/10 bg-white/5 px-1 py-0.5 text-center font-mono backdrop-blur-md transition"
                      />
                    </>
                  ) : (
                    <span className="font-mono">{s.homeScore}-{s.awayScore}</span>
                  )}
                  {teamById(m?.awayTeamId ?? null)?.name}
                </span>
                <span className={`text-xs font-bold uppercase ${isApproved ? "text-emerald-400" : "text-rose-400"}`}>
                  {s.status}
                </span>
              </div>
              {isApproved && m && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const nh = Number(h);
                      const na = Number(a);
                      editApprovedResult(m.id, Number.isFinite(nh) ? nh : s.homeScore, Number.isFinite(na) ? na : s.awayScore);
                      setEditDrafts((d) => { const n = { ...d }; delete n[s.id]; return n; });
                    }}
                    className="soft-ring rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:brightness-110"
                  >
                    💾 Guardar marcador
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("¿Reabrir este resultado? El partido vuelve a estar pendiente y el capitán puede enviar una corrección.")) {
                        reopenMatch(m.id);
                      }
                    }}
                    className="soft-ring rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-500/40"
                  >
                    ↺ Reabrir
                  </button>
                  {s.submittedBy !== "admin" && (
                    <button
                      onClick={() => openLightbox(s.id)}
                      className="soft-ring rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-rivals-blue transition hover:bg-white/10"
                    >
                      🖼️ Ver evidencia
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {processed.length === 0 && <p className="text-slate-500">Aún no hay resultados procesados.</p>}
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold text-rivals-gold">Temporada 3 — Reinicio</h2>
      <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/5 p-4">
        <p className="text-sm text-slate-300">
          Cierra la Temporada 2 y deja la web lista para la Temporada 3: borra equipos, grupos,
          calendario, resultados y estadísticas (en la nube y en este navegador). Es irreversible —
          descarga lo que necesites antes de continuar.
        </p>
        <button
          disabled={archiving}
          onClick={async () => {
            if (!confirm("¿Borrar TODOS los datos de la Temporada 2 y empezar la Temporada 3 en limpio?")) return;
            if (!confirm("Última confirmación: esto no se puede deshacer. ¿Continuar?")) return;
            setArchiving(true);
            try {
              const ok = await archiveSeason();
              alert(ok ? "✓ Listo. Temporada 3 en limpio." : "⚠️ No se pudo borrar en la nube. Revisa el error arriba.");
            } finally {
              setArchiving(false);
            }
          }}
          className="soft-ring mt-3 rounded-full bg-rose-500/90 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {archiving ? "Borrando…" : "🗑️ Cerrar Temporada 2 y abrir Temporada 3"}
        </button>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify({ registrations, matches, submissions }, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "panama-rivals-temporada-2.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="soft-ring mt-3 ml-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ⬇️ Descargar respaldo (JSON)
        </button>
      </div>
      </div>
      {lightbox && (
        <EvidenceLightbox
          photo={lightbox.photo}
          replay={lightbox.replay}
          replayName={lightbox.replayName}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
