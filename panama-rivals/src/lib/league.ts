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

export type BracketPairing = { home: string; away: string };

/** Group seeds per division. 2 groups -> straight final; 4 groups -> QF. */
export function bracketSeeds(division: Division, matches: Match[], registrations: { id: string; division?: Division }[]): { qf?: BracketPairing[]; fin?: BracketPairing } | null {
  const s = ["A", "B", "C", "D"].map((g) => standingsFor(g, division, matches, registrations));
  const has = s.filter((t) => t.length >= 1);
  if (has.length === 0) return null;
  // <=10 teams per division -> 2 groups -> straight final.
  if (has.length === 2) {
    return { fin: { home: s[0][0].teamId, away: s[1][0].teamId } };
  }
  // 11-23 teams ->  ạ4 groups -> quarterfinals.
  if (has.length === 4 && has.every((t) => t.length >= 2)) {
    return {
      qf: [
        { home: s[0][0].teamId, away: s[1][1].teamId }, // A1 vs B2
        { home: s[1][0].teamId, away: s[0][1].teamId }, // B1 vs A2
        { home: s[2][0].teamId, away: s[3][1].teamId }, // C1 vs D2
        { home: s[3][0].teamId, away: s[2][1].teamId }, // D1 vs C2
      ],
    };
  }
  return {};
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
  const champion = fin ? (fin.ffWinner ?? (fin.homeScore > fin.awayScore ? fin.homeTeamId : fin.awayTeamId)) : null;
  const groups = [...new Set(matches.filter((m) => m.stage ==="group" && m.groupId?.startsWith(`${division}-`)).map((m) => m.groupId!))];
  const participants = registrations.filter((r) => r.division === division && r.groupId).length;
  const bracketTeams = Math.min(participants, groups.length * 2);

  const rows: PlacementRow[] = [];
  const add = (teamId: string | null | undefined, place: number, label: string) => {
    if (!teamId) return;
    rows.push({ teamId, place, label, points: placementPoints(participants, place, bracketTeams) });
  };
  if (champion) {
    add(champion, 1, "1º");
    const runner = fin ? (fin.homeTeamId === champion ? fin.awayTeamId : fin.homeTeamId) : null;
    add(runner, 2, "2º");
  }
  const sf = bracket.filter((m) => m.stage ==="sf" && m.status ==="approved");
  sf.forEach((m) => { add(m.homeTeamId,  3, "3º–4º"); add(m.awayTeamId,  3, "3º–4º"); });
  const qf = bracket.filter((m) => m.stage ==="qf" && m.status ==="approved");
  qf.forEach((m) => { add(m.homeTeamId,  5, "5º–8º"); add(m.awayTeamId,  5, "5º–8º"); });
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
