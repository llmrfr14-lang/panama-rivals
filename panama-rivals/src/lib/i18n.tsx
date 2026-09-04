"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "es" | "en";

const dict: Record<string, Record<Lang, string>> = {
  "nav.home": { es: "Inicio", en: "Home" },
  "nav.tournament": { es: "Torneo", en: "Tournament" },
  "nav.teams": { es: "Equipos", en: "Teams" },
  "nav.stats": { es: "Estadísticas", en: "Stats" },
  "nav.rules": { es: "Reglas", en: "Rules" },
  "nav.register": { es: "Registro", en: "Register" },
  "nav.s1": { es: "Temporada 1", en: "Season 1" },
  "nav.admin": { es: "Admin", en: "Admin" },
  "brand": { es: "Panamá Rivals", en: "Panama Rivals" },
  "hero.title": { es: "Panama Rivals", en: "Panama Rivals" },
  "hero.sub": { es: "Liga abierta de Rocket League en Panamá. Capitanes registran su equipo por torneo — gana 3 puntos, pierde 1, y los dos mejores de cada grupo avanzan a eliminación directa.", en: "Panama's open Rocket League league. Captains register a team per tournament — a win is 3 points, a loss −1, and the top two of each group advance to knockouts." },
  "hero.cta": { es: "Regístrate", en: "Register" },
  "hero.discord": { es: "Únete al Discord", en: "Join Discord" },
  "hero.next": { es: "Temporada 2 · por anunciar", en: "Season 2 · TBA" },
  "hero.champ": { es: "👑 Campeón T1: Porotos FC", en: "👑 S1 Champions: Porotos FC" },
  "hero.overline": { es: "LA CASA DE LAS", en: "THE HOME OF" },
  "hero.kicker": { es: "CORRIDAS AL TÍTULO", en: "CHAMPIONSHIP RUNS" },
  "hero.tagline2": { es: "Ligas abiertas", en: "Open leagues" },
  "hero.kicker2": { es: "CREADORES DE LEGADO", en: "LEGACY MAKERS" },
  "exp.kicker": { es: "VIVE EL SIGUIENTE NIVEL", en: "EXPERIENCE THE NEXT LEVEL" },
  "exp.title": { es: "Más que un rango. Una liga.", en: "More than a rank. A league." },
  "exp.1.title": { es: "Construye tu legado", en: "Build a Legacy" },
  "exp.1.body": { es: "Olvida los randoms. Arma tu equipo, inscríbelo por torneo, y haz tu nombre en la escena de Panamá.", en: "Forget random teammates. Build your team, register it each tournament, and make a name for yourself in Panama's scene." },
  "exp.2.title": { es: "Bajo los reflectores", en: "Step into the Spotlight" },
  "exp.2.body": { es: "Partidos todos el mismo día, streams y clip de tus jugadas para subir tu draft stock.", en: "All matches on a single day, with streams and highlights to raise your draft stock." },
  "exp.3.title": { es: "Operaciones profesionales", en: "Professional Operations" },
  "exp.3.body": { es: "Formato claro, reglas firmes y un staff que resuelve disputas rápido. Tu te enfocas en jugar.", en: "Clear format, firm rules, and astaff that settles disputes fast. You focus on playing." },
  "tiers.kicker": { es: "UN LUGAR PARA CADA RANGO", en: "A PLACE FOR EVERY RANK" },
  "tiers.title": { es: "Del diamante al supersónico legendario.", en: "From Diamond to Supersonic Legend." },
  "tiers.cta": { es: "Ver el torneo", en: "View the tournament" },
  "stats.kicker": { es: "LA LIGA EN CIFRAS", en: "THE LEAGUE IN NUMBERS" },
  "stats.1": { es: "Jugadores", en: "Players" },
  "stats.2": { es: "Equipos", en: "Teams" },
  "stats.3": { es: "Grupos", en: "Groups" },
  "stats.4": { es: "Campeón T1", en: "S1 Champion" },
  "s1.title": { es: "TEMPORADA 1", en: "SEASON 1" },
  "s1.champion": { es: "Campeón", en: "Champion" },
  "s1.runnerup": { es: "Subcampeón", en: "Runner-up" },
  "s1.groups": { es: "Fase de grupos — tabla final", en: "Group stage — final table" },
  "s1.bracket": { es: "Eliminación directa — resultados", en: "Knockout — results" },
  "s1.leaders": { es: "Líderes de estadísticas", en: "Stat leaders" },
  "s1.qf": { es: "Cuartos de final · Bo3", en: "Quarterfinals · Bo3" },
  "s1.sf": { es: "Semifinales · Bo3", en: "Semifinals · Bo3" },
  "s1.final": { es: "Gran final · Bo5", en: "Grand Final · Bo5" },
  "s1.goals": { es: "Goles", en: "Goals" },
  "s1.assists": { es: "Asistencias", en: "Assists" },
  "s1.saves": { es: "Salvadas", en: "Saves" },
  "s1.shots": { es: "Tiros", en: "Shots" },
  "s1.pointsLabel": { es: "Puntos", en: "Points" },
  "how.title": { es: "CÓMO FUNCIONA", en: "HOW IT WORKS" },
  "how.groups": { es: "4 grupos de round robin — A y B con 5 equipos, C y D con 4.", en: "4 round-robin groups — A & B with 5 teams, C & D with 4." },
  "how.points": { es: "Gana = +3 puntos. Pierde = −1 punto. Empates se resuelven con partido de desempate.", en: "Win = +3 points. Loss = −1 point. Ties broken by a tiebreaker match." },
  "how.knockout": { es: "Top 2 de cada grupo → Cuartos (Bo3) → Semis (Bo3) → Final (Bo5).", en: "Top 2 per group → Quarterfinals (Bo3) → Semifinals (Bo3) → Final (Bo5)." },
  "how.stats": { es: "Los capitanes envían resultados y el tablero de goles/asistencias/salvadas/tiros. La admin aprueba y el leaderboard se actualiza.", en: "Captains submit results & scoreboards for goals/assists/saves/shots. Admins approve, and the leaderboard updates." },
  "how.matchday": { es: "Los partidos se juegan el día del torneo a las 7pm, desde grupos hasta la gran final.", en: "Matches play on tournament day at 7pm, group stage straight through to the grand final." },
  "tournament.groups": { es: "Fase de grupos", en: "Group Stage" },
  "tournament.bracket": { es: "Eliminación directa", en: "Knockout Bracket" },
  "tournament.legend": { es: "W = Victoria, L = Derrota. Puntos: W +3, L −1.", en: "W = Win, L = Loss. Points: W +3, L −1." },
  "stats.leaderboard": { es: "Leaderboard", en: "Leaderboard" },
  "stats.goals": { es: "Goles", en: "Goals" },
  "stats.assists": { es: "Asistencias", en: "Assists" },
  "stats.saves": { es: "Salvadas", en: "Saves" },
  "stats.shots": { es: "Tiros", en: "Shots" },
  "stats.points": { es: "Puntos (G+A)", en: "Points (G+A)" },
  "teams.roster": { es: "Plantilla", en: "Roster" },
  "admin.pending": { es: "Resultados pendientes", en: "Pending results" },
  "admin.approve": { es: "Aprobar", en: "Approve" },
  "admin.decline": { es: "Rechazar", en: "Decline" },
  "admin.none": { es: "Nada pendiente. Nuevos resultados aparecen aquí.", en: "Nothing pending. Newly submitted results show up here." },
  "submit.title": { es: "Enviar resultado", en: "Submit Result" },
  "submit.pick": { es: "Partido", en: "Match" },
  "submit.score": { es: "Marcador", en: "Score" },
  "submit.statsfor": { es: "Estadísticas por jugador", en: "Per-player stats" },
  "submit.button": { es: "Enviar para revisión", en: "Submit for review" },
  "submit.done": { es: "✔ Recibido — pendiente de revisión", en: "✔ Received — pending review" },
};

type I18nCtx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("pr-lang") as Lang | null;
    if (saved === "es" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("pr-lang", l);
  };

  const t = (key: string) => dict[key]?.[lang] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
