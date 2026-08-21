"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export default function RegisterPage() {
  const { registerTeam } = useStore();
  const [state, setState] = useState({ team: "", captain: "", players: ["", "", ""] });
  const [done, setDone] = useState(false);

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
      <h1 className="font-display text-4xl font-black">Registro</h1>
      <p className="mt-2 text-slate-400">
        El capitán registra el equipo por torneo — nombre y plantilla de 3. Cuando el torneo inicia,
        el registro cierra.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-5 rounded-xl border border-rivals-border bg-rivals-surface p-6">
        <label className="block">
          <span className="text-sm text-slate-400">Nombre del equipo</span>
          <input
            required
            value={state.team}
            onChange={(e) => setState((s) => ({ ...s, team: e.target.value }))}
            className="mt-1 w-full rounded border border-rivals-border bg-rivals-bg px-3 py-2 outline-none focus:border-rivals-blue"
            placeholder="Ej: Los Canaleros"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Capitán (Discord / handle)</span>
          <input
            required
            value={state.captain}
            onChange={(e) => setState((s) => ({ ...s, captain: e.target.value }))}
            className="mt-1 w-full rounded border border-rivals-border bg-rivals-bg px-3 py-2 outline-none focus:border-rivals-blue"
            placeholder="Ej: @Tito / Tito#1234"
          />
        </label>

        {state.players.map((p, i) => (
          <label key={i} className="block">
            <span className="text-sm text-slate-400">Jugador {i + 1}</span>
            <input
              required
              value={p}
              onChange={(e) => setPlayer(i, e.target.value)}
              className="mt-1 w-full rounded border border-rivals-border bg-rivals-bg px-3 py-2 outline-none focus:border-rivals-blue"
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={done}
          className="w-full rounded bg-rivals-red py-3 font-bold text-white transition disabled:opacity-50 hover:enabled:brightness-110"
        >
          {done ? "✓ Recibido — pendiente de sorteo" : "Registrar equipo"}
        </button>
        {done && (
          <p className="text-center text-sm text-emerald-300">
            Tu equipo quedó registrado para la Temporada 2. La admin lo asigna a un grupo en el sorteo.
          </p>
        )}
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Registro se enlaza al siguiente torneo. Cuando está cerrado, este formulario se convierte en
        "registro de suplente" para luego abrirse de nuevo.
      </p>
    </div>
  );
}
