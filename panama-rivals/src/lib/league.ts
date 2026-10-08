import { Match, StatLine, Standing } from "./types";

export type Division = "challenger" | "elite";

/** Split a team's peak rank into a division: Elite = Champion 3 and above. */
export function divisionForRank(rank: string | undefined | null): Division {
  // Normalize: lowercase, strip accents and any punctuation/spaces ("Campeón III"/"D3." → "campeoniii").
  const r = (rank || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  if (!r) return "challenger";
  // Any explicit Champion 3+ token lands in Elite (English, Spanish o siglas).

  const eliteHints = [
    // Inglés: Champion 3+, Champ III, Grand Champion, Supersonic Legend.
    "champion3", "championiii", "champ3", "champiii", "grandchampion", "grandchamp",
    "supersonic", "legendary",
    // Español: Campeón 3+, Campeón III, Gran Campeón, Leyenda Supersónica.

    "campeon3", "campeoniii", "camp3", "campiii", "grancampeon", "grancamp",
    "supersonico", "supersonica", "leyendasupersonica", "legendario",
    // Siglas: C3+, GC, SSL (Supersonic Legend),
    "c3", "c4", "c5", "c6", "c7", "c8", "ciii", "gc", "ssl",
  ];
  if (eliteHints.some((h) => r.includes(h))) return "elite";
  return "challenger";
}

export function teamDivision(teamId: string | null, registrations: { id: string; division?: Division }[]): Division {
  const reg = registrations.find((r) => r.id === teamId);
  return reg?.division ?? "challenger";
}

/** Standings for a group inside a division. Pts: W=+3, D=0 (loss=0 per the official 2v2 format. */
export function standingsFor(groupId: string, division: Division, matches: Match[], registrations: { id: string; division?: Division }[]): Standing[] {
  // Groups are namespaced per division ("ch-A"/"el-A") so both divisions keep A/B/C/D.
  const key = `${division}-${groupId}`;
  // Teams appear once their group has scheduled matches (registration → draw).
  const table: Record<string, Standing> = {};
  for (const m of matches) {
    if (m.stage !== "group" || m.groupId !== key) continue;
    for (const id of [m.homeTeamId, m.awayTeamId]) {
      if (id && !table[id]) table[id] = { teamId: id, w: 0, l:  0, pts:  0 };
    }
  }
  const h2h = (a: string, b: string) => {
    const head = matches.find((m) =>
      m.stage ==="group" && m.groupId === key && m.status ==="approved" &&
      ((m.homeTeamId === a && m.awayTeamId === b) || (m.homeTeamId === b && m.awayTeamId === a))
    );
    if (!head) return 0;
    return head.homeTeamId === a ? head.homeScore - head.awayScore : head.awayScore - head.homeScore;

  };
  for (const m of matches) {
    if (m.stage !== "group" || m.groupId !== key || m.status !== "approved") continue;
    const home = m.homeTeamId!;
    const away = m.awayTeamId!;
    table[home] = table[home] ?? { teamId: home, w:  0, l:  0, pts:  0 };
    table[away] = table[away] ?? { teamId: away, w:  0, l:  0, pts:  0 };
    if (m.homeScore > m.awayScore) {
      table[home].w++; table[home].pts +=  3;
      table[away].l++;
    } else if (m.awayScore > m.homeScore) {
      table[away].w++; table[away].pts +=  3;
      table[home].l++;
    } else {
      // Draws score  0 — per the official 2v2 format (win-only scoring.



    }
  }
  return Object.values(table).sort((a, b) => b.pts - a.pts || b.w - a.w || h2h(a.teamId, b.teamId)); 
}

/**
 * Round-robin schedule via the circle method. Each returned match carries a
 * 1-based `round` (jornada) so no team plays twice in the same round — this is
 * the play order that keeps a team from being booked against two opponents at
 * once. Odd team counts get a bye (the bye pairing is dropped).
 */
export function roundRobinRounds(teamIds: string[]): { round: number; home: string; away: string }[] {
  const BYE = "__bye__";
  const ids = [...teamIds];
  if (ids.length % 2 === 1) ids.push(BYE);
  const n = ids.length;
  if (n < 2) return [];
  const out: { round: number; home: string; away: string }[] = [];
  const arr = [...ids];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === BYE || b === BYE) continue;
      // Alternate home/away each jornada so no team always hosts.
      out.push({ round: r + 1, home: r % 2 === 0 ? a : b, away: r % 2 === 0 ? b : a });
    }
    // Rotate every slot except the first (fixed pivot).
    const last = arr.pop()!;
    arr.splice(1, 0, last);
  }
  return out;
}

