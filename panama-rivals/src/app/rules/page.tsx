"use client";

import { useI18n } from "@/lib/i18n";

type Rule = { title: { es: string; en: string }; body: { es: string; en: string }[] };

const rules: Rule[] = [
  {
    title: { es: "Divisiones", en: "Divisions" },
    body: [
      {
        es: "La Temporada 2 tiene dos divisiones separadas: Challenger (pico máximo Champion 2 y debajo) y Elite (Champion 3 y arriba. Cada división tiene sus propios grupos, bracket, stats y campeón.",
        en: "Season 2 has two separate divisions: Challenger (peak rank Champion 2 and below) and Elite (Champion 3 and above. Each division has its own groups, bracket, stats and champion.",
      },
      {
        es: "El equipo entra en Elite si alguno de sus jugadores tiene rank máximo Champion 3 o superior; de lo contrario, en Challenger.",
        en: "A team lands in Elite when any player peak rank is Champion 3 or above; otherwise, Challenger.",
      },
    ],
  },
  {
    title: { es: "Formato", en: "Format" },
    body: [
      {
        es: "Los grupos se deciden por sorteo en directo, mediante los medios de transmisión oficiales. El tamaño de los grupos depende del número de equipos registrados.",
        en: "Groups are decided by direct draw on official broadcast channels. Group sizes depend on how many teams register.",
      },
      {
        es: "Hasta 10 equipos: se forman 2 grupos y pasan los 2 mejores de cada uno.",
        en: "Up to 10 teams:  2 groups, top 2 from each advance.",
      },
      {
        es: "De 10 a 23 equipos: se forman 4 grupos y pasan los 2 mejores de cada uno.",
        en: "Between 10 and  23 teams:  4 groups, top 2 from each advance.",
      },
      {
        es: "24 equipos o más: se forman 8 grupos y pasa el mejor de cada uno.",
        en: "24 or more teams:  8 groups, top 1 from each advance.",
      },
      {
        es: "Round robin de grupo: cada equipo juega contra todos en su grupo.",
        en: "Group round robin: every team plays everyone in its group.",
      },
      {
        es: "Victoria = +3 puntos · Empate = +1 · Derrota = 0 puntos.",
        en: "Win = +3 points · Draw = +1 · Loss = 0 points.",
      },
      {
        es: "Al quedar dos equipos empatados a puntos, pasa el equipo que haya ganado el enfrentamiento directo.",
        en: "When two teams tie on points, the head-to-head winner advances.",
      },
      {
        es: "Con 2 grupos, la siguiente ronda es la final. Con más de 2 grupos, se juegan eliminatorias hasta que queden dos y se hace la final. Cuartos Bo3 · Semis Bo3 · Gran Final Bo5.",
        en: "With 2 groups,the next round is the final. With more than 2 groups, knockouts run until two remain, then the final. Quarterfinals Bo3 · Semifinals Bo3 · Grand Final Bo5.",
      },
    ],
  },
  {
    title: { es: "Partidos en el día del torneo", en: "Match day" },
    body: [
      {
        es: "Todo el torneo transcurre el mismo día, desde las 7:00pm.",
        en: "The whole tournament happens in a single day, starting at 7:00pm.",
      },
      {
        es: "Lobby y oponente se anuncian en Discord antes de cada serie.",
        en: "Lobby and opponent are announced on Discord before each series.",
      },
      {
        es: "Capturas del marcador del post-partido sirven como respaldo.",
        en: "Post-game scoreboard screenshots serve as backup proof.",
      },
    ],
  },
  {
    title: { es: "Resultados y estadísticas", en: "Results and stats" },
    body: [
      {
        es: "El capitán ganador envía el resultado con estadísticas por jugador (goles, asistencias, salvadas, tiros).",
        en: "The winning captain submits the result with per-player stats (goals, assists, saves, shots).",
      },
      {
        es: "La admin del torneo aprueba o rechaza el resultado antes de que cuente para standings y leaderboards.",
        en: "The tournament admin approves or declines the result before it counts toward standings and leaderboards.",
      },
      {
        es: "Una vez aprobado, tabla de grupo y stats de jugadores se actualizan automáticamente.",
        en: "Once approved, the group table and player stats update automatically.",
      },
    ],
  },
  {
    title: { es: "Comportamiento", en: "Conduct" },
    body: [
      {
        es: "Respeto en el chat y el lobby — esto es nuestra comunidad.",
        en: "Respect in chat and in the lobby — this is our community.",
      },
      {
        es: "Chat de 'buena suerte' al inicio. 'gg' al final.",
        en: "A 'good luck' in chat to start. A 'gg' to finish.",
      },
      {
        es: "Discusiones o disputas se resuelven en el canal de Discord del torneo.",
        en: "Arguments or disputes get resolved in the tournament Discord channel.",
      },
    ],
  },
];

export default function RulesPage() {
  const { lang } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">
        {lang === "en" ? "Rules" : "Reglas"}
      </h1>
      <div className="mt-10 space-y-6">
        {rules.map((r) => (
          <section key={r.title.en} className="glass-card rounded-3xl p-6">
            <h2 className="font-display text-xl font-bold text-rivals-gold">{r.title[lang]}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
              {r.body.map((b) => (
                <li key={b.en}>{b[lang]}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
