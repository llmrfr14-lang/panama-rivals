"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function SubmitPage() {
  const { t } = useI18n();
  const { matches, submissions, teamById } = useStore();

  const reportable = matches.filter(
    (m) => m.stage === "group" && (m.status === "scheduled" || m.status === "declined")
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">{t("submit.title")}</h1>
      <p className="mt-2 text-slate-400">
        Solo los capitanes reportan resultados — cada partido tiene su botón de reporte y la admin
        aprueba antes de que cuente en standings y stats.
      </p>

      {reportable.length === 0 ? (
        <div className="mt-10 glass-card glass-dashed rounded-3xl p-10 text-center">
          <span className="emoji text-4xl">🕖</span>
          <p className="mt-4 font-display text-xl font-bold text-rivals-gold">Nada que reportar todavía</p>
          <p className="mt-2 text-sm text-slate-400">
            Los partidos aparecen aquí el día del torneo. Está atento al Discord.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Matches show up here on tournament day. Keep an eye on Discord.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-3">
          {reportable.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 glass-card rounded-3xl px-4 py-3"
            >
              <span className="text-sm font-semibold">
                {teamById(m.homeTeamId)?.name} <span className="text-slate-500">vs</span>{" "}
                {teamById(m.awayTeamId)?.name}
                <span className="ml-2 text-xs uppercase tracking-widest text-slate-500">
                  Grupo {m.groupId}
                </span>
              </span>
              <Link
                href={`/report/${encodeURIComponent(m.id)}`}
                className="soft-ring shrink-0 rounded-full bg-rivals-red px-3 py-1.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(230,57,70,0.3)] transition hover:brightness-110"
              >
                Reportar resultado
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <p className="font-display font-bold text-rivals-gold">Envíos recientes</p>
        <div className="mt-3 space-y-2 text-sm">
          {submissions.slice(-5).reverse().map((s) => {
            const m = matches.find((x) => x.id === s.matchId);
            return (
              <div key={s.id} className="flex items-center justify-between rounded border border-rivals-border px-3 py-2">
                <span>
                  {teamById(m?.homeTeamId ?? null)?.name} {s.homeScore}-{s.awayScore}{" "}
                  {teamById(m?.awayTeamId ?? null)?.name}
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-500">{s.status}</span>
              </div>
            );
          })}
          {submissions.length === 0 && <p className="text-slate-500">Nada enviado aún.</p>}
        </div>
      </div>
    </div>
  );
}
