import { Match, StatLine, Standing } from "./types";

export type Division = "challenger" | "elite";

/** Split a team's peak rank into a division: Elite = Champion 3 and above. */
export function divisionForRank(rank: string | undefined | null): Division {
  const r = (rank || "").toLowerCase().replace(/\s+/g, "");
  // Any explicit Champion 3+ token lands in Elite.

  const eliteHints = ["c3", "c4", "c5", "c6", "c7", "grand", "gc", "ssl", "supersonic", "champion 3"];
  if (eliteHints.some((h) => r.includes(h))) return "elite";
  return "challenger";
}

export function teamDivision(teamId: string | null, registrations: { id: string; division?: Division }[]): Division {
  const reg = registrations.find((r) => r.id === teamId);
  return reg?.division ?? "challenger";
}

/** Standings for a group inside a division. Pts: W=+3, D=+1, L=0. */
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
      table[home].pts +=  1;
      table[away].pts +=  1;
    }
  }
  return Object.values(table).sort((a, b) => b.pts - a.pts || b.w - a.w);
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
