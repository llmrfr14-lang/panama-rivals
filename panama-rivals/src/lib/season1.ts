// Season 1 archive — hardcoded from the completed tournament spreadsheet.
// Stray template rows (Fénix RL / Titanes FC / Lobos Azules) excluded.

export interface Standing {
  team: string;
  pj: number;
  w: number;
  l: number;
  pts: number;
}

export interface BracketMatch {
  home: string;
  away: string;
  hs: number;
  as: number;
  winner: string;
  round: "QF" | "SF" | "Final";
}

export interface LeaderEntry {
  name: string;
  team: string;
  value: number;
}

export const seasonOne = {
  slug: "temporada-1",
  label: { es: "Temporada 1", en: "Season 1" },
  champion: "Porotos FC",
  runnerUp: "ácido desoxirribonucleico",
  finalScore: "13–8",

  groups: [
    {
      name: "Grupo 1",
      standings: [
        { team: "Ballchasing", pj: 3, w: 3, l: 0, pts: 9 },
        { team: "Los mas Capitos", pj: 4, w: 3, l: 1, pts: 8 },
        { team: "Choco", pj: 3, w: 1, l: 2, pts: 1 },
        { team: "La masia", pj: 2, w: 0, l: 2, pts: -2 },
        { team: "Colonenses", pj: 2, w: 0, l: 2, pts: -2 },
      ],
    },
    {
      name: "Grupo 2",
      standings: [
        { team: "ácido desoxirribonucleico", pj: 4, w: 4, l: 0, pts: 12 },
        { team: "AFK Gaming", pj: 4, w: 2, l: 2, pts: 4 },
        { team: "Supersonic Diamonds", pj: 4, w: 2, l: 2, pts: 4 },
        { team: "Allahuakbar", pj: 4, w: 1, l: 3, pts: 0 },
        { team: "No Hands", pj: 3, w: 0, l: 3, pts: -3 },
      ],
    },
    {
      name: "Grupo 3",
      standings: [
        { team: "Los Espartanos", pj: 3, w: 3, l: 0, pts: 9 },
        { team: "Porotos FC", pj: 3, w: 2, l: 1, pts: 5 },
        { team: "Cabo Verde", pj: 3, w: 1, l: 2, pts: 1 },
        { team: "Da00", pj: 3, w: 0, l: 3, pts: -3 },
      ],
    },
    {
      name: "Grupo 4",
      standings: [
        { team: "SUHHH", pj: 3, w: 3, l: 0, pts: 9 },
        { team: "OHH SI NENA", pj: 3, w: 2, l: 1, pts: 5 },
        { team: "LOS INQUIETOS", pj: 3, w: 1, l: 2, pts: 1 },
        { team: "DISQ DIAMANTES", pj: 3, w: 0, l: 3, pts: -3 },
      ],
    },
  ] as { name: string; standings: Standing[] }[],

  knockout: [
    { round: "QF", home: "Ballchasing", away: "AFK Gaming", hs: 10, as: 5, winner: "Ballchasing" },
    { round: "QF", home: "Porotos FC", away: "SUHHH", hs: 12, as: 10, winner: "Porotos FC" },
    { round: "QF", home: "Los Espartanos", away: "OHH SI NENA", hs: 9, as: 5, winner: "Los Espartanos" },
    { round: "QF", home: "Los mas Capitos", away: "ácido desoxirribonucleico", hs: 3, as: 11, winner: "ácido desoxirribonucleico" },
    { round: "SF", home: "Los Espartanos", away: "ácido desoxirribonucleico", hs: 2, as: 6, winner: "ácido desoxirribonucleico" },
    { round: "SF", home: "Ballchasing", away: "Porotos FC", hs: 4, as: 11, winner: "Porotos FC" },
    { round: "Final", home: "ácido desoxirribonucleico", away: "Porotos FC", hs: 8, as: 13, winner: "Porotos FC" },
  ] as BracketMatch[],

  leaders: {
    goals: [
      { name: "U5qr", team: "Porotos FC", value: 23 },
      { name: "snowyz washed", team: "Porotos FC", value: 19 },
      { name: "mgoalspty", team: "Ballchasing", value: 15 },
      { name: "Ema41507", team: "Cabo Verde", value: 14 },
      { name: "remixexecutable", team: "SUHHH", value: 14 },
      { name: "Chopodo", team: "Ballchasing", value: 14 },
      { name: "Kai φ", team: "SUHHH", value: 11 },
      { name: "Angel_Sparta507", team: "Los Espartanos", value: 11 },
    ],
    assists: [
      { name: "snowyz washed", team: "Porotos FC", value: 14 },
      { name: "Kai φ", team: "SUHHH", value: 9 },
      { name: "mgoalspty", team: "Ballchasing", value: 8 },
      { name: "Chopodo", team: "Ballchasing", value: 8 },
      { name: "U5qr", team: "Porotos FC", value: 8 },
      { name: "CocoRL17", team: "Cabo Verde", value: 7 },
      { name: "remixexecutable", team: "SUHHH", value: 6 },
      { name: "Advento.", team: "AFK Gaming", value: 6 },
    ],
    saves: [
      { name: "snowyz washed", team: "Porotos FC", value: 18 },
      { name: "mgoalspty", team: "Ballchasing", value: 13 },
      { name: "hbouche", team: "ácido desoxirribonucleico", value: 13 },
      { name: "Luis PTY507", team: "Los Espartanos", value: 11 },
      { name: "Chopodo", team: "Ballchasing", value: 10 },
      { name: "U5qr", team: "Porotos FC", value: 10 },
      { name: "Ema41507", team: "Cabo Verde", value: 9 },
      { name: "Dasc2000", team: "ácido desoxirribonucleico", value: 9 },
    ],
    shots: [
      { name: "mgoalspty", team: "Ballchasing", value: 42 },
      { name: "snowyz washed", team: "Porotos FC", value: 41 },
      { name: "Chopodo", team: "Ballchasing", value: 33 },
      { name: "U5qr", team: "Porotos FC", value: 33 },
      { name: "Dasc2000", team: "ácido desoxirribonucleico", value: 27 },
      { name: "Kai φ", team: "SUHHH", value: 26 },
      { name: "Luis PTY507", team: "Los Espartanos", value: 25 },
      { name: "Ema41507", team: "Cabo Verde", value: 23 },
    ],
    points: [
      { name: "snowyz washed", team: "Porotos FC", value: 6074 },
      { name: "mgoalspty", team: "Ballchasing", value: 4588 },
      { name: "Chopodo", team: "Ballchasing", value: 3985 },
      { name: "U5qr", team: "Porotos FC", value: 3786 },
      { name: "hbouche", team: "ácido desoxirribonucleico", value: 3242 },
      { name: "Luis PTY507", team: "Los Espartanos", value: 3037 },
      { name: "Dasc2000", team: "ácido desoxirribonucleico", value: 2999 },
      { name: "Ema41507", team: "Cabo Verde", value: 2911 },
    ],
  } as Record<string, LeaderEntry[]>,
};
