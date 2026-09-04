"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function RegisterPage() {
  const { lang } = useI18n();
  const { registerTeam } = useStore();
  const [state, setState] = useState({ team: "", captain: "", players: ["", "", ""] });
  const [done, setDone] = useState(false);

  const en = lang === "en";

  const setPlayer = (i: number, v: string) =>
    setState((s) => ({ ...s, players: s.players.map((p, j) => (j === i ? v : p)) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (done) return;
    registerTeam(state.team.trim(), state.captain.trim(), state.players.map((p) => p.trim()));
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl font-black">{en ? "Register" : "Registro"}</h1>
      <p className="mt-2 text-slate-400">
        {en
          ? "The captain registers the team per tournament — name and a roster of 3. When the tournament starts, registration closes."
          : "El capitán registra el equipo por torneo — nombre y plantilla de 3. Cuando el torneo inicia, el registro cierra."}
      </p>

      <form onSubmit={submit} className="mt-10 space-y-5 glass-card rounded-3xl p-6">
        <label className="block">
          <span className="text-sm text-slate-400">{en ? "Team name" : "Nombre del equipo"}</span>
          <input
            required
            value={state.team}
            onChange={(e) => setState((s) => ({ ...s, team: e.target.value }))}
            className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
            placeholder={en ? "E.g.: The Canaleros" : "Ej: Los Canaleros"}
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">
            {en ? "Captain (Discord / handle)" : "Capitán (Discord / handle)"}
          </span>
          <input
            required
            value={state.captain}
            onChange={(e) => setState((s) => ({ ...s, captain: e.target.value }))}
            className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
            placeholder={en ? "E.g.: @Tito / Tito#1234" : "Ej: @Tito / Tito#1234"}
          />
        </label>

        {state.players.map((p, i) => (
          <label key={i} className="block">
            <span className="text-sm text-slate-400">
              {en ? "Player" : "Jugador"} {i + 1}
            </span>
            <input
              required
              value={p}
              onChange={(e) => setPlayer(i, e.target.value)}
              className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={done}
          className="w-full soft-ring rounded-full bg-rivals-red py-3 font-bold text-white shadow-[0_8px_24px_rgba(230,57,70,0.35)] transition disabled:opacity-50 hover:enabled:brightness-110"
        >
          {done
            ? en
              ? "✓ Received — pending group draw"
              : "✓ Recibido — pendiente de sorteo"
            : en
              ? "Register team"
              : "Registrar equipo"}
        </button>
        {done && (
          <p className="text-center text-sm text-emerald-300">
            {en
              ? "Your team is registered for Season 2. The admin assigns it to a group at the draw."
              : "Tu equipo quedó registrado para la Temporada 2. La admin lo asigna a un grupo en el sorteo."}
          </p>
        )}
      </form>

      <p className="mt-4 text-xs text-slate-500">
        {en
          ? "Registration links to the next tournament. When closed, this form becomes a 'substitute registration' until it opens again."
          : 'Registro se enlaza al siguiente torneo. Cuando está cerrado, este formulario se convierte en "registro de suplente" para luego abrirse de nuevo.'}
      </p>
    </div>
  );
}
