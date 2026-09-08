"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function ReportPage() {
  const params = useParams<{ matchId: string }>();
  const search = useSearchParams();
  const matchId = decodeURIComponent(params.matchId);

  const {
    matches,
    teamById,
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
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [replay, setReplay] = useState<string | null>(null);
  const [replayName, setReplayName] = useState("");

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setPhoto(null); setPhotoError(false); return; }
    if (!file.type.startsWith("image/")) { setPhotoError(true); return; }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(String(reader.result)); setPhotoError(false); };
    reader.readAsDataURL(file);
  };

  const onReplay = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setReplay(null); setReplayName(""); return; }
    if (!file.name.toLowerCase().endsWith(".replay")) { setReplay(null); setReplayName(""); return; }
    const reader = new FileReader();
    reader.onload = () => { setReplay(String(reader.result)); setReplayName(file.name); };
    reader.readAsDataURL(file);
  };

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

  const [h, a] = score.split(":").map(Number);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo && !replay) {
      setPhotoError(true);
      return;
    }
    // Los capitanes solo reportan el marcador + evidencia (foto o replay);
    // las stats individuales las cargan los admins al aprobar.

    submitResult(matchId, "captain", h || 0, a || 0, [], photo ?? undefined, replay ?? undefined);
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
          <p className="text-sm text-slate-400">
            Las estadísticas individuales las cargan los admins al aprobar — no necesitas llenarlas aqui..
          </p>
        </div>
        <label className="block">
          <span className="text-sm text-slate-400">Foto del marcador final（opcional si subes replay; TODOS los jugadores deben aparecer en la foto)</span>
          <input
            type="file"
            accept="image/*"
            onChange={onPhoto}
            className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur-md transition file:mr-3 file:rounded-full file:border-0 file:bg-rivals-blue file:px-4 file:py-2 file:text-white"
          />
          {photo && (
            <img src={photo} alt="Marcador final" className="mt-2 h-24 w-auto rounded-lg border border-white/10 object-contain" />
          )}
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">Replay del partido (.replay — opcional si subes foto)</span>
          <input
            type="file"
            accept=".replay"
            onChange={onReplay}
            className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur-md transition file:mr-3 file:rounded-full file:border-0 file:bg-rivals-blue file:px-4 file:py-2 file:text-white"
          />
          {replayName && (
            <p className="mt-1 text-xs text-emerald-300">✓ {replayName}</p>
          )}
        </label>
        {photoError && (
          <p className="text-xs text-rose-400">Sube una foto del marcador final o un archivo .replay para enviar el resultado..</p>
        )}
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
