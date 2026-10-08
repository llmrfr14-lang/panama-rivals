"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Match, Player, Stage, StatLine, Submission, Team } from "./types";
import { initialMatches, players as seedPlayers, teams as seedTeams } from "./seed";
import { bracketSeeds, bracketWinner, divisionForRank, Division, roundRobinRounds, teamDivision } from "./league";
import { getSupabase } from "./supabase/client";

export type RivalContact = {
  discord: string;
  epicId: string;
  /** Platform the player competes on: "epic" | "steam" | "psn" | "xbox" | "switch". */
  platform?: string;
  /** That platform's own handle (PSN ID, Xbox gamertag, Steam profile, Switch code). */
  platformId?: string;
  phone?: string; // captain only
};

export type PlayerInfo = {
  discord: string;
  epicId: string;
  /** Platform the player competes on: "epic" | "steam" | "psn" | "xbox" | "switch". */
  platform?: string;
  /** That platform's own handle (PSN ID, Xbox gamertag, Steam profile, Switch code). */
  platformId?: string;
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
  supabaseConfigured: boolean;
  hydrated: boolean;
  lastSyncError: string | null;
  registerTeam: (teamName: string, captain: RivalContact, players: PlayerInfo[]) => Registration;
  assignGroup: (registrationId: string, groupId: string | null) => void;
  reviewRegistration: (registrationId: string, status: RegistrationStatus) => void;
  deleteRegistration: (registrationId: string) => void;
  generateSchedule: () => void;
  generateBracket: (division: Division, startAt?: number) => void;
  submitResult:(
    matchId: string,
    submittedBy: string,
    homeScore: number,
    awayScore: number,
    stats?: StatLine[],
    photo?: string,
    replay?: string
  ) => void;
  approve: (submissionId: string, stats?: StatLine[], homeScore?: number, awayScore?: number) => void;
  decline: (submissionId: string, note?: string) => void;
  /** Admin: fix the score on a still-pending report before approving it. */
  updateSubmissionScore: (submissionId: string, homeScore: number, awayScore: number) => void;
  /** Admin: undo an approval and send the match back for a corrected report. */
  reopenMatch: (matchId: string) => void;
  /** Admin: directly overwrite an approved match's score (and clear a stale pending report). */
  editApprovedResult: (matchId: string, homeScore: number, awayScore: number) => void;
  /** Admin: wipe every registration/match/submission (cloud + local) to open a new season. */
  archiveSeason: () => Promise<boolean>;
  fetchSubmissionEvidence: (submissionId: string) => Promise<{ photo?: string; replay?: string } | null>;
  teamById: (id: string | null) => Team | null;
  playerById: (id: string) => Player | undefined;
  rosterOf: (teamId: string | null) => Player[];
  
  resetData: () => void;
};

const StoreContext = createContext<Store | null>(null);
// v3: Season 2 pipeline — registrations, draw, schedule, report, approval.
const LS_KEY = "panama-rivals-v3";

type Persisted = {
  matches: Match[];
  submissions: Submission[];
  registrations: Registration[];
  /** Division-state keys (e.g. "bracket-regen-challenger") that the cloud flagged as needing regeneration. */
  bracketRegen: string[];
};