/** Winner of a knockout match, or null when unresolved (scheduled, pending or a draw). */
export function bracketWinner(m: Match): string | null {
  if (m.ffWinner) return m.ffWinner;
  if (m.status !== "approved") return null;
  if (m.homeScore > m.awayScore) return m.homeTeamId;
  if (m.awayScore > m.homeScore) return m.awayTeamId;
  return null;
}

export type BracketPairing = { home: string; away: string };

export type BracketSeeds = {
  qf?: BracketPairing[];
  sf?: BracketPairing[]; // 2 groups -> top 2 per group -> semis + final
  fin?: BracketPairing;
};

/** Group seeds per division. 1 group -> straight final; 2 groups -> semis + final; 4 groups -> QF. */
export function bracketSeeds(division: Division, matches: Match[], registrations: { id: string; division?: Division }[]): BracketSeeds | null {
  // Only groups that actually have teams (a draw can use any subset of A–D, so
  // never assume A/B are the active ones).
  const active = ["A", "B", "C", "D"]
    .map((g) => ({ g, rows: standingsFor(g, division, matches, registrations) }))
    .filter((x) => x.rows.length >= 1);
  if (active.length === 0) return null;

  if (active.length === 1) {
    const rows = active[0].rows;
    if (rows.length < 2) return null;
    return { fin: { home: rows[0].teamId, away: rows[1].teamId } };
  }

  if (active.length === 2) {
    const [g0, g1] = active;
    if (g0.rows.length < 2 || g1.rows.length < 2) return null;
    // Challenger pairs same ranks (SF1: 2º vs 2º, SF2: 1º vs 1º) per the
    // organizer's request; Elite keeps the standard cross-seed (1º vs 2º) so
    // group winners don't meet until the final.
    if (division === "challenger") {
      return {
        sf: [
          { home: g1.rows[1].teamId, away: g0.rows[1].teamId },
          { home: g1.rows[0].teamId, away: g0.rows[0].teamId },
        ],
        fin: { home: g0.rows[0].teamId, away: g1.rows[0].teamId },
      };
    }
    return {
      sf: [
        { home: g0.rows[0].teamId, away: g1.rows[1].teamId },
        { home: g1.rows[0].teamId, away: g0.rows[1].teamId },
      ],
      fin: { home: g0.rows[0].teamId, away: g1.rows[0].teamId },
    };
  }

  // 4 groups -> quarterfinals.
  if (active.length === 4 && active.every((x) => x.rows.length >= 2)) {
    const [g0, g1, g2, g3] = active;
    return {
      qf: [
        { home: g0.rows[0].teamId, away: g1.rows[1].teamId }, // A1 vs B2
        { home: g1.rows[0].teamId, away: g0.rows[1].teamId }, // B1 vs A2
        { home: g2.rows[0].teamId, away: g3.rows[1].teamId }, // C1 vs D2
        { home: g3.rows[0].teamId, away: g2.rows[1].teamId }, // D1 vs C2
      ],
      fin: { home: g0.rows[0].teamId, away: g1.rows[0].teamId },
    };
  }
  // Unsupported shape (3 groups, or a 4-group where standings are incomplete) —
  // signal "not ready" so callers bail instead of looping.
  return null;
}

