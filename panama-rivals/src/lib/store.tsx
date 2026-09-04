"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Match, Player, StatLine, Submission, Team } from "./types";
import { initialMatches, players as seedPlayers, teams as seedTeams } from "./seed";
import { divisionForRank, Division, teamDivision } from "./league";
import { getSupabase } from "./supabase/client";

export type RivalContact = {
  discord: string;
  epicId: string;
  phone?: string; // captain only
};

export type PlayerInfo = {
  discord: string;
  epicId: string;
  phone: string; // "NA" when 2v2 3rd slot
  nationality: "pa" | "int" | "na";
  peakRank: string; // "NA" when 2v2 3rd slot
};

export type RegistrationStatus = "pending" | "approved" | "declined";

export type Registration = {
  id: string;
  teamName: string;
  captain: RivalContact;
  players: PlayerInfo[]; // exactly 3 — third is "NA" when 2v2
  division?: Division; // challenger (≤C2) | elite (≥C3) — derived from best player rank
  groupId: string | null; // namespaced per division: "ch-A", "el-A", …
  status: RegistrationStatus; // pending default — admin aprueba/declina el equipo
  createdAt: number;
};

type Store = {
  matches: Match[];
  submissions: Submission[];
  registrations: Registration[];
  registerTeam: (teamName: string, captain: RivalContact, players: PlayerInfo[]) => Registration;
  assignGroup: (registrationId: string, groupId: string | null) => void;
  reviewRegistration: (registrationId: string, status: RegistrationStatus) => void;
  generateSchedule: () => void;
  submitResult: (
    matchId: string,
    submittedBy: string,
    homeScore: number,
    awayScore: number,
    stats: StatLine[],
    photo?: string
  ) => void;
  approve: (submissionId: string) => void;
  decline: (submissionId: string, note?: string) => void;
  teamById: (id: string | null) => Team | null;
  playerById: (id: string) => Player | undefined;
  rosterOf: (teamId: string | null) => Player[];
  reportToken: (matchId: string, side: "home" | "away") => string;
  isValidReportToken: (matchId: string, token: string) => boolean;
  resetData: () => void;
};

const StoreContext = createContext<Store | null>(null);
// v3: Season 2 pipeline — registrations, draw, schedule, token-gated report, approval.
const LS_KEY = "panama-rivals-v3";

type Persisted = {
  matches: Match[];
  submissions: Submission[];
  registrations: Registration[];
};

function shortToken(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 6);
}

function groupMatchesFor(registrations: Registration[], groupId: string): Match[] {
  const ids = registrations
    .filter((r) => r.groupId === groupId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((r) => r.id);
  const out: Match[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      out.push({
        id: `${groupId}-${i}-${j}`,
        stage: "group",
        groupId,
        homeTeamId: ids[i],
        awayTeamId: ids[j],
        homeScore: 0,
        awayScore: 0,
        status: "scheduled",
        stats: [],
      });
    }
  }
  return out;
}

