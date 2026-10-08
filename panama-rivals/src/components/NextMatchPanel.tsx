"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Division } from "@/lib/league";
import { useI18n } from "@/lib/i18n";

const myTeamKey = "pr-my-team";

export default function NextMatchPanel({ division, titleLabel }: { division: Division; titleLabel: string }) {
  const { t, lang } = useI18n();
  const { matches, registrations, teamById } = useStore();
  const [myTeam, setMyTeam] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(myTeamKey);
    if (saved) setMyTeam(saved);
  }, []);

  const myRegs = useMemo(() => {
    const seen = new Set<string>();
    return registrations.filter((r) =>
      r.division === division &&
      (r.groupId || r.id) &&
      !seen.has(r.id) && !!seen.add(r.id)
    );
  }, [registrations, division]);

  useEffect(() => {
    if (myTeam && !myRegs.some((r) => r.id === myTeam)) setMyTeam("");
  }, [myTeam, myRegs]);

  const nextMatch = useMemo(() => {
    if (!myTeam) return null;
    return matches
      .filter((m) => (m.homeTeamId === myTeam || m.awayTeamId === myTeam) && m.status !== "approved" && m.status !== "ff")
      .sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || a.id.localeCompare(b.id))
      .find(() => true);
  }, [matches, myTeam]);

  const gameCount = useMemo(() =>
    matches.filter((m) => (m.homeTeamId === myTeam || m.awayTeamId === myTeam) && m.status !== "approved" && m.status !== "ff").length,
  [matches, myTeam]);

  if (myRegs.length === 0) return null;

  const home = nextMatch ? teamById(nextMatch.homeTeamId)?.name ?? "TBD" : "";
  const away = nextMatch ? teamById(nextMatch.awayTeamId)?.name ?? "TBD" : "";

  return (
    <div className="mt-6 rounded-2xl border border-rivals-gold/40 bg-rivals-gold/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-rivals-gold">{titleLabel}</p>
          {nextMatch ? (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold text-white">
              <span className="truncate">{home}</span>
              <span className="text-slate-500">vs</span>
              <span className="truncate">{away}</span>
              {typeof nextMatch.round === "number" && (
                <span className="rounded-full bg-rivals-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rivals-gold">
                  {t("div.matchday")} {nextMatch.round}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              {t("div.noNext")}
            </p>
          )}
        </div>

        <select
          value={myTeam}
          onChange={(e) => {
            const v = e.target.value;
            setMyTeam(v);
            if (v) localStorage.setItem(myTeamKey, v); else localStorage.removeItem(myTeamKey);
          }}
          className="soft-ring rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-md transition focus:border-white/20"
        >
          <option value="">{t("bracket.myTeam")}</option>
          {myRegs.map((r) => (
            <option key={r.id} value={r.id}>{r.teamName}</option>
          ))}
        </select>
      </div>

      {gameCount >  1 && (
        <p className="mt-3 text-xs text-slate-500">
          {gameCount} {t("bracket.moreMatches")}
        </p>
      )}
    </div>
  );
}