export type PlacementRow = {
  teamId: string;
  place: number;  // 1..n (ties share the position number
  points: number;  // PDF ranking: win n; runner n-1; SF losers n-3; QF losers n-7; else  0.
  label: string;  // "1º", "2º", "3º–4º", "5º–8º"...
};

/** Official ranking points (PDF page 2): winner gets n points, runner-up n-1,
  semis losers n-3, QF losers n-7, and anyone beyond the bracket gets 0. */
export function placementPoints(participants: number, place: number, bracketTeams: number): number {
  if (place > bracketTeams) return  0;
  if (place <= 1) return participants;
  if (place <= 2) return participants -  1;
  if (place <= 4) return Math.max(1, participants -  3);
  if (place <= 8) return Math.max(1, participants -  7);
  return Math.max(1, participants -  15);
}

/** Per-division placement ranking, from bracket results. */
export function placementFor(division: Division, matches: Match[], registrations: { id: string; division?: Division; groupId?: string | null; players: any[] }[]): PlacementRow[] {
  const bracket = matches.filter((m) => m.stage !== "group" && m.groupId === division);
  const fin = bracket.find((m) => m.stage ==="f");
  // Only a settled final crowns a champion — an unplayed 0–0 must not rank anyone.
  const champion = fin && (fin.status === "approved" || fin.status === "ff") ? bracketWinner(fin) : null;
  const groups = [...new Set(matches.filter((m) => m.stage ==="group" && m.groupId?.startsWith(`${division}-`)).map((m) => m.groupId!))];
  const participants = registrations.filter((r) => r.division === division && r.groupId).length;
  const bracketTeams = Math.min(participants, groups.length * 2);

  const rows: PlacementRow[] = [];
  const add = (teamId: string | null | undefined, place: number, label: string) => {
    if (!teamId) return;
    rows.push({ teamId, place, label, points: placementPoints(participants, place, bracketTeams) });
  };
  // Loser of a settled knockout match, or null if it isn't decided yet.
  const loserOf = (m: Match): string | null => {
    const winner = bracketWinner(m);
    if (!winner) return null;
    return winner === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
  };
  if (champion) {
    add(champion, 1, "1º");
    add(fin!.homeTeamId === champion ? fin!.awayTeamId : fin!.homeTeamId, 2, "2º");
  }
  // SF losers take 3º–4º; QF losers take 5º–8º. Winners are placed by the round
  // they advance to, never as losers of the round they just won.
  bracket.filter((m) => m.stage ==="sf").forEach((m) => add(loserOf(m), 3, "3º–4º"));
  bracket.filter((m) => m.stage ==="qf").forEach((m) => add(loserOf(m), 5, "5º–8º"));
  return rows.filter((r) => r.points >  0).sort((a, b) => b.points - a.points);
}

export type LeaderboardRow = {
  playerId: string;
  teamId: string;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  points: number; // goals + assists
};

export function leaderboard(division: Division, matches: Match[], registrations: { id: string; division?: Division }[]): LeaderboardRow[] {
  const acc: Record<string, LeaderboardRow> = {};
  for (const m of matches) {
    if (m.status !== "approved") continue;
    if (teamDivision(m.homeTeamId, registrations) !== division) continue;
    for (const st of m.stats as StatLine[]) {
      if (!acc[st.playerId]) {
        acc[st.playerId] = { playerId: st.playerId, teamId: st.teamId, goals:  0, assists:  0, saves:  0, shots:  0, points:  0 };
      }
      acc[st.playerId].goals += st.goals;
      acc[st.playerId].assists += st.assists;

      acc[st.playerId].saves += st.saves;
acc[st.playerId].shots += st.shots;


      acc[st.playerId].points += st.goals + st.assists;


    }
  }
  return Object.values(acc).sort((a, b) => b.points - a.points);
}