// ---- Supabase row mappers ----
function regFromRow(r: any): Registration {
  return {
    id: r.id,
    teamName: r.team_name,
    captain: r.captain ?? { discord: "", epicId: "" },
    players: r.players ?? [],
    division: r.division ?? "challenger",
    groupId: r.group_id ?? null,
    status: r.status ?? "pending",
    createdAt: Number(r.created_at),
  };
}
function matchFromRow(r: any): Match {
  return { id: r.id, stage: r.stage, groupId: r.group_id ?? undefined, homeTeamId: r.home_team_id, awayTeamId: r.away_team_id, homeScore: r.home_score, awayScore: r.away_score, status: r.status, stats: r.stats ?? [] };
}
function subFromRow(r: any): Submission {
  return { id: r.id, matchId: r.match_id, submittedBy: r.submitted_by, homeScore: r.home_score, awayScore: r.away_score, stats: r.stats ?? [], status: r.status, note: r.note ?? undefined, photo: r.photo ?? undefined, createdAt: Number(r.created_at) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<Persisted>({
    matches: initialMatches,
    submissions: [],
    registrations: [],
  });

  const sb = typeof window !== "undefined" ? getSupabase() : null;

  // Load: Supabase first, localStorage as offline fallback.
  // `hydrated` gates localStorage writes so an empty initial render
  // can't stomp data before the remote fetch resolves.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sb) {
        try {
          const [regs, ms, subs] = await Promise.all([
            sb.from("registrations").select("*").order("created_at"),
            sb.from("matches").select("*"),
            sb.from("submissions").select("*").order("created_at"),
          ]);
          if (!cancelled && regs.data && ms.data && subs.data) {
            setState({
              registrations: regs.data.map(regFromRow),
              matches: ms.data.map(matchFromRow),
              submissions: subs.data.map(subFromRow),
            });
            setHydrated(true);
            return;
          }
        } catch { /* fall through to localStorage */ }
      }
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw && !cancelled) setState(JSON.parse(raw));
      } catch { /* first visit or corrupt state */ }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist locally always — but only after hydration
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state, hydrated]);

  // Realtime: another browser changes data → merge into our state
  useEffect(() => {
    if (!sb) return;
    const channel = sb
      .channel("panama-rivals")
      .on("postgres_changes", { event: "*", schema: "public", table: "registrations" }, () => {
        sb.from("registrations").select("*").order("created_at").then(({ data }) => {
          if (data) setState((s) => ({ ...s, registrations: data.map(regFromRow) }));
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        sb.from("matches").select("*").then(({ data }) => {
          if (data) setState((s) => ({ ...s, matches: data.map(matchFromRow) }));
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "submissions" }, () => {
        sb.from("submissions").select("*").order("created_at").then(({ data }) => {
          if (data) setState((s) => ({ ...s, submissions: data.map(subFromRow) }));
        });
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upsertReg = (r: Registration) => {
    if (!sb) return;
    sb.from("registrations").upsert({ id: r.id, team_name: r.teamName, captain: r.captain, players: r.players, division: r.division ?? "challenger", group_id: r.groupId, status: r.status ?? "pending", created_at: r.createdAt }).then(() => {});
  };
  const upsertMatch = (m: Match) => {
    if (!sb) return;
    sb.from("matches").upsert({ id: m.id, stage: m.stage, group_id: m.groupId ?? null, home_team_id: m.homeTeamId, away_team_id: m.awayTeamId, home_score: m.homeScore, away_score: m.awayScore, status: m.status, stats: m.stats }).then(() => {});
  };
  const upsertSub = (s: Submission) => {
    if (!sb) return;
    sb.from("submissions").upsert({ id: s.id, match_id: s.matchId, submitted_by: s.submittedBy, home_score: s.homeScore, away_score: s.awayScore, stats: s.stats, status: s.status, note: s.note ?? null, photo: s.photo ?? null, created_at: s.createdAt }).then(() => {});
  };

  const registerTeam: Store["registerTeam"] = (teamName, captain, players) => {
    const division = players.some((p) => divisionForRank(p.peakRank) === "elite") ? "elite" : "challenger";
    const reg: Registration = {
      id: `reg-${Date.now()}`,
      teamName,
      captain,
      players,
      division,
      groupId: null,
      status: "pending",
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, registrations: [...s.registrations, reg] }));
    upsertReg(reg);
    return reg;
  };

  const assignGroup: Store["assignGroup"] = (registrationId, groupId) => {
    setState((s) => {
      const next = s.registrations.map((r) => (r.id === registrationId ? { ...r, groupId } : r));
      const changed = next.find((r) => r.id === registrationId);
      if (changed) upsertReg(changed);
      return { ...s, registrations: next };
    });
  };

  const reviewRegistration: Store["reviewRegistration"] = (registrationId, status) => {
    setState((s) => {
      const next = s.registrations.map((r) => (r.id === registrationId ? { ...r, status } : r));
      const changed = next.find((r) => r.id === registrationId);
      if (changed) upsertReg(changed);
      return { ...s, registrations: next };
    });
  };

  const generateSchedule: Store["generateSchedule"] = () => {
    setState((s) => {
      const keep = s.matches.filter((m) => m.status !== "scheduled");
      const keptIds = new Set(keep.map((m) => m.id));
      const divisions: Division[] = ["challenger", "elite"];
      const fresh = divisions.flatMap((div) =>
        ["A", "B", "C", "D"].flatMap((g) => groupMatchesFor(s.registrations, `${div}-${g}`))
      );
      const merged = [...keep, ...fresh.filter((m) => !keptIds.has(m.id))];
      fresh.forEach(upsertMatch);
      return { ...s, matches: merged };
    });
  };

  const submitResult: Store["submitResult"] = (matchId, submittedBy, homeScore, awayScore, stats, photo?) => {
    const sub: Submission = {
      id: `sub-${Date.now()}`,
      matchId,
      submittedBy,
      homeScore,
      awayScore,
      stats,
      status: "pending",
      photo,
      createdAt: Date.now(),
    };
    setState((s) => ({
      ...s,
      submissions: [...s.submissions, sub],
      matches: s.matches.map((m) => (m.id === matchId ? { ...m, status: "pending_review" } : m)),
    }));
    upsertSub(sub);
    const m = state.matches.find((x) => x.id === matchId);
    if (m) upsertMatch({ ...m, status: "pending_review" });
  };

  const approve = (submissionId: string) => {
    const sub = state.submissions.find((x) => x.id === submissionId);
    if (!sub) return;
    const approvedSub = { ...sub, status: "approved" as const };
    const match = state.matches.find((m) => m.id === sub.matchId);
    setState((s) => ({
      ...s,
      submissions: s.submissions.map((x) => (x.id === submissionId ? approvedSub : x)),
      matches: s.matches.map((m) =>
        m.id === sub.matchId
          ? { ...m, homeScore: sub.homeScore, awayScore: sub.awayScore, stats: sub.stats, status: "approved" }
          : m
      ),
    }));
    upsertSub(approvedSub);
    if (match) upsertMatch({ ...match, homeScore: sub.homeScore, awayScore: sub.awayScore, stats: sub.stats, status: "approved" });
  };

  const decline = (submissionId: string, note?: string) => {
    const sub = state.submissions.find((x) => x.id === submissionId);
    if (!sub) return;
    const declinedSub = { ...sub, status: "declined" as const, note };
    const match = state.matches.find((m) => m.id === sub.matchId);
    setState((s) => ({
      ...s,
      submissions: s.submissions.map((x) => (x.id === submissionId ? declinedSub : x)),
      matches: s.matches.map((m) => (m.id === sub.matchId ? { ...m, status: "declined" } : m)),
    }));
    upsertSub(declinedSub);
    if (match) upsertMatch({ ...match, status: "declined" });
  };

  const teamById: Store["teamById"] = (id) => {
    if (!id) return null;
    const staticTeam = seedTeams.find((t) => t.id === id);
    if (staticTeam) return staticTeam;
    const reg = state.registrations.find((r) => r.id === id);
    if (!reg) return null;
    return { id: reg.id, name: reg.teamName, captainId: `cap-${reg.id}`, groupId: reg.groupId ?? "" };
  };

  const playerById: Store["playerById"] = (id) => {
    const seeded = seedPlayers.find((p) => p.id === id);
    if (seeded) return seeded;
    for (const reg of state.registrations) {
      const match = reg.players.find((p) => p.discord === id || p.epicId === id);
      if (match) return { id, handle: [match.discord, match.epicId].filter(Boolean).join(" / "), teamId: reg.id };
    }
    return undefined;
  };

  const rosterOf: Store["rosterOf"] = (teamId) => {
    if (!teamId) return [];
    const staticRoster = seedPlayers.filter((p) => p.teamId === teamId);
    if (staticRoster.length > 0) return staticRoster;
    const reg = state.registrations.find((r) => r.id === teamId);
    if (!reg) return [];
    return reg.players.map((p) => ({ id: p.discord || p.epicId, handle: [p.discord, p.epicId].filter(Boolean).join(" / "), teamId: reg.id }));
  };

  // NOTE: tokens derive from matchId only. Fine while local; once Supabase
  // is live, anyone can compute them. Real captain auth needs Discord OAuth
  // or server-issued per-match secrets — see README before Season 2 go-live.
  const reportToken: Store["reportToken"] = (matchId, side) => shortToken(`${matchId}:${side}:cap`);

  const isValidReportToken: Store["isValidReportToken"] = (matchId, token) => {
    const t = token.trim().toLowerCase();
    return t === reportToken(matchId, "home") || t === reportToken(matchId, "away");
  };

  const resetData = () => {
    localStorage.removeItem(LS_KEY);
    setState({ matches: initialMatches, submissions: [], registrations: [] });
  };

  return (
    <StoreContext.Provider
      value={{
        matches: state.matches,
        submissions: state.submissions,
        registrations: state.registrations,
        registerTeam,
        assignGroup,
        generateSchedule,
        submitResult,
        approve,
        reviewRegistration,
        decline,
        teamById,
        playerById,
        rosterOf,
        reportToken,
        isValidReportToken,
        resetData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
