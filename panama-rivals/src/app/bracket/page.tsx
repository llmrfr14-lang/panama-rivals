"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { placementFor, Division } from "@/lib/league";
import { useI18n } from "@/lib/i18n";
import { Match } from "@/lib/types";

const CHECK_IN_MS = 15 * 60 * 1000;
const myTeamKey = "pr-my-team";

function fmtClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BracketPage() {
  const { t } = useI18n();
  const { matches, teamById, registrations, checkInTeam } = useStore();
  const [div, setDiv] = useState<Division>("challenger");
  const [myTeam, setMyTeam] = useState<string>("");
  const [now, setNow] = useState(Date.now());



  useEffect(() => {
    const saved = localStorage.getItem(myTeamKey);
    if (saved) setMyTeam(saved);
  }, []);

  const myTeams = useMemo(() => {
    const divRegs = registrations.filter((r) => r.division === div);
    const seen = new Set<string>();
    return divRegs.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return Boolean(r.groupId); });
  }, [registrations, div]);

  useEffect(() => {
    if (myTeam && !myTeams.some((r) => r.id === myTeam)) setMyTeam("");
  }, [myTeam, myTeams]);

  const divMatches = useMemo(() => matches.filter((m) => m.groupId === div && m.stage !== "group"), [matches, div]);
  const qf = useMemo(() => divMatches.filter((m) => m.stage === "qf").sort((a, b) => a.id.localeCompare(b.id)), [divMatches]);
  const sf = useMemo(() => divMatches.filter((m) => m.stage === "sf").sort((a, b) => a.id.localeCompare(b.id)), [divMatches]);
  const fin = useMemo(() => divMatches.find((m) => m.stage === "f"), [divMatches]);
  const ranking = useMemo(() => placementFor(div, matches, registrations), [div, matches, registrations]);

  // Countdown ticker while the page is open.

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()),  1000);
    return () => clearInterval(id);
  }, []);

  const nextMatch = useMemo(() => {
    if (!myTeam) return null;
    return [...qf, ...sf, ...(fin ? [fin] : [])].find((m) =>
      (m.homeTeamId === myTeam || m.awayTeamId === myTeam) && m.status !== "approved" && m.status !== "ff"
    );
  }, [qf, sf, fin, myTeam]);


  const setTeam = (id: string) => {
    setMyTeam(id);
    localStorage.setItem(myTeamKey, id);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">{t("nav.bracket")}</h1>
      <p className="mt-2 max-w-2xl text-slate-400">{t("bracket.sub")}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          {(["challenger", "elite"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDiv(d)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${div === d ? "bg-rivals-red text-white shadow-[0_4px_16px_rgba(230,57,70,0.35)]" : "text-slate-300 hover:text-white"}`}
            >
              {d === "challenger" ? "🛡️ Challenger" : "⚡ Elite"}
            </button>
          ))}
        </div>
        <select
          value={myTeam}
          onChange={(e) => setTeam(e.target.value)}
          className="soft-ring rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-md transition focus:border-white/20"
        >
          <option value="">{t("bracket.myTeam")}</option>
          {myTeams.map((r) => (
            <option key={r.id} value={r.id}>{r.teamName}</option>
          ))}
        </select>
      </div>

      {nextMatch && (
        <div className="mt-6 rounded-2xl border border-rivals-gold/40 bg-rivals-gold/10 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-rivals-gold">{t("bracket.nextUp")}</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {teamById(nextMatch.homeTeamId)?.name ?? "TBD"} {" "}<span className="text-slate-500">vs</span>{" "}
            {teamById(nextMatch.awayTeamId)?.name ?? "TBD"}
          </p>
          {nextMatch.scheduledAt && (
            <p className="mt-1 text-sm text-slate-400">
              {t("bracket.startsAt")} {" "}{new Date(nextMatch.scheduledAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}
            </p>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {qf.length > 0 && <BracketColumn title={t("div.qf")} matches={qf} teamById={teamById} myTeam={myTeam} now={now} onCheckIn={checkInTeam} />}
        {sf.length > 0 && <BracketColumn title={t("div.semis")} matches={sf} teamById={teamById} myTeam={myTeam} now={now} onCheckIn={checkInTeam} />}
        {(fin && (qf.length > 0 || sf.length === 0)) && <BracketColumn title={t("div.final")} matches={fin ? [fin] : []} teamById={teamById} myTeam={myTeam} now={now} onCheckIn={checkInTeam} />}
      </div>

      {qf.length === 0 && sf.length === 0 && !fin && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="emoji text-4xl">🏆</p>
          <p className="mt-3 font-semibold text-white">{t("bracket.emptyTitle")}</p>
          <p className="mt-1 text-sm text-slate-400">{t("bracket.emptyBody")}</p>
        </div>
      )}

      {ranking.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-3xl font-black text-rivals-gold">{t("bracket.ranking")}</h2>
          <p className="mt-1 text-sm text-slate-400">{t("bracket.rankingSub")}</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-rivals-border">
            <table className="w-full text-sm">
              <thead className="bg-white/2 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-right">{t("bracket.pts")}</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.teamId} className="border-t border-rivals-border/50">
                    <td className="px-4 py-3 text-slate-400">{r.label}</td>
                    <td className="px-4 py-3 font-semibold">{teamById(r.teamId)?.name ?? r.teamId}</td>
                    <td className="px-4 py-3 text-right font-bold text-rivals-gold">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-12 text-center text-sm text-slate-500">
        {t("bracket.reportHint")} {" "}
        <Link href="/tournament" className="text-rivals-blue hover:underline">{t("nav.tournament")}</Link>
      </p>
    </div>
  );
}

function BracketColumn({ title, matches, teamById, myTeam, now, onCheckIn }: {
  title: string;
  matches: Match[];
  teamById: (id: string | null) => { name: string } | null;
  myTeam: string;
  now: number;
  onCheckIn:((matchId: string, teamId: string) => void);
}) {
  const { t } = useI18n();
  return (
    <div className="glass-card rounded-3xl p-5">
      <h3 className="font-display text-md font-bold text-rivals-red">{title}</h3>
      <div className="mt-4 space-y-4">
        {matches.map((m) => {
          const home = teamById(m.homeTeamId)?.name ?? "TBD";
          const away = teamById(m.awayTeamId)?.name ?? "TBD";
          const isMine = Boolean(myTeam) && (m.homeTeamId === myTeam || m.awayTeamId === myTeam);
          const checked = m.checkedIn;
          const deadline = m.scheduledAt ? m.scheduledAt + CHECK_IN_MS : null;
          const open = Boolean(m.scheduledAt && m.scheduledAt <= now && (m.status === "scheduled" || m.status === "checked_in"));
          const ff = m.status === "ff";

          return (
            <div key={m.id} className={`rounded border p-3 ${isMine ? "border-rivals-gold/60 bg-rivals-gold/5" : "border-rivals-border/60"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">
                  {home} <span className="text-slate-500">vs</span> {away}
                </p>
                {isMine && <span className="shrink-0 rounded-full bg-rivals-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rivals-gold">Tu</span>}
              </div>

              {m.status === "approved" ? (
                <p className="mt-2 font-mono font-bold text-rivals-gold">{m.homeScore}–{m.awayScore}</p>
              ) : m.status === "pending_review" ? (
                <p className="mt-2 text-xs text-amber-400">{t("div.reviewing")}</p>
              ) : ff ? (
                <p className="mt-2 text-xs font-bold text-rose-400">
                  {m.ffWinner === m.homeTeamId ? home : away} {t("bracket.winsByFF")}
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {open && (
                    <>
                      {(m.homeTeamId || m.awayTeamId) && (
                        <div className="flex gap-2">
                          {[m.homeTeamId, m.awayTeamId].map((tid) => tid && (
                            <button
                              key={tid}
                              onClick={() => onCheckIn(m.id, tid)}
                              disabled={checked === tid || m.status === "ff"}
                              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${checked === tid ? "bg-emerald-500/90 text-white" : "bg-rivals-blue text-white hover:brightness-110"}`}
                            >
                              {checked === tid ? "✓ " + (teamById(tid)?.name ?? "Team") + " listo" : "✓ " + (teamById(tid)?.name ?? "Team")}
                            </button>
                          ))}
                        </div>
                      )}
                      {deadline && deadline > now && (
                        <p className="text-xs text-slate-400">
                          ⏳ {t("bracket.ffIn")} {fmtClock(deadline - now)}
                        </p>
                      )}
                    </>
                  )}
                  {m.scheduledAt && m.scheduledAt > now && (
                    <p className="text-xs text-slate-500">
                      {t("bracket.startsAt")} {new Date(m.scheduledAt).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}
                    </p>
                  )}
                  {m.status === "checked_in" && !open && (
                    <p className="text-xs text-emerald-400">{t("bracket.checkInDone")}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}