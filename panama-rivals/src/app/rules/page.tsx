"use client";

const rules = [
  {
    title: "Formato",
    body: [
      "18 equipos repartidos en 4 grupos (A y B con 5; C y D con 4).",
      "Round robin de grupo: cada equipo juega contra todos en su grupo.",
      "Victoria = +3 puntos · Derrota = −1 punto.",
      "Empates en puntos se resuelven con un partido de desempate (tiebreaker).",
      "Top 2 de cada grupo avanzan a eliminación directa: Cuartos Bo3 · Semis Bo3 · Gran Final Bo5.",
    ],
  },
  {
    title: "Partidos en el día del torneo",
    body: [
      "Todo el torneo transcurre el mismo día, desde las 7:00pm.",
      "Lobby y oponente se anuncian en Discord antes de cada serie.",
      "Capturas del marcador del post-partido sirven como respaldo.",
    ],
  },
  {
    title: "Resultados y estadísticas",
    body: [
      "El capitán ganador envía el resultado con estadísticas por jugador (goles, asistencias, salvadas, tiros).",
      "La admin del torneo aprueba o rechaza el resultado antes de que cuente para standings y leaderboards.",
      "Una vez aprobado, tabla de grupo y stats de jugadores se actualizan automáticamente.",
    ],
  },
  {
    title: "Comportamiento",
    body: [
      "Respeto en el chat y el lobby — esto es nuestra comunidad.",
      "Chat de 'buena suerte' al inicio. 'gg' al final.",
      "Discusiones o disputas se resuelven en el canal de Discord del torneo.",
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">Reglas</h1>
      <div className="mt-10 space-y-6">
        {rules.map((r) => (
          <section key={r.title} className="rounded-xl border border-rivals-border bg-rivals-surface p-6">
            <h2 className="font-display text-xl font-bold text-rivals-gold">{r.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
              {r.body.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
