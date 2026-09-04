"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { bracketSeeds, standingsFor } from "@/lib/league";

const groupIds = ["A", "B", "C", "D"];

export default function TournamentPage() {
  const { t } = useI18n();
  const { matches, teamById } = useStore();
  const seeds = bracketSeeds(matches);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">{t("tournament.groups")}</h1>
      <p className="mt-2 text-sm text-slate-400">{t("tournament.legend")}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {groupIds.map((g) => (
          <GroupTable key={g} g={g} />
        ))}
      </div>

      <h2 className="mt-16 font-display text-4xl font-black">{t("tournament.bracket")}</h2>
      <BracketFrame seeds={seeds?.qf} meta={["Quarterfinals · Bo3", "Semifinals · Bo3", "Grand Final · Bo5"]} labels={[["QF1", "QF2", "QF3", "QF4"], ["SF1", "SF2"], ["Final"]]} />
    </div>
  );
}

function GroupTable({ g }: { g: string }) {
  const { matches, teamById } = useStore();
  const rows = standingsFor(g, matches);
  const groupMatches = matches.filter((m) => m.stage === "group" && m.groupId === g);

  return (
    <div className="glass-card rounded-3xl p-5">
      <h2 className="font-display text-lg font-bold text-rivals-gold">Group {g}</h2>
      {groupMatches.length > 0 && (
        <div className="mt-3 space-y-2 border-b border-rivals-border pb-4">
          {groupMatches.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-2 rounded border border-rivals-border/50 px-3 py-2 text-xs"
            >
              <span className="truncate">
                {teamById(m.homeTeamId)?.name ?? "TBD"} <span className="text-slate-500">vs</span>{" "}
                {teamById(m.awayTeamId)?.name ?? "TBD"}
              </span>
              {m.status === "approved" ? (
                <span className="font-mono font-bold text-rivals-gold">
                  {m.homeScore}–{m.awayScore}
                </span>
              ) : m.status === "pending_review" ? (
                <span className="text-amber-400">en revisión</span>
              ) : (
                <Link
                  href={`/report/${encodeURIComponent(m.id)}`}
                  className="shrink-0 soft-ring rounded-full bg-rivals-red px-3 py-1 font-bold text-white shadow-[0_4px_12px_rgba(230,57,70,0.3)] transition hover:brightness-110"
                >
                  Reportar
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-rivals-border text-left text-slate-400">
            <th className="py-1">#</th>
            <th className="py-1">Team</th>
            <th className="py-1">W</th>
            <th className="py-1">L</th>
            <th className="py-1 text-right">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-sm italic text-slate-500">
                Por definirse
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.teamId} className="border-b border-rivals-border/50">
              <td className={`py-2 ${i < 2 ? "font-bold text-rivals-gold" : "text-slate-400"}`}>{i + 1}</td>
              <td className="py-2">{teamById(r.teamId)?.name ?? r.teamId}</td>
              <td className="py-2">{r.w}</td>
              <td className="py-2">{r.l}</td>
              <td className="py-2 text-right font-bold">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BracketFrame({ seeds, meta, labels }: { seeds?: { home: string; away: string }[]; meta: string[]; labels: string[][] }) {
  const { teamById } = useStore();
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      {meta.map((title, col) => (
        <div key={title} className="glass-card rounded-3xl p-5">
          <h3 className="font-display text-md font-bold text-rivals-red">{title}</h3>
          <div className="mt-4 space-y-4">
            {labels[col].map((label, i) => {
              const seed = col === 0 ? seeds?.[i] : undefined;
              const homeName = seed?.home ? teamById(seed.home)?.name : undefined;
              const awayName = seed?.away ? teamById(seed.away)?.name : undefined;
              return (
                <div key={label} className="rounded border border-rivals-border/60 p-3">
                  <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold">
                    {homeName ?? "TBD"} <span className="text-slate-500">vs</span> {awayName ?? "TBD"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
