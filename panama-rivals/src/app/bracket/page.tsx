"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { placementFor, Division } from "@/lib/league";
import { useI18n } from "@/lib/i18n";
import { BracketTree } from "@/components/BracketTree";
import { BracketSkeleton } from "@/components/Skeleton";

const myTeamKey = "pr-my-team";
const divKey = "pr-div";

export default function BracketPage() {
  const { t } = useI18n();
  const { matches, teamById, registrations, checkInTeam, hydrated } = useStore();
  const [div, setDiv] = useState<Division>(() => {
    if (typeof window === "undefined") return "challenger";
    const saved = window.localStorage.getItem(divKey) as Division | null;
    return saved === "elite" ? "elite" : "challenger";
  });
  const [myTeam, setMyTeam] = useState<string>("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("div");
    if (fromQuery === "challenger" || fromQuery === "elite") {
      setDiv(fromQuery);
      window.localStorage.setItem(divKey, fromQuery);
    }
  }, []);

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
              onClick={() => {
              setDiv(d);
              window.localStorage.setItem(divKey, d);
            }}
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

      {!hydrated ? (
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <BracketSkeleton />
        </div>
      ) : qf.length > 0 || sf.length > 0 || fin ? (
        <div key={div} className="fade-slide">
          <BracketTree
            qf={qf}
            sf={sf}
            fin={fin}
            teamById={teamById}
            myTeam={myTeam}
            now={now}
            onCheckIn={checkInTeam}
            titles={{ qf: t("div.qf"), sf: t("div.semis"), fin: t("div.final") }}
          />
        </div>
      ) : (
        <div className="fade-slide mt-10 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
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
                {ranking.map((r) => {
                  const rec = registrations.find((x) => x.id === r.teamId);
                  const g = rec?.groupId?.split("-")[1] ?? "";
                  const dLabel = div === "elite" ? "⚡ Elite" : "🛡️ Challenger";
                  return (
                    <tr key={r.teamId} className="group relative border-t border-rivals-border/50 transition hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-400">{r.label}</td>
                      <td className="relative px-4 py-3 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          {teamById(r.teamId)?.name ?? r.teamId}
                        </span>
                        <div className="pointer-events-none invisible absolute right-2 top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#0b111c]/95 px-4 py-3 text-xs shadow-2xl opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                          <p className="font-bold text-white">{teamById(r.teamId)?.name ?? r.teamId}</p>
                          <p className="mt-1 text-slate-400">
                            {dLabel}{g ? ` · Grupo ${g.toUpperCase()}` : ""}
                          </p>
                          <p className="mt-1 font-semibold text-rivals-gold">{r.points} PTS</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rivals-gold">{r.points}</td>
                    </tr>
                  );
                })}
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
