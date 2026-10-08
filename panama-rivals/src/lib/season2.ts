// Season 2 archive — frozen snapshot of the completed Season 2 (2026).
// Captured from the shared Supabase data before the Season 3 reset so the
// results stay browsable at /season2 even after the live tables are wiped.
// Both divisions ran a 2-group round-robin (A/B, 4 teams each) into semis + final.

export interface SeasonStanding { teamName: string; pj: number; w: number; l: number; pts: number; }
export interface SeasonGroup { name: string; standings: SeasonStanding[]; }
export interface SeasonBracketMatch { home: string; away: string; hs: number; as: number; winner: string; round: "QF" | "SF" | "Final"; }
export interface SeasonLeaderEntry { name: string; team: string; value: number; }
export interface SeasonDivisionArchive {
  champion: string;
  runnerUp: string;
  finalScore: string;
  groups: SeasonGroup[];
  bracket: SeasonBracketMatch[];
  leaders: Record<"goals" | "assists" | "saves" | "shots" | "points", SeasonLeaderEntry[]>;
}

export const seasonTwo: {
  slug: string;
  label: { es: string; en: string };
  divisions: Record<"challenger" | "elite", SeasonDivisionArchive>;
} = 
{
  "slug": "temporada-2",
  "label": {
    "es": "Temporada 2",
    "en": "Season 2"
  },
  "divisions": {
    "challenger": {
      "champion": "Mossad",
      "runnerUp": "Los Esquiva Balas",
      "finalScore": "3–0",
      "groups": [
        {
          "name": "Grupo A",
          "standings": [
            {
              "teamName": "Los Esquiva Balas",
              "pj": 3,
              "w": 3,
              "l": 0,
              "pts": 9
            },
            {
              "teamName": "Montapuercos Aura",
              "pj": 3,
              "w": 2,
              "l": 1,
              "pts": 6
            },
            {
              "teamName": "Canaleros Fc",
              "pj": 3,
              "w": 1,
              "l": 2,
              "pts": 3
            },
            {
              "teamName": "Los Triple T",
              "pj": 3,
              "w": 0,
              "l": 3,
              "pts": 0
            }
          ]
        },
        {
          "name": "Grupo B",
          "standings": [
            {
              "teamName": "Mossad",
              "pj": 3,
              "w": 2,
              "l": 1,
              "pts": 6
            },
            {
              "teamName": "twentytoo",
              "pj": 3,
              "w": 2,
              "l": 1,
              "pts": 6
            },
            {
              "teamName": "The Wizards",
              "pj": 3,
              "w": 1,
              "l": 2,
              "pts": 3
            },
            {
              "teamName": "Sevino sobretti",
              "pj": 3,
              "w": 1,
              "l": 2,
              "pts": 3
            }
          ]
        }
      ],
      "bracket": [
        {
          "home": "Mossad",
          "away": "Montapuercos Aura",
          "hs": 2,
          "as": 0,
          "winner": "Mossad",
          "round": "SF"
        },
        {
          "home": "twentytoo",
          "away": "Los Esquiva Balas",
          "hs": 1,
          "as": 2,
          "winner": "Los Esquiva Balas",
          "round": "SF"
        },
        {
          "home": "Mossad",
          "away": "Los Esquiva Balas",
          "hs": 3,
          "as": 0,
          "winner": "Mossad",
          "round": "Final"
        }
      ],
      "leaders": {
        "goals": [
          {
            "name": "atalixx",
            "team": "Mossad",
            "value": 19
          },
          {
            "name": "Ros#8849",
            "team": "Los Esquiva Balas",
            "value": 17
          },
          {
            "name": "amadeomg",
            "team": "Mossad",
            "value": 12
          },
          {
            "name": "davidjoseph0979_29056",
            "team": "Los Esquiva Balas",
            "value": 11
          },
          {
            "name": "dr_tenma0",
            "team": "The Wizards",
            "value": 8
          },
          {
            "name": "yun8xz",
            "team": "Montapuercos Aura",
            "value": 6
          },
          {
            "name": "ivanmc7811",
            "team": "Montapuercos Aura",
            "value": 6
          },
          {
            "name": "XDestroyer17",
            "team": "Los Triple T",
            "value": 4
          },
          {
            "name": "choripan05303",
            "team": "Canaleros Fc",
            "value": 4
          },
          {
            "name": "adri_2125",
            "team": "Canaleros Fc",
            "value": 4
          }
        ],
        "assists": [
          {
            "name": "davidjoseph0979_29056",
            "team": "Los Esquiva Balas",
            "value": 9
          },
          {
            "name": "amadeomg",
            "team": "Mossad",
            "value": 9
          },
          {
            "name": "atalixx",
            "team": "Mossad",
            "value": 5
          },
          {
            "name": "Ros#8849",
            "team": "Los Esquiva Balas",
            "value": 4
          },
          {
            "name": "yun8xz",
            "team": "Montapuercos Aura",
            "value": 4
          },
          {
            "name": "XDestroyer17",
            "team": "Los Triple T",
            "value": 3
          },
          {
            "name": "ivanmc7811",
            "team": "Montapuercos Aura",
            "value": 2
          },
          {
            "name": "joskin01223",
            "team": "Los Triple T",
            "value": 2
          },
          {
            "name": "adri_2125",
            "team": "Canaleros Fc",
            "value": 2
          },
          {
            "name": "Cypher0529",
            "team": "Sevino sobretti",
            "value": 2
          }
        ],
        "saves": [
          {
            "name": "Ros#8849",
            "team": "Los Esquiva Balas",
            "value": 30
          },
          {
            "name": "davidjoseph0979_29056",
            "team": "Los Esquiva Balas",
            "value": 25
          },
          {
            "name": "Ghosten507",
            "team": "twentytoo",
            "value": 21
          },
          {
            "name": "atalixx",
            "team": "Mossad",
            "value": 20
          },
          {
            "name": "amadeomg",
            "team": "Mossad",
            "value": 16
          },
          {
            "name": "adri_2125",
            "team": "Canaleros Fc",
            "value": 12
          },
          {
            "name": "e_xo3_33041",
            "team": "twentytoo",
            "value": 12
          },
          {
            "name": "ivanmc7811",
            "team": "Montapuercos Aura",
            "value": 8
          },
          {
            "name": "yun8xz",
            "team": "Montapuercos Aura",
            "value": 7
          },
          {
            "name": "choripan05303",
            "team": "Canaleros Fc",
            "value": 7
          }
        ],
        "shots": [
          {
            "name": "Ros#8849",
            "team": "Los Esquiva Balas",
            "value": 45
          },
          {
            "name": "davidjoseph0979_29056",
            "team": "Los Esquiva Balas",
            "value": 27
          },
          {
            "name": "atalixx",
            "team": "Mossad",
            "value": 25
          },
          {
            "name": "yun8xz",
            "team": "Montapuercos Aura",
            "value": 19
          },
          {
            "name": "ivanmc7811",
            "team": "Montapuercos Aura",
            "value": 18
          },
          {
            "name": "XDestroyer17",
            "team": "Los Triple T",
            "value": 18
          },
          {
            "name": "amadeomg",
            "team": "Mossad",
            "value": 14
          },
          {
            "name": "dr_tenma0",
            "team": "The Wizards",
            "value": 11
          },
          {
            "name": "adri_2125",
            "team": "Canaleros Fc",
            "value": 10
          },
          {
            "name": "choripan05303",
            "team": "Canaleros Fc",
            "value": 7
          }
        ],
        "points": [
          {
            "name": "atalixx",
            "team": "Mossad",
            "value": 24
          },
          {
            "name": "Ros#8849",
            "team": "Los Esquiva Balas",
            "value": 21
          },
          {
            "name": "amadeomg",
            "team": "Mossad",
            "value": 21
          },
          {
            "name": "davidjoseph0979_29056",
            "team": "Los Esquiva Balas",
            "value": 20
          },
          {
            "name": "yun8xz",
            "team": "Montapuercos Aura",
            "value": 10
          },
          {
            "name": "dr_tenma0",
            "team": "The Wizards",
            "value": 10
          },
          {
            "name": "ivanmc7811",
            "team": "Montapuercos Aura",
            "value": 8
          },
          {
            "name": "XDestroyer17",
            "team": "Los Triple T",
            "value": 7
          },
          {
            "name": "adri_2125",
            "team": "Canaleros Fc",
            "value": 6
          },
          {
            "name": "joskin01223",
            "team": "Los Triple T",
            "value": 5
          }
        ]
      }
    },
    "elite": {
      "champion": "los espartanos",
      "runnerUp": "Acido Desoxirribonucleico",
      "finalScore": "3–1",
      "groups": [
        {
          "name": "Grupo A",
          "standings": [
            {
              "teamName": "los espartanos",
              "pj": 3,
              "w": 3,
              "l": 0,
              "pts": 9
            },
            {
              "teamName": "Karmine Corp",
              "pj": 3,
              "w": 2,
              "l": 1,
              "pts": 6
            },
            {
              "teamName": "Team BDS",
              "pj": 3,
              "w": 1,
              "l": 2,
              "pts": 3
            },
            {
              "teamName": "Ohh Si Nena",
              "pj": 3,
              "w": 0,
              "l": 3,
              "pts": 0
            }
          ]
        },
        {
          "name": "Grupo B",
          "standings": [
            {
              "teamName": "Acido Desoxirribonucleico",
              "pj": 3,
              "w": 3,
              "l": 0,
              "pts": 9
            },
            {
              "teamName": "SUHHH",
              "pj": 3,
              "w": 2,
              "l": 1,
              "pts": 6
            },
            {
              "teamName": "Ballchasing",
              "pj": 3,
              "w": 1,
              "l": 2,
              "pts": 3
            },
            {
              "teamName": "Ofi Venados",
              "pj": 3,
              "w": 0,
              "l": 3,
              "pts": 0
            }
          ]
        }
      ],
      "bracket": [
        {
          "home": "Acido Desoxirribonucleico",
          "away": "Karmine Corp",
          "hs": 2,
          "as": 1,
          "winner": "Acido Desoxirribonucleico",
          "round": "SF"
        },
        {
          "home": "los espartanos",
          "away": "SUHHH",
          "hs": 2,
          "as": 0,
          "winner": "los espartanos",
          "round": "SF"
        },
        {
          "home": "los espartanos",
          "away": "Acido Desoxirribonucleico",
          "hs": 3,
          "as": 1,
          "winner": "los espartanos",
          "round": "Final"
        }
      ],
      "leaders": {
        "goals": [
          {
            "name": "dasc2000",
            "team": "Acido Desoxirribonucleico",
            "value": 21
          },
          {
            "name": "bouche.",
            "team": "Acido Desoxirribonucleico",
            "value": 18
          },
          {
            "name": "luisfermoro",
            "team": "los espartanos",
            "value": 18
          },
          {
            "name": "Angel_Sparta507",
            "team": "los espartanos",
            "value": 15
          },
          {
            "name": "anthony_8339",
            "team": "Karmine Corp",
            "value": 10
          },
          {
            "name": "CocoRL17",
            "team": "Karmine Corp",
            "value": 8
          },
          {
            "name": "kai_sens",
            "team": "SUHHH",
            "value": 7
          },
          {
            "name": "Angel_BlazedZ",
            "team": "Ofi Venados",
            "value": 5
          },
          {
            "name": "Rodriixrl",
            "team": "Ballchasing",
            "value": 4
          },
          {
            "name": "kana.mylove",
            "team": "Team BDS",
            "value": 3
          }
        ],
        "assists": [
          {
            "name": "bouche.",
            "team": "Acido Desoxirribonucleico",
            "value": 14
          },
          {
            "name": "Angel_Sparta507",
            "team": "los espartanos",
            "value": 13
          },
          {
            "name": "luisfermoro",
            "team": "los espartanos",
            "value": 10
          },
          {
            "name": "CocoRL17",
            "team": "Karmine Corp",
            "value": 6
          },
          {
            "name": "anthony_8339",
            "team": "Karmine Corp",
            "value": 5
          },
          {
            "name": "hardpoint",
            "team": "SUHHH",
            "value": 5
          },
          {
            "name": "dasc2000",
            "team": "Acido Desoxirribonucleico",
            "value": 4
          },
          {
            "name": "sami__0",
            "team": "Ofi Venados",
            "value": 2
          },
          {
            "name": "genji_13",
            "team": "Team BDS",
            "value": 2
          },
          {
            "name": "kai_sens",
            "team": "SUHHH",
            "value": 1
          }
        ],
        "saves": [
          {
            "name": "dasc2000",
            "team": "Acido Desoxirribonucleico",
            "value": 37
          },
          {
            "name": "bouche.",
            "team": "Acido Desoxirribonucleico",
            "value": 36
          },
          {
            "name": "Angel_Sparta507",
            "team": "los espartanos",
            "value": 34
          },
          {
            "name": "luisfermoro",
            "team": "los espartanos",
            "value": 27
          },
          {
            "name": "anthony_8339",
            "team": "Karmine Corp",
            "value": 13
          },
          {
            "name": "CocoRL17",
            "team": "Karmine Corp",
            "value": 12
          },
          {
            "name": "hardpoint",
            "team": "SUHHH",
            "value": 12
          },
          {
            "name": "Angel_BlazedZ",
            "team": "Ofi Venados",
            "value": 12
          },
          {
            "name": "kana.mylove",
            "team": "Team BDS",
            "value": 9
          },
          {
            "name": "Rodriixrl",
            "team": "Ballchasing",
            "value": 7
          }
        ],
        "shots": [
          {
            "name": "bouche.",
            "team": "Acido Desoxirribonucleico",
            "value": 33
          },
          {
            "name": "Angel_Sparta507",
            "team": "los espartanos",
            "value": 31
          },
          {
            "name": "dasc2000",
            "team": "Acido Desoxirribonucleico",
            "value": 29
          },
          {
            "name": "anthony_8339",
            "team": "Karmine Corp",
            "value": 22
          },
          {
            "name": "CocoRL17",
            "team": "Karmine Corp",
            "value": 22
          },
          {
            "name": "luisfermoro",
            "team": "los espartanos",
            "value": 22
          },
          {
            "name": "kai_sens",
            "team": "SUHHH",
            "value": 19
          },
          {
            "name": "Rodriixrl",
            "team": "Ballchasing",
            "value": 16
          },
          {
            "name": "Angel_BlazedZ",
            "team": "Ofi Venados",
            "value": 15
          },
          {
            "name": "Im chopodo",
            "team": "Ballchasing",
            "value": 12
          }
        ],
        "points": [
          {
            "name": "bouche.",
            "team": "Acido Desoxirribonucleico",
            "value": 32
          },
          {
            "name": "luisfermoro",
            "team": "los espartanos",
            "value": 28
          },
          {
            "name": "Angel_Sparta507",
            "team": "los espartanos",
            "value": 28
          },
          {
            "name": "dasc2000",
            "team": "Acido Desoxirribonucleico",
            "value": 25
          },
          {
            "name": "anthony_8339",
            "team": "Karmine Corp",
            "value": 15
          },
          {
            "name": "CocoRL17",
            "team": "Karmine Corp",
            "value": 14
          },
          {
            "name": "kai_sens",
            "team": "SUHHH",
            "value": 8
          },
          {
            "name": "hardpoint",
            "team": "SUHHH",
            "value": 7
          },
          {
            "name": "Angel_BlazedZ",
            "team": "Ofi Venados",
            "value": 6
          },
          {
            "name": "Rodriixrl",
            "team": "Ballchasing",
            "value": 5
          }
        ]
      }
    }
  }
}
;