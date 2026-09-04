"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

type Contact = { discord: string; epicId: string };

const emptyContact = (): Contact => ({ discord: "", epicId: "" });

export default function RegisterPage() {
  const { lang } = useI18n();
  const { registerTeam } = useStore();
  const [state, setState] = useState({
    team: "",
    captain: emptyContact(),
    players: [emptyContact(), emptyContact(), emptyContact()],
  });
  const [done, setDone] = useState(false);

  const en = lang === "en";

  const setCaptain = (k: keyof Contact, v: string) =>
    setState((s) => ({ ...s, captain: { ...s.captain, [k]: v } }));

  const setPlayer = (i: number, k: keyof Contact, v: string) =>
    setState((s) => ({
      ...s,
      players: s.players.map((p, j) => (j === i ? { ...p, [k]: v } : p)),
    }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (done) return;
    const norm = (c: Contact) => ({ discord: c.discord.trim(), epicId: c.epicId.trim() });
    const players = state.players.map(norm);
    // If 2v2: the 3rd slot may be blank — normalize to "NA"
    const roster = players.map((p, i) => (i === 2 && !p.discord && !p.epicId ? { discord: "NA", epicId: "NA" } : p));
    registerTeam(state.team.trim(), norm(state.captain), roster);
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

        <fieldset className="rounded-2xl border border-white/8 bg-white/3 p-4">
          <legend className="px-1 text-sm font-semibold text-rivals-gold">
            {en ? "Captain" : "Capitán"}
          </legend>
          <div className="mt-2 space-y-3">
            <label className="block">
              <span className="text-xs text-slate-400">Discord</span>
              <input
                required
                value={state.captain.discord}
                onChange={(e) => setCaptain("discord", e.target.value)}
                className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
                placeholder={en ? "E.g.: @Tito or Tito#1234" : "Ej: @Tito o Tito#1234"}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">
                {en ? "Epic Games ID" : "ID de Epic Games"}
              </span>
              <input
                required
                value={state.captain.epicId}
                onChange={(e) => setCaptain("epicId", e.target.value)}
                className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
                placeholder={en ? "E.g.: TitoRL" : "Ej: TitoRL"}
              />
            </label>
          </div>
        </fieldset>

        <p className="text-xs text-slate-500">
          {en
            ? "Format: 3v3 (3 players) or 2v2 (write \"NA\" in the 3rd player slots)."
            : "Formato: 3v3 (3 jugadores) o 2v2 (escribe \"NA\" en los campos del 3er jugador)."}
        </p>

        {state.players.map((p, i) => (
          <fieldset
            key={i}
            className="rounded-2xl border border-white/8 bg-white/3 p-4"
          >
            <legend className="px-1 text-sm font-semibold text-rivals-gold">
              {en ? "Player" : "Jugador"} {i + 1}
              {i === 2 && (
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({en ? "2v2? write NA" : "¿2v2? escribe NA"})
                </span>
              )}
            </legend>
            <div className="mt-2 space-y-3">
              <label className="block">
                <span className="text-xs text-slate-400">Discord</span>
                <input
                  value={p.discord}
                  onChange={(e) => setPlayer(i, "discord", e.target.value)}
                  required={i < 2}
                  className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
                  placeholder={i === 2 ? "NA" : en ? "E.g.: @Rooster" : "Ej: @Rooster"}
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">
                  {en ? "Epic Games ID" : "ID de Epic Games"}
                </span>
                <input
                  value={p.epicId}
                  onChange={(e) => setPlayer(i, "epicId", e.target.value)}
                  required={i < 2}
                  className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
                  placeholder={i === 2 ? "NA" : en ? "E.g.: RoosterRL" : "Ej: RoosterRL"}
                />
              </label>
            </div>
          </fieldset>
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
