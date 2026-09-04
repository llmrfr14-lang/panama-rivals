"use client";

import { useI18n } from "@/lib/i18n";

type Rule = { title: { es: string; en: string }; body: { es: string; en: string }[] };

const rules: Rule[] = [
  {
    title: { es: "Formato", en: "Format" },
    body: [
      {
        es: "18 equipos repartidos en 4 grupos (A y B con 5; C y D con 4).",
        en: "18 teams split into 4 groups (A and B with 5; C and D with 4).",
      },
      {
        es: "Round robin de grupo: cada equipo juega contra todos en su grupo.",
        en: "Group round robin: every team plays everyone in its group.",
      },
      {
        es: "Victoria = +3 puntos · Derrota = −1 punto.",
        en: "Win = +3 points · Loss = −1 point.",
      },
      {
        es: "Empates en puntos se resuelven con un partido de desempate (tiebreaker).",
        en: "Ties on points are settled with a tiebreaker match.",
      },
      {
        es: "Top 2 de cada grupo avanzan a eliminación directa: Cuartos Bo3 · Semis Bo3 · Gran Final Bo5.",
        en: "Top 2 from each group advance to the knockout bracket: Quarterfinals Bo3 · Semifinals Bo3 · Grand Final Bo5.",
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
