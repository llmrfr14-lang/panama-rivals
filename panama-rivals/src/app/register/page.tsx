"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useStore, type PlayerInfo } from "@/lib/store";

type CaptainForm = { discord: string; epicId: string; phone: string };
type PlayerForm = { discord: string; epicId: string; phone: string; nationality: string; peakRank: string };

const emptyCaptain = (): CaptainForm => ({ discord: "", epicId: "", phone: "" });
const emptyPlayer = (): PlayerForm => ({ discord: "", epicId: "", phone: "", nationality: "", peakRank: "" });

export default function RegisterPage() {
  const { lang } = useI18n();
  const { registerTeam } = useStore();
  const [state, setState] = useState({
    team: "",
    captain: emptyCaptain(),
    players: [emptyPlayer(), emptyPlayer(), emptyPlayer()],
  });
const [done, setDone] = useState(false);



  const en = lang === "en";



  const setCaptain = (k: keyof CaptainForm, v: string) =>
    setState((s) => ({ ...s, captain: { ...s.captain, [k]: v } }));



  const setPlayer = (i: number, k: keyof PlayerForm, v: string) =>
    setState((s) => ({
      ...s,
      players: s.players.map((p, j) => (j === i ? { ...p, [k]: v } : p)),
    }));



  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (done) return;
    const normC = (c: CaptainForm) => ({
      discord: c.discord.trim(),
      epicId: c.epicId.trim(),
      phone: c.phone.trim(),
    });
    const normP = (p: PlayerForm, i: number): PlayerInfo => {
      const blank3 = i === 2 && !p.discord.trim() && !p.epicId.trim() && !p.nationality && !p.peakRank.trim();
      return {
        discord: blank3 ? "NA" : p.discord.trim(),
        phone: blank3 ? "NA" : p.phone.trim(),
        epicId: blank3 ? "NA" : p.epicId.trim(),
        nationality: blank3 ? "na" : ((p.nationality || "pa") as PlayerInfo["nationality"]),
        peakRank: blank3 ? "NA" : p.peakRank.trim(),
      };
    };
    registerTeam(state.team.trim(), normC(state.captain), state.players.map(normP));
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
          
              <label className="block">
                <span className="text-xs text-slate-400">
                  {en ? "Phone / WhatsApp" : "Teléfono / WhatsApp"}
                </span>
                <input
                  required
                  type="tel"
                  value={state.captain.phone}
                  onChange={(e) => setCaptain("phone", e.target.value)}
                  className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
                  placeholder={en ? "E.g.: +507 6XXX-XXXX" : "Ej: +507 6XXX-XXXX"}
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
            
              <label className="block">
                <span className="text-xs text-slate-400">
                  {en ? "Is this player Panamanian?" : "¿Este jugador es panameño?"}
                </span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 cursor-pointer transition has-[:checked]:border-rivals-gold/60">
                    <input
                      type="radio"
                      name={`nat-${i}`}
                      value="pa"
                      checked={(p.nationality || "pa") === "pa"}
                      onChange={(e) => setPlayer(i, "nationality", e.target.value)}
                      className="accent-rivals-gold"
                    />
                    <span className="emoji">🇵🇦</span>
                    <span className="text-sm">Panameño</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 cursor-pointer transition has-[:checked]:border-rivals-blue/60">
                    <input
                      type="radio"
                      name={`nat-${i}`}
                      value="int"
                      checked={(p.nationality || "pa") === "int"}
                      onChange={(e) => setPlayer(i, "nationality", e.target.value)}
                      className="accent-rivals-blue"
                    />
                    <span className="emoji">🌎</span>
                    <span className="text-sm">Internacional</span>
                  </label>
                
              <label className="block">
                <span className="text-xs text-slate-400">
                  {en ? "Phone / WhatsApp" : "Teléfono / WhatsApp"}
                </span>
                <input
                  type="tel"
                  value={p.phone}
                  onChange={(e) => setPlayer(i, "phone", e.target.value)}
                  required={i < 2}
                  className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
                  placeholder={i === 2 ? "NA" : en ? "E.g.: +507 6XXX-XXXX" : "Ej: +507 6XXX-XXXX"}
                />
              </label>

</div>
              </label>
              <label className="block">
                <span className="text-xs text-slate-400">
                  {en ? "Peak rank (e.g.: Diamond 2, D1, Champ 3...)" : "Rank máximo (ej: Diamante 2, D1, Champ 3...)"}
                </span>
                <input
                  value={p.peakRank}
                  onChange={(e) => setPlayer(i, "peakRank", e.target.value)}
                  required={i < 2}
                  className="mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20"
                  placeholder={i === 2 ? "NA" : en ? "E.g.: Diamond 2" : "Ej: Diamante 2"}
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