function groupMatchesFor(registrations: Registration[], groupId: string): Match[] {
  const ids = registrations
    .filter((r) => r.groupId === groupId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((r) => r.id);
  // Round-robin order: matchday N pairs teams that are all free that jornada, so
  // no team is booked twice at once. Pair ids stay keyed by the two team indices
  // so re-generating after an admin reorders/registers teams doesn't collide.
  const pairs = roundRobinRounds(ids);
  return pairs.map((p) => {
    const i = ids.indexOf(p.home);
    const j = ids.indexOf(p.away);
    const [lo, hi] = i < j ? [i, j] : [j, i];
    return {
      id: `${groupId}-${lo}-${hi}`,
      stage: "group",
      groupId,
      homeTeamId: p.home,
      awayTeamId: p.away,
      homeScore: 0,
      awayScore: 0,
      status: "scheduled",
      stats: [],
      round: p.round,
    } as Match;
  });
}

// ---- Supabase row mappers ----
function regFromRow(r: any): Registration {
  // captain may come back as a JSON string from older (text-column) rows
  const captain =
    typeof r.captain === "object" && r.captain !== null
      ? r.captain
      : typeof r.captain === "string"
        ? (() => { try { return JSON.parse(r.captain); } catch { return { discord: r.captain }; } })()
        : { discord: "", epicId: "" };
  return {
    id: r.id,
    teamName: r.team_name,
    captain,
    players: r.players ?? [],
    division: r.division ?? "challenger",
    groupId: r.group_id ?? null,
    status: r.status ?? "pending",
    createdAt: Number(r.created_at),
  };
}
function matchFromRow(r: any): Match {
  return {
    id: r.id,
    stage: r.stage,
    groupId: r.group_id ?? undefined,
    homeTeamId: r.home_team_id,
    awayTeamId: r.away_team_id,
    homeScore: r.home_score,
    awayScore: r.away_score,
    status: r.status,
    stats: r.stats ?? [],
    scheduledAt: r.scheduled_at ?? undefined,
    ffWinner: r.ff_winner ?? null,
    round: r.round_number ?? undefined,
  };
}
function subFromRow(r: any): Submission {
  return { id: r.id, matchId: r.match_id, submittedBy: r.submitted_by, homeScore: r.home_score, awayScore: r.away_score, stats: r.stats ?? [], status: r.status, note: r.note ?? undefined, photo: r.photo ?? undefined, replay: r.replay ?? undefined, createdAt: Number(r.created_at) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<Persisted>({
    matches: initialMatches,
    submissions: [],
    registrations: [],
    bracketRegen: [],
  });
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const setSyncError = (msg: string) => {
    console.error("supabase write failed:", msg);
    setLastSyncError(msg);
  };

  const sb = typeof window !== "undefined" ? getSupabase() : null;

  // Load: Supabase first, localStorage as offline fallback.
  // `hydrated` gates localStorage writes so an empty initial render
  // can't stomp data before the remote fetch resolves.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sb) {
        try {
          const [regs, ms, subs, flags] = await Promise.all([
            sb.from("registrations").select("*").order("created_at"),
            sb.from("matches").select("*"),
            sb.from("submissions").select("id, match_id, submitted_by, home_score, away_score, stats, status, note, created_at").order("created_at"),
            sb.from("bracket_state").select("key").ilike("key", "bracket-regen-%"),
          ]);
          if (!cancelled && regs.data && ms.data && subs.data) {
            setState({
              registrations: regs.data.map(regFromRow),
              matches: ms.data.map(matchFromRow),
              submissions: subs.data.map(subFromRow),
              bracketRegen: (flags.data ?? []).map((f: { key: string }) => f.key),
            });
            setHydrated(true);
            return;
          }
        } catch { /* fall through to localStorage */ }
      }
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as Persisted;
          setState({ ...parsed, bracketRegen: parsed.bracketRegen ?? [] });
        }
      } catch { /* first visit or corrupt state */ }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist locally after hydration. Evidence (photo/replay) is base64 and can
  // be multi-MB, so we try to keep it (local-only mode needs it to view
  // captures) and fall back to stripping it if the storage quota is exceeded.
  useEffect(() => {
    if (!hydrated) return;
    const base: Persisted = { ...state, bracketRegen: [] };
    const stripEvidence = (): Persisted => ({
      ...base,
      submissions: base.submissions.map(({ photo, replay, ...rest }) => rest),
    });
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(base));
    } catch {
      try { localStorage.setItem(LS_KEY, JSON.stringify(stripEvidence())); } catch { /* give up */ }
    }
  }, [state, hydrated]);

  // Cross-tab realtime — another tab inthis browser writes localStorage → apply immediately.

  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as Persisted;
        if (Array.isArray(next?.registrations)) setState({ ...next, bracketRegen: [] });
      } catch { /* malformed */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrated]);

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
        sb.from("submissions").select("id, match_id, submitted_by, home_score, away_score, stats, status, note, created_at").order("created_at").then(({ data }) => {
          if (data) setState((s) => ({ ...s, submissions: data.map(subFromRow) }));
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bracket_state" }, (payload) => {
        const key = (payload.new as { key?: string })?.key;
        if (key?.startsWith("bracket-regen-")) {
          setState((s) => ({ ...s, bracketRegen: [...s.bracketRegen, key] }));
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "bracket_state" }, (payload) => {
        const key = (payload.old as { key?: string })?.key;
        if (key) setState((s) => ({ ...s, bracketRegen: s.bracketRegen.filter((k) => k !== key) }));
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto bracket: once every group match for a division is approved, generate the bracket.
  // (Admin can always force/regenerate from the admin page.)
  useEffect(() => {
    if (!hydrated) return;
    const divisions: Division[] = ["challenger", "elite"];
    for (const div of divisions) {
      const groupIds = [...new Set(state.registrations.filter((r) => r.division === div).map((r) => r.groupId).filter(Boolean))];
      if (groupIds.length === 0) continue;
      const gms = state.matches.filter((m) => m.stage ==="group" && m.groupId && groupIds.includes(m.groupId));
      const hasAll = gms.length > 0 && gms.every((m) => m.status ==="approved" || m.status ==="ff");
      // Bracket considered present once ANY knockout row exists for the division —
      // including "scheduled" rows, otherwise this effect would regenerate on every
      // render (each pass bumps the scheduled timestamps) and loop forever.
      const hasBracket = state.matches.some((m) => m.stage !== "group" && m.groupId === div);
      const flagKey = `bracket-regen-${div}`;
      const flagged = state.bracketRegen.includes(flagKey);
      // Only generate when there is no bracket yet (flag forces a one-time seed).
      // Regenerating an existing bracket on every flag/approval is what made the
      // pairings flip between clients — the admin's explicit button is the only
      // path that re-seeds an existing tree.
      if (!hasBracket && (flagged || hasAll)) {
        generateBracket(div);
      } else if (hasBracket) {
        // A settled knockout result can arrive from another device (sync) while
        // this client's next-round slot is still empty — advanceBracketPure only
        // ran on the approving client. Re-derive the tree here (only when a slot
        // actually changes, so we never loop) so every device converges.
        const advanced = advanceBracketPure(div, state.matches);
        const changed = advanced.filter((m) => {
          const prev = state.matches.find((x) => x.id === m.id);
          return prev && (prev.homeTeamId !== m.homeTeamId || prev.awayTeamId !== m.awayTeamId);
        });
        if (changed.length > 0) {
          setState((s) => ({ ...s, matches: advanced }));
          changed.forEach(upsertMatch);
        }
      }
      if (flagged) {
        sb?.from("bracket_state").delete().eq("key", flagKey).then(() => {}, () => {});
        setState((s) => ({ ...s, bracketRegen: s.bracketRegen.filter((k) => k !== flagKey) }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.matches, state.registrations, state.bracketRegen]);


  const upsertReg = (r: Registration) => {
    if (!sb) return;
    sb.from("registrations").upsert({ id: r.id, team_name: r.teamName, captain: r.captain, players: r.players, division: r.division ?? "challenger", group_id: r.groupId, status: r.status ?? "pending", created_at: r.createdAt }).then(() => {}, (e) => setSyncError(`registrations.upsert: ${e?.message ?? e}`));
  };
  const upsertMatch = (m: Match) => {
    if (!sb) return;
    const row: Record<string, unknown> = { id: m.id, stage: m.stage, group_id: m.groupId ?? null, home_team_id: m.homeTeamId, away_team_id: m.awayTeamId, home_score: m.homeScore, away_score: m.awayScore, status: m.status, stats: m.stats, scheduled_at: m.scheduledAt ?? null, ff_winner: m.ffWinner ?? null, round_number: m.round ?? null };
    sb.from("matches").upsert(row).then(({ error }) => {
      // A deploy can land before the round_number migration is applied. Retry
      // without it so results still save instead of failing every write.
      if (error && /round_number/i.test(error.message)) {
        const { round_number, ...fallback } = row;
        sb!.from("matches").upsert(fallback).then(() => {}, (e) => setSyncError(`matches.upsert ${m.id}: ${e?.message ?? e}`));
        return;
      }
      if (error) setSyncError(`matches.upsert ${m.id}: ${error.message}`);
    }, (e) => setSyncError(`matches.upsert ${m.id}: ${e?.message ?? e}`));
  };
  const deleteMatch = (id: string) => {
    if (!sb) return;
    sb.from("matches").delete().eq("id", id).then(() => {}, (e) => setSyncError(`matches.delete ${id}: ${e?.message ?? e}`));
  };
  const upsertSub = (s: Submission) => {
    if (!sb) return;
    sb.from("submissions").upsert({ id: s.id, match_id: s.matchId, submitted_by: s.submittedBy, home_score: s.homeScore, away_score: s.awayScore, stats: s.stats, status: s.status, note: s.note ?? null, photo: s.photo ?? null, replay: s.replay ?? null, created_at: s.createdAt }).then(() => {}, (e) => setSyncError(`submissions.upsert ${s.id}: ${e?.message ?? e}`));
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

  const deleteRegistration: Store["deleteRegistration"] = (registrationId) => {
    setState((s) => {
      const next = s.registrations.filter((r) => r.id !== registrationId);
      if (sb) sb.from("registrations").delete().eq("id", registrationId).then(() => {}, (e) => console.error("supabase delete failed:", e));
      return { ...s, registrations: next };
    });
  };

  const generateSchedule: Store["generateSchedule"] = () => {
    setState((s) => {
      // Keep every knockout row (they're produced by the bracket generator, not
      // here) and every group match that already has a result (approved/ff/
      // pending_review/declined), so re-running never resurrects a played match
      // or wipes the bracket. Scheduled group rows are replaced by the fresh
      // round-robin copy; stale ones (a team left the group) are dropped.
      const keep = s.matches.filter((m) => m.stage !== "group" || m.status !== "scheduled");
      const keptIds = new Set(keep.map((m) => m.id));
      const divisions: Division[] = ["challenger", "elite"];
      const fresh = divisions.flatMap((div) =>
        ["A", "B", "C", "D"].flatMap((g) => groupMatchesFor(s.registrations, `${div}-${g}`))
      );
      // Only add matches that don't already exist; persist each one with its jornada.
      const newMatches = fresh.filter((m) => !keptIds.has(m.id));
      const merged = [...keep, ...newMatches];
      newMatches.forEach(upsertMatch);
      return { ...s, matches: merged };
    });
  };

  // Pure: once QF/SF winners are known, fill the next round's pairings.
  const advanceBracketPure = (division: Division, matches: Match[]): Match[] => {
    const qf = matches.filter((m) => m.stage ==="qf" && m.groupId === division).sort((a, b) => a.id.localeCompare(b.id));
    const sf = matches.filter((m) => m.stage ==="sf" && m.groupId === division).sort((a, b) => a.id.localeCompare(b.id));
    const fin = matches.find((m) => m.stage ==="f" && m.groupId === division);
    const w = (m: Match | undefined) => (m ? bracketWinner(m) : null);

    const byId = new Map(matches.map((m) => [m.id, m]));
    const patch = (id: string, patch: Partial<Match>) => {
      const prev = byId.get(id);
      if (prev) byId.set(id, { ...prev, ...patch });
    };

    // No QF rounds: semis are seeded straight from groups. Only fill the final
    // once BOTH semis have a winner so a single cleared result never clobbers
    // the other side's seeded placeholder.
    if (qf.length === 0) {
      const s1 = w(sf[0]), s2 = w(sf[1]);
      if (fin && s1 && s2) {
        if ((fin.homeTeamId ?? null) !== s1 || (fin.awayTeamId ?? null) !== s2) patch(fin.id, { homeTeamId: s1, awayTeamId: s2 });
      }
      return [...byId.values()];
    }

    const q1 = w(qf[0]), q2 = w(qf[1]), q3 = w(qf[2]), q4 = w(qf[3]);
    sf.forEach((m, i) => {
      const home = i === 0 ? q1 : q3;
      const away = i === 0 ? q2 : q4;
      if ((m.homeTeamId ?? null) !== (home ?? null) || (m.awayTeamId ?? null) !== (away ?? null)) patch(m.id, { homeTeamId: home ?? null, awayTeamId: away ?? null });
    });
    if (fin && sf.length >= 2) {
      const s1 = w(sf[0]), s2 = w(sf[1]);
      if (s1 && s2 && ((fin.homeTeamId ?? null) !== s1 || (fin.awayTeamId ?? null) !== s2)) patch(fin.id, { homeTeamId: s1, awayTeamId: s2 });
    }

    return [...byId.values()];
  };



  const generateBracket: Store["generateBracket"] = (division, startAt?) => {
    setState((s) => {
      const divRegs = s.registrations.filter((r) => r.division === division);
      const groupsWithTeams = ["A", "B", "C", "D"].map((g) => `${division}-${g}`).filter((gid) => divRegs.some((r) => r.groupId === gid));
      const groupCount = groupsWithTeams.length;
      if (groupCount !== 1 && groupCount !== 2 && groupCount !== 4) return s;
      const seeds = bracketSeeds(division, s.matches, s.registrations); if (!seeds) return s;
      if (groupCount === 4 && !seeds?.qf) return s;
      if (groupCount === 2 && !seeds?.sf) return s;
      if (groupCount === 1 && !seeds?.fin) return s;

      const at = startAt ?? Date.now() + 15 * 60 * 1000;
      const existing = s.matches.filter((m) => m.stage !== "group" && m.groupId === division);
      const existingById = new Map(existing.map((m) => [m.id, m]));
      const freshBracket: Match[] = [];

      const pushMatch = (stage: Stage, i: number, home: string | null, away: string | null) => {
        const id = `${division}-${stage}-${i}`;
        const prev = existingById.get(id);
        // Keep the planned start time stable across re-generations unless the
        // admin explicitly passed a new one.
        const startAtMs = startAt ? at + i * 20 * 60 * 1000 : prev?.scheduledAt ?? at + i * 20 * 60 * 1000;
        // Keep a row that already carries a result (approved/ff) or a pending
        // report — never blow away a played match. Only re-seed rows that were
        // still scheduled (advanceBracketPure re-derives their pairings after).
        const settled = prev && (prev.status === "approved" || prev.status === "ff" || prev.status === "pending_review" || prev.status === "declined");
        if (settled) {
          freshBracket.push({ ...prev, scheduledAt: startAtMs });
          return;
        }
        freshBracket.push({
          id,
          stage,
          groupId: division,
          homeTeamId: home,
          awayTeamId: away,
          homeScore: 0,
          awayScore: 0,
          status: "scheduled",
          stats: [],
          scheduledAt: startAtMs,
          ffWinner: null,
        });
      };

      if (groupCount === 4) {
        seeds.qf!.forEach((p, i) => pushMatch("qf", i, p.home, p.away));
        // Semis stay empty until QF winners are known (advanceBracketPure fills them).
        pushMatch("sf", 0, null, null);
        pushMatch("sf", 1, null, null);
        pushMatch("f", 0, null, null);
      } else if (groupCount === 2) {
        seeds.sf!.forEach((p, i) => pushMatch("sf", i, p.home, p.away));
        pushMatch("f", 0, null, null);
      } else if (groupCount === 1) {
        pushMatch("f", 0, seeds.fin!.home, seeds.fin!.away);
      }

      const freshIds = new Set(freshBracket.map((m) => m.id));
      // Drop obsolete bracket rows (e.g. a division that shrank from 4 to 2 groups
      // left stale QF slots) so the tree never shows phantom rounds.
      existing.filter((m) => !freshIds.has(m.id)).forEach((m) => deleteMatch(m.id));

      const merged = [
        ...s.matches.filter((m) => m.stage === "group"),
        ...freshBracket,
      ];
      freshBracket.forEach(upsertMatch);
      // Re-derive SF/final slots from the current standings + winners, then persist
      // any slot that actually changed so every device converges on the same tree.
      const advanced = advanceBracketPure(division, merged);
      advanced.forEach((m) => {
        const prev = existingById.get(m.id);
        if (!prev || prev.homeTeamId !== m.homeTeamId || prev.awayTeamId !== m.awayTeamId) {
          if (m.stage !== "group") upsertMatch(m);
        }
      });
      return { ...s, matches: advanced };
    });
  };




  // Marks any still-pending report for a match as declined (superseded), so a
  // corrected re-report or a direct admin edit can't leave two live reports.
  const supersedePending = (matchId: string, keepId?: string) => {
    const superseded = state.submissions.filter(
      (x) => x.matchId === matchId && x.status === "pending" && x.id !== keepId
    );
    if (superseded.length === 0) return;
    superseded.forEach((x) => upsertSub({ ...x, status: "declined", note: "reemplazado" }));
    setState((s) => ({
      ...s,
      submissions: s.submissions.map((x) =>
        x.matchId === matchId && x.status === "pending" && x.id !== keepId
          ? { ...x, status: "declined" as const, note: "reemplazado" }
          : x
      ),
    }));
  };

  const submitResult: Store["submitResult"] = (matchId, submittedBy, homeScore, awayScore, stats?, photo?, replay?) => {
    const sub: Submission = {
      id: `sub-${Date.now()}`,
      matchId,
      submittedBy,
      homeScore,
      awayScore,
      stats: stats ?? [],
      status: "pending",
      photo,
      replay,
      createdAt: Date.now(),
    };
    // A captain can re-report a declined match, and a re-submit replaces the
    // previous pending one instead of stacking a second report on the match.
    supersedePending(matchId, sub.id);
    setState((s) => ({
      ...s,
      submissions: [...s.submissions, sub],
      matches: s.matches.map((m) =>
        m.id === matchId && m.status !== "approved" && m.status !== "ff"
          ? { ...m, status: "pending_review" }
          : m
      ),
    }));
    upsertSub(sub);
    const m = state.matches.find((x) => x.id === matchId);
    if (m && m.status !== "approved" && m.status !== "ff") upsertMatch({ ...m, status: "pending_review" });
  };

  const approve: Store["approve"] = (submissionId, stats, homeScore, awayScore) => {
    const sub = state.submissions.find((x) => x.id === submissionId);
    if (!sub) return;
    const finalStats = stats ?? sub.stats ?? [];
    // The admin may have corrected the score in the report card; fall back to the
    // captain's submitted values.
    const finalHome = typeof homeScore === "number" ? homeScore : sub.homeScore;
    const finalAway = typeof awayScore === "number" ? awayScore : sub.awayScore;
    const approvedSub = { ...sub, status: "approved" as const, stats: finalStats, homeScore: finalHome, awayScore: finalAway };
    const match = state.matches.find((m) => m.id === sub.matchId);

    // Mark the match approved, then recompute the SF/final pairings for
    // knockout matches so the bracket auto-advances after each approval.
    let nextMatches = state.matches.map((m) =>
      m.id === sub.matchId
        ? { ...m, homeScore: finalHome, awayScore: finalAway, stats: finalStats, status: "approved" as const }
        : m
    );
    if (match?.stage !== "group" && match?.groupId) {
      nextMatches = advanceBracketPure(match.groupId as Division, nextMatches);
    }

    setState((s) => ({
      ...s,
      submissions: s.submissions.map((x) => (x.id === submissionId ? approvedSub : x)),
      matches: nextMatches,
    }));
    upsertSub(approvedSub);
    if (match) {
      upsertMatch(nextMatches.find((m) => m.id === match.id) ?? match);
      // Any KO SF/final pairings that changed get persisted so every device sees them.
      nextMatches.forEach((m) => {
        const prev = state.matches.find((old) => old.id === m.id);
        if (prev && (prev.homeTeamId !== m.homeTeamId || prev.awayTeamId !== m.awayTeamId)) upsertMatch(m);
      });
    }
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

  // Admin fixes a wrong score on a still-pending report before approving it.
  const updateSubmissionScore: Store["updateSubmissionScore"] = (submissionId, homeScore, awayScore) => {
    const sub = state.submissions.find((x) => x.id === submissionId);
    if (!sub) return;
    const next = { ...sub, homeScore, awayScore };
    setState((s) => ({ ...s, submissions: s.submissions.map((x) => (x.id === submissionId ? next : x)) }));
    upsertSub(next);
  };

  // Undo an approval: the match goes back to "declined" so the captain can send a
  // corrected result, and any downstream bracket slot seeded from it is cleared.
  const reopenMatch: Store["reopenMatch"] = (matchId) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match) return;
    const approvedSub = [...state.submissions].reverse().find((x) => x.matchId === matchId && x.status === "approved");
    const reopenedSub = approvedSub ? { ...approvedSub, status: "declined" as const, note: "reabierto" } : null;
    let nextMatches = state.matches.map((m) => (m.id === matchId ? { ...m, status: "declined" as const } : m));
    if (match.stage !== "group" && match.groupId) nextMatches = advanceBracketPure(match.groupId as Division, nextMatches);
    setState((s) => ({
      ...s,
      submissions: reopenedSub
        ? s.submissions.map((x) => (x.id === reopenedSub.id ? reopenedSub : x))
        : s.submissions,
      matches: nextMatches,
    }));
    if (reopenedSub) upsertSub(reopenedSub);
    upsertMatch(nextMatches.find((m) => m.id === matchId) ?? match);
    nextMatches.forEach((m) => {
      const prev = state.matches.find((old) => old.id === m.id);
      if (prev && (prev.homeTeamId !== m.homeTeamId || prev.awayTeamId !== m.awayTeamId)) upsertMatch(m);
    });
  };

  // Admin overwrites an already-approved score directly (typo correction).
  const editApprovedResult: Store["editApprovedResult"] = (matchId, homeScore, awayScore) => {
    const match = state.matches.find((m) => m.id === matchId);
    if (!match) return;
    supersedePending(matchId);
    // Keep the approved report's stored score in sync so the processed list matches.
    const approved = [...state.submissions].reverse().find((x) => x.matchId === matchId && x.status === "approved");
    const syncedSub = approved ? { ...approved, homeScore, awayScore } : null;
    let nextMatches = state.matches.map((m) =>
      m.id === matchId ? { ...m, homeScore, awayScore, status: "approved" as const, ffWinner: null } : m
    );
    if (match.stage !== "group" && match.groupId) nextMatches = advanceBracketPure(match.groupId as Division, nextMatches);
    setState((s) => ({
      ...s,
      submissions: syncedSub ? s.submissions.map((x) => (x.id === syncedSub.id ? syncedSub : x)) : s.submissions,
      matches: nextMatches,
    }));
    if (syncedSub) upsertSub(syncedSub);
    upsertMatch(nextMatches.find((m) => m.id === matchId) ?? match);
    nextMatches.forEach((m) => {
      const prev = state.matches.find((old) => old.id === m.id);
      if (prev && (prev.homeTeamId !== m.homeTeamId || prev.awayTeamId !== m.awayTeamId)) upsertMatch(m);
    });
  };

  // Wipe the season: cloud tables first (so every device clears), then local.
  // Delete order matters — submissions reference matches, so deleting matches
  // first would fail the FK and abort the whole reset. Each step is checked so
  // a partial failure reports the real cause instead of a generic error.
  const archiveSeason: Store["archiveSeason"] = async () => {
    if (sb) {
      const steps: [string, () => PromiseLike<{ error: { message: string } | null }>][] = [
        ["submissions", () => sb.from("submissions").delete().neq("id", "")],
        ["matches", () => sb.from("matches").delete().neq("id", "")],
        ["registrations", () => sb.from("registrations").delete().neq("id", "")],
        ["bracket_state", () => sb.from("bracket_state").delete().neq("key", "")],
      ];
      for (const [table, del] of steps) {
        const { error } = await del();
        // bracket_state is only a regen watchdog — never block a season reset on it.
        if (error && table !== "bracket_state") {
          setSyncError(`archiveSeason (${table}): ${error.message}`);
          return false;
        }
      }
    }
    localStorage.removeItem(LS_KEY);
    setState({ matches: initialMatches, submissions: [], registrations: [], bracketRegen: [] });
    return true;
  };

  // Photo/replay are multi-MB base64 data URLs, so they're excluded from the
  // global hydration fetch to keep it fast. The admin pulls them on demand only
  // when a report needs verification.
  const fetchSubmissionEvidence: Store["fetchSubmissionEvidence"] = async (submissionId) => {
    if (sb) {
      const { data } = await sb.from("submissions").select("id, photo, replay").eq("id", submissionId).single();
      if (data?.photo || data?.replay) return { photo: data.photo ?? undefined, replay: data.replay ?? undefined };
    }
    // Local-only mode (or a row without cloud evidence): the report just
    // submitted this session is still in memory with its photo/replay.
    const local = state.submissions.find((s) => s.id === submissionId);
    if (local?.photo || local?.replay) return { photo: local.photo, replay: local.replay };
    return null;
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


  const resetData = () => {
    localStorage.removeItem(LS_KEY);
    setState({ matches: initialMatches, submissions: [], registrations: [], bracketRegen: [] });
  };

  return (
    <StoreContext.Provider
      value={{
        matches: state.matches,
        submissions: state.submissions,
        registrations: state.registrations,
        hydrated,
        supabaseConfigured: Boolean(sb),
        lastSyncError,
        registerTeam,
        assignGroup,
        generateSchedule,
        generateBracket,
        submitResult,
        approve,
        decline,
        updateSubmissionScore,
        reopenMatch,
        editApprovedResult,
        archiveSeason,
        reviewRegistration,
        deleteRegistration,
        fetchSubmissionEvidence,
        teamById,
        playerById,
        rosterOf,
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
