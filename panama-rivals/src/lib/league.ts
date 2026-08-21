import { Match, StatLine, Standing } from "./types";

export function standingsFor(groupId: string, matches: Match[]): Standing[] {
  const table: Record<string, Standing> = {};
  // Teams appear once their group has scheduled matches (registration → draw).
  for (const m of matches) {
    if (m.stage !== "group" || m.groupId !== groupId) continue;
    for (const id of [m.homeTeamId, m.awayTeamId]) {
      if (id && !table[id]) table[id] = { teamId: id, w: 0, l: 0, pts: 0 };
    }
  }
  for (const m of matches) {
    if (m.stage !== "group" || m.groupId !== groupId || m.status !== "approved") continue;
    const home = m.homeTeamId!;
    const away = m.awayTeamId!;
    table[home] = table[home] ?? { teamId: home, w: 0, l: 0, pts: 0 };
    table[away] = table[away] ?? { teamId: away, w: 0, l: 0, pts: 0 };
    if (m.homeScore > m.awayScore) {
      table[home].w++; table[home].pts += 3;
      table[away].l++; table[away].pts -= 1;
    } else if (m.awayScore > m.homeScore) {
      table[away].w++; table[away].pts += 3;
      table[home].l++; table[home].pts -= 1;
    }
  }
  return Object.values(table).sort((a, b) => b.pts - a.pts || b.w - a.w);
}

export type BracketPairing = { home: string; away: string };

export function bracketSeeds(matches: Match[]): { qf: BracketPairing[] } | null {
  const s = ["A", "B", "C", "D"].map((g) => standingsFor(g, matches));
  if (s.some((x) => x.length < 2)) return null;
  return {
    qf: [
      { home: s[0][0].teamId, away: s[1][1].teamId }, // A1 vs B2
      { home: s[1][0].teamId, away: s[0][1].teamId }, // B1 vs A2
      { home: s[2][0].teamId, away: s[3][1].teamId }, // C1 vs D2
      { home: s[3][0].teamId, away: s[2][1].teamId }, // D1 vs C2
    ],
  };
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

export function leaderboard(matches: Match[]): LeaderboardRow[] {
  const acc: Record<string, LeaderboardRow> = {};
  for (const m of matches) {
    if (m.status !== "approved") continue;
    for (const st of m.stats as StatLine[]) {
      if (!acc[st.playerId]) {
        acc[st.playerId] = { playerId: st.playerId, teamId: st.teamId, goals: 0, assists: 0, saves: 0, shots: 0, points: 0 };
      }
      acc[st.playerId].goals += st.goals;
      acc[st.playerId].assists += st.assists;
      acc[st.playerId].saves += st.saves;
      acc[st.playerId].shots += st.shots;
      acc[st.playerId].points += st.goals + st.assists;
    }
  }
  return Object.values(acc);
}
