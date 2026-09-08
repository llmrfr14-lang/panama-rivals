"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Match, Player, Stage, StatLine, Submission, Team } from "./types";
import { initialMatches, players as seedPlayers, teams as seedTeams } from "./seed";
import { bracketSeeds, divisionForRank, Division, teamDivision } from "./league";
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
  supabaseConfigured: boolean;
  hydrated: boolean;
 registerTeam: (teamName: string, captain: RivalContact, players: PlayerInfo[]) => Registration;
  assignGroup: (registrationId: string, groupId: string | null) => void;
  reviewRegistration: (registrationId: string, status: RegistrationStatus) => void;
  deleteRegistration: (registrationId: string) => void;
  generateSchedule: () => void;
  generateBracket: (division: Division, startAt?: number) => void;
  checkInTeam: (matchId: string, teamId: string) => void;
  applyCheckInDeadlines: () => void;
  submitResult:(
    matchId: string,
    submittedBy: string,
    homeScore: number,
    awayScore: number,
    stats?: StatLine[],
    photo?: string,
    replay?: string
  ) => void;
  approve: (submissionId: string, stats?: StatLine[]) => void;
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
  /** Division-state keys (e.g. "bracket-regen-challenger") that the cloud flagged as needing regeneration. */
  bracketRegen: string[];
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
    checkedIn: r.checked_in ?? null,
    ffWinner: r.ff_winner ?? null,
    ffDeadline: r.ff_deadline ?? undefined,
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
            sb.from("submissions").select("*").order("created_at"),
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

  // Persist locally always — but only after hydration
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state, hydrated]);

  // Cross-tab realtime — another tab inthis browser writes localStorage → apply immediately.

  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as Persisted;
        if (Array.isArray(next?.registrations)) setState({ ...next, bracketRegen: next.bracketRegen ?? [] });
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
        sb.from("submissions").select("*").order("created_at").then(({ data }) => {
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
      const hasBracket = state.matches.some((m) => m.stage !== "group" && m.groupId === div && m.status !== "scheduled");
      const flagKey = `bracket-regen-${div}`;
      const flagged = state.bracketRegen.includes(flagKey);
      if (flagged || (hasAll && !hasBracket)) generateBracket(div);
      if (flagged) {
        sb?.from("bracket_state").delete().eq("key", flagKey).then(() => {}, () => {});
        setState((s) => ({ ...s, bracketRegen: s.bracketRegen.filter((k) => k !== flagKey) }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.matches, state.registrations, state.bracketRegen]);


  // Check-in FF deadline sweep — run on load and every 15s so no-shows auto-loss.

  useEffect(() => {
    if (!hydrated) return;
    applyCheckInDeadlines();
    const id = setInterval(applyCheckInDeadlines, 15 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const upsertReg = (r: Registration) => {
    if (!sb) return;
    sb.from("registrations").upsert({ id: r.id, team_name: r.teamName, captain: r.captain, players: r.players, division: r.division ?? "challenger", group_id: r.groupId, status: r.status ?? "pending", created_at: r.createdAt }).then(() => {}, (e) => console.error("supabase upsert failed:", e));
  };
  const upsertMatch = (m: Match) => {
    if (!sb) return;
    sb.from("matches").upsert({ id: m.id, stage: m.stage, group_id: m.groupId ?? null, home_team_id: m.homeTeamId, away_team_id: m.awayTeamId, home_score: m.homeScore, away_score: m.awayScore, status: m.status, stats: m.stats, scheduled_at: m.scheduledAt ?? null, checked_in: m.checkedIn ?? null, ff_winner: m.ffWinner ?? null, ff_deadline: m.ffDeadline ?? null }).then(() => {}, (e) => console.error("supabase upsert failed:", e));
  };
  const upsertSub = (s: Submission) => {
    if (!sb) return;
    sb.from("submissions").upsert({ id: s.id, match_id: s.matchId, submitted_by: s.submittedBy, home_score: s.homeScore, away_score: s.awayScore, stats: s.stats, status: s.status, note: s.note ?? null, photo: s.photo ?? null, replay: s.replay ?? null, created_at: s.createdAt }).then(() => {}, (e) => console.error("supabase upsert failed:", e));
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
      const keep = s.matches.filter((m) => m.status !== "scheduled");
      const keptIds = new Set(keep.map((m) => m.id));
      const divisions: Division[] = ["challenger", "elite"];
      const fresh = divisions.flatMap((div) =>
        ["A", "B", "C", "D"].flatMap((g) => groupMatchesFor(s.registrations, `${div}-${g}`))
      );
      const merged = [
        ...keep,
        ...fresh,
      ];
      fresh.forEach(upsertMatch);
      return { ...s, matches: merged };
    });
  };

const bracketWinner = (m: Match): string | null => {
    if (m.ffWinner) return m.ffWinner;

    if (m.status !== "approved") return null;
    if (m.homeScore > m.awayScore) return m.homeTeamId;


    if (m.awayScore > m.homeScore) return m.awayTeamId;

    // Knockout final can't be a draw — if tied, leave unresolved for admin.
    return null;
  };




  // Pure: once QF/SF winners are known, fill the next round's pairings.
  const advanceBracketPure = (division: Division, matches: Match[]): Match[] => {
    const qf = matches.filter((m) => m.stage ==="qf" && m.groupId === division).sort((a, b) => a.id.localeCompare(b.id));
    const sf = matches.filter((m) => m.stage ==="sf" && m.groupId === division).sort((a, b) => a.id.localeCompare(b.id));
    const fin = matches.find((m) => m.stage ==="f" && m.groupId === division);
    const w = (m: Match | undefined) => (m ? bracketWinner(m) : null);
    const q1 = w(qf[0]), q2 = w(qf[1]), q3 = w(qf[2]), q4 = w(qf[3]);
    const s1 = w(sf[0]), s2 = w(sf[1]);

    const byId = new Map(matches.map((m) => [m.id, m]));
    const patch = (id: string, patch: Partial<Match>) => {
      const prev = byId.get(id);
      if (prev) byId.set(id, { ...prev, ...patch });
    };

    sf.forEach((m, i) => {
      const home = i === 0 ? q1 : q3;
      const away = i === 0 ? q2 : q4;
      if ((m.homeTeamId ?? null) !== (home ?? null) || (m.awayTeamId ?? null) !== (away ?? null)) patch(m.id, { homeTeamId: home ?? null, awayTeamId: away ?? null });
    });
    if (fin && sf.length >= 2) {
      if ((fin.homeTeamId ?? null) !== (s1 ?? null) || (fin.awayTeamId ?? null) !== (s2 ?? null)) patch(fin.id, { homeTeamId: s1 ?? null, awayTeamId: s2 ?? null });
    }

    return [...byId.values()];
  };



  const generateBracket: Store["generateBracket"] = (division, startAt?) => {
    setState((s) => {
      const divRegs = s.registrations.filter((r) => r.division === division);
      const groupsWithTeams = ["A", "B", "C", "D"].map((g) => `${division}-${g}`).filter((gid) => divRegs.some((r) => r.groupId === gid));
      const needsQF = groupsWithTeams.length === 4;
      if (!needsQF && groupsWithTeams.length !== 1) return s;
      const seeds = bracketSeeds(division, s.matches, s.registrations); if (!seeds) return s; if (!needsQF) { if (!seeds?.fin) return s; } else { if (!seeds?.qf) return s; }
      const canFinal = Boolean(seeds?.fin);
      const canQF = Boolean(seeds?.qf);
      if ((needsQF && !canQF) || (!needsQF && !canFinal)) return s;

      const at = startAt ?? Date.now() + 15 * 60 *   1000;
      const keep = s.matches.filter((m) => m.stage === "group" || m.status !== "scheduled");
      const freshBracket: Match[] = [];
      const pushMatch = (stage: Stage, i: number, home: string | null, away: string | null) => {
        const id = `${division}-${stage}-${i}`;
        freshBracket.push({
          id,
          stage,
          groupId: division,
          homeTeamId: home,
          awayTeamId: away,
          homeScore: 0,
          awayScore:  0,
          status: "scheduled",
          stats: [],
          scheduledAt: at + i * 20 * 60 * 1000,
          checkedIn: null,
          ffWinner: null,
        });
      };

      if (needsQF && canQF) {
        seeds.qf!.forEach((p,i) => pushMatch("qf", i,p.home, p.away));
        const r1 = seeds.qf![1], r2 = seeds.qf![0], r3 = seeds.qf![3], r4 = seeds.qf![2];
        pushMatch("sf", 0, r1.home, r1.away);
        pushMatch("sf", 1, r3.home, r3.away);
        pushMatch("f",  0,(seeds.fin?.home ?? seeds.qf![0].home), (seeds.fin?.away ?? seeds.qf![1].away));
      } else if (!needsQF && canFinal) {
        pushMatch("f",  0, seeds.fin!.home, seeds.fin!.away);
      }

      const keptBracket = keep.filter((m) => m.stage !== "group");
      const keptById = new Map(keptBracket.map((m) => [m.id, m]));
      const merged = [
        ...s.matches.filter((m) => m.stage === "group"),
        ...keptBracket,
        ...freshBracket.filter((m) => !keptById.has(m.id) && !keptBracket.some((k) => k.id === m.id)),
      ];
      freshBracket.forEach((m) => { if (!keptById.has(m.id)) upsertMatch(m); });
      return { ...s, matches: advanceBracketPure(division, merged) };
    });
  };




  const checkInTeam: Store["checkInTeam"] = (matchId, teamId) => {
    setState((s) => {
      const next = s.matches.map((m) => {
        if (m.id !== matchId) return m;
        const marked = { ...m, checkedIn: teamId, status: (m.status ==="scheduled" ? "checked_in" : m.status) };
        upsertMatch(marked);
        return marked;
      });
      return { ...s, matches: next };
    });
  };



  const applyCheckInDeadlines: Store["applyCheckInDeadlines"] = () => {
    const now = Date.now();
    setState((s) => {
      const changed: Match[] = [];
      let matches = s.matches.map((m) => {
        if (m.stage ==="group" || m.status ==="approved" || m.status ==="ff" || !m.scheduledAt) return m;
        if (m.status !== "checked_in" && m.status !== "scheduled") return m;
        const deadline = m.ffDeadline ?? (m.scheduledAt + 15 * 60 *  1000);
        if (m.ffDeadline == null && now >= m.scheduledAt) {
          const withDeadline = { ...m, ffDeadline: deadline };
          changed.push(withDeadline);
          return withDeadline;
        }
        if (now < deadline) return m;
        let winner: string | null = null;
        if (m.checkedIn === m.homeTeamId || m.checkedIn === m.awayTeamId) winner = m.checkedIn;



        if (winner) {
          const marked = { ...m, status: "ff" as const, ffWinner: winner, homeScore: winner === m.homeTeamId ?  1 :   0, awayScore: winner === m.awayTeamId ?  1 :   0 };
          changed.push(marked);
          return marked;
        }
        // Neither team checked in — leave open for admin to resolve manually.



        return m;
      });
      if (changed.length) {
        changed.forEach(upsertMatch);
        const divisionsAffected = [...new Set(changed.map((m) => m.groupId).filter(Boolean))] as Division[];
        divisionsAffected.forEach((d) => { matches = advanceBracketPure(d, matches); });
        return { ...s, matches };
      }
      return s;
    });
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
    setState((s) => ({
      ...s,
      submissions: [...s.submissions, sub],
      matches: s.matches.map((m) => (m.id === matchId ? { ...m, status: "pending_review" } : m)),
    }));
    upsertSub(sub);
    const m = state.matches.find((x) => x.id === matchId);
    if (m) upsertMatch({ ...m, status: "pending_review" });
  };

  const approve: Store["approve"] = (submissionId, stats) => {
    const sub = state.submissions.find((x) => x.id === submissionId);
    if (!sub) return;
    const finalStats = stats ?? sub.stats ?? [];
    const approvedSub = { ...sub, status: "approved" as const, stats: finalStats };
    const match = state.matches.find((m) => m.id === sub.matchId);
    setState((s) => ({
      ...s,
      submissions: s.submissions.map((x) => (x.id === submissionId ? approvedSub : x)),
      matches: s.matches.map((m) =>
        m.id === sub.matchId
          ? { ...m, homeScore: sub.homeScore, awayScore: sub.awayScore, stats: finalStats, status: "approved" }
          : m
      ),
    }));
    upsertSub(approvedSub);
    if (match) {
      const advanced = { ...match, homeScore: sub.homeScore, awayScore: sub.awayScore, stats: finalStats, status: "approved" as const };
      upsertMatch(advanced);
      if (match.stage !== "group" && match.groupId) advanceBracketPure(match.groupId as Division, state.matches);
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
        registerTeam,
        assignGroup,
        generateSchedule,
        generateBracket,
        checkInTeam,
        applyCheckInDeadlines,
        submitResult,
        approve,
        reviewRegistration,
        deleteRegistration,
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
