"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { divisionForRank } from "@/lib/league";
import { useStore, type PlayerInfo } from "@/lib/store";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type CaptainForm = { discord: string; epicId: string; phone: string };
type PlayerForm = { discord: string; epicId: string; phone: string; nationality: string; peakRank: string };

const emptyCaptain = (): CaptainForm => ({ discord: "", epicId: "", phone: "" });
const emptyPlayer = (): PlayerForm => ({ discord: "", epicId: "", phone: "", nationality: "", peakRank: "" });

const STEPS = [
  { id: "team", es: "Equipo", en: "Team" },
  { id: "captain", es: "Capitán", en: "Captain" },
  { id: "players", es: "Jugadores", en: "Players" },
  { id: "summary", es: "Resumen", en: "Summary" },
] as const;

const inputCls =
  "mt-1 w-full soft-ring rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 backdrop-blur-md transition focus:border-white/20";

export default function RegisterPage() {
  const { lang } = useI18n();
  const { registerTeam, registrations, supabaseConfigured } = useStore();
  const [step, setStep] = useState<number>(0);
  const [form, setForm] = useState({
    team: "",
    captain: emptyCaptain(),
    players: [emptyPlayer(), emptyPlayer(), emptyPlayer()],
  });
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);
  const myId = typeof window !== "undefined" ? localStorage.getItem("rivals_team_id") : null;
  const myReg = myId ? registrations.find((r) => r.id === myId) : undefined;

  const en = lang === "en";
  const isLast = step === STEPS.length - 1;

  const setTeam = (v: string) => setForm((s) => ({ ...s, team: v }));
  const setCaptain = (k: keyof CaptainForm, v: string) =>
    setForm((s) => ({ ...s, captain: { ...s.captain, [k]: v } }));
  const setPlayer = (i: number, k: keyof PlayerForm, v: string) =>
    setForm((s) => ({
      ...s,
      players: s.players.map((p, j) => (j === i ? { ...p, [k]: v } : p)),
    }));

  // ── per-step validation ──
  const teamValid = form.team.trim().length >= 2;
  const captainValid =
    form.captain.discord.trim().length >= 2 &&
    form.captain.epicId.trim().length >= 2 &&
    form.captain.phone.trim().length >= 6;
  const playersValid = (() => {
    const slotValid = (p: PlayerForm, i: number) => {
      const blank3 = i === 2 && !p.discord.trim() && !p.epicId.trim() && !p.phone.trim() && !p.nationality && !p.peakRank.trim();
      if (i === 2 && blank3) return true;
      return Boolean(p.discord.trim() && p.epicId.trim() && p.phone.trim() && p.peakRank.trim());
    };
    return form.players.every((p, i) => slotValid(p, i));
  })();
  const canGoNext =
    step === 0 ? teamValid :
    step === 1 ? captainValid :
    step === 2 ? playersValid :
    true;

  const next = () => {
    setTouched(true);
    if (!canGoNext) return;
    if (isLast) submit();
    else setStep((s) => s + 1);
  };
  const back = () => {
    if (step === 0 || done) return;
    setTouched(false);
    setStep((s) => s - 1);
  };
  const goTo = (i: number) => {
    if (i < step && !done) {
      setTouched(false);
      setStep(i);
    }
  };

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

  const submit = () => {
    if (done) return;
    const reg = registerTeam(form.team.trim(), normC(form.captain), form.players.map(normP));
    localStorage.setItem("rivals_team_id", reg.id);
    setDone(true);
  };

  const elite = form.players.some((p) => divisionForRank(p.peakRank) === "elite");
  const summaryRows = useMemo(() => {
    const rows: { label: string; value: string }[] = [];
    rows.push({ label: en ? "Team" : "Equipo", value: form.team.trim() || "—" });
    rows.push({ label: "División", value: elite ? "⚡ Elite (C3+)" : "🛡️ Challenger (≤C2)" });
    rows.push({ label: en ? "Captain (Discord)" : "Capitán (Discord)", value: form.captain.discord.trim() || "—" });
    rows.push({ label: "Epic Games", value: form.captain.epicId.trim() || "—" });
    rows.push({ label: en ? "WhatsApp" : "Teléfono", value: form.captain.phone.trim() || "—" });
    form.players.forEach((p, i) => {
      if (!p.discord.trim() && !p.epicId.trim() && !p.phone.trim() && !p.nationality && !p.peakRank.trim()) return;
      rows.push({
        label: `${en ? "Player" : "Jugador"} ${i + 1}`,
        value: `${p.discord.trim() || "—"} · ${p.epicId.trim() || "—"} · ${p.phone.trim() || "—"} · ${p.nationality === "int" ? "🌎" : "🇵🇦"} · ${p.peakRank.trim() || "—"}`,
      });
    });
    return rows;
  }, [form.team, form.captain, form.players, en, elite]);

  const progress = (((step + (isLast ? 1 : 0)) / STEPS.length) * 100);const playerLabel = (i: number) =>
    i === 2
      ? `${en ? "Player 3" : "Jugador 3"} (${en ? "2v2? leave empty" : "¿2v2? déjalo vacío"})`
      : `${en ? "Player" : "Jugador"} ${i + 1}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Breadcrumbs items={[{ label: en ? "Register" : "Registro" }]} lang={lang} />
      <h1 className="font-display text-4xl font-black">{en ? "Register" : "Registro"}</h1>
      {!supabaseConfigured && (
        <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
          {en
            ? "⚠️ Shared team list not configured — your registration only lives in this browser until the admin adds Supabase keys."
            : "⚠️ La lista compartida de equipos no está configurada — tu registro solo vive en este navegador hasta que la admin agregue las claves de Supabase."}
        </p>
      )}

      {/* ── Progress bar ── */}
      {!done && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={i >= step || done}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold transition ${i === step ? "bg-rivals-red/20 text-rivals-red ring-1 ring-rivals-red/40" : i < step ? "text-emerald-400 hover:bg-white/5" : "text-slate-600"}`}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      i < step ? "bg-emerald-500/20" : i === step ? "bg-rivals-red/30" : "bg-white/5"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </span>
                  {s[en ? "en" : "es"]}
                </button>
              ))}
            </div>
            <span className="text-slate-500">
              Paso {step + 1} / {STEPS.length}
            </span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-rivals-red via-rivals-gold to-rivals-blue transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); next(); }} className="mt-6 space-y-5 glass-card rounded-3xl p-6">
        {/* ── STEP 1: Equipo ── */}
        {step === 0 && (
          <div className="fade-slide space-y-4">
            <p className="text-sm text-slate-400">
              {en
                ? "The captain registers the team per tournament — name and a roster of 3. When the tournament starts, registration closes."
                : "El capitán registra el equipo por torneo — nombre y plantilla de 3. Cuando el torneo inicia, el registro cierra."}
            </p>
            <label className="block">
              <span className="text-sm text-slate-400">{en ? "Team name" : "Nombre del equipo"}</span>
              <input
                autoFocus
                required
                value={form.team}
                onChange={(e) => setTeam(e.target.value)}
                className={inputCls}
                placeholder={en ? "E.g.: The Canaleros" : "Ej: Los Canaleros"}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400">{en ? "Division:" : "División:"}</span>
              {elite ? (
                <span className="soft-ring rounded-full border border-rivals-gold/40 bg-rivals-gold/10 px-3 py-1 font-bold text-rivals-gold">
                  ⚡ Elite · Champion 3+
                </span>
              ) : (
                <span className="soft-ring rounded-full border border-rivals-blue/40 bg-rivals-blue/10 px-3 py-1 font-bold text-rivals-blue">
                  🛡️ Challenger · ≤ Champion 2
                </span>
              )}
              <p className="w-full text-xs text-slate-500">
                {en
                  ? "A team is placed in Elite when any player's peak rank is Champion 3 or above."
                  : "El equipo entra en Elite cuando algún jugador tiene rank máximo Champion 3 o superior."}
              </p>
            </div>
            {touched && !teamValid && (
              <p className="text-xs font-semibold text-rose-400">
                {en ? "Write a team name (min. 2 characters." : "Escribe un nombre de equipo (mín. 2 caracteres."}
              </p>
            )}
          </div>
        )}

        {/* ── STEP  ​2: Capitán ── */}
        {step === 1 && (
          <div className="fade-slide space-y-3">
            <p className="text-sm font-semibold text-rivals-gold">{en ? "Captain" : "Capitán"}</p>
            <label className="block">
              <span className="text-xs text-slate-400">Discord</span>
              <input
                autoFocus
                required
                value={form.captain.discord}
                onChange={(e) => setCaptain("discord", e.target.value)}
                className={inputCls}
                placeholder={en ? "E.g.: @Tito or Tito#1234" : "Ej: @Tito o Tito#1234"}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">
                {en ? "Epic Games ID" : "ID de Epic Games"}
              </span>
              <input
                required
                value={form.captain.epicId}
                onChange={(e) => setCaptain("epicId", e.target.value)}
                className={inputCls}
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
                value={form.captain.phone}
                onChange={(e) => setCaptain("phone", e.target.value)}
                className={inputCls}
                placeholder={en ? "E.g.: +507 6XXX-XXXX" : "Ej: +507 6XXX-XXXX"}
              />
            </label>
            {touched && !captainValid && (
              <p className="text-xs font-semibold text-rose-400">
                {en
                  ? "Complete Discord, Epic ID and WhatsApp (min. 6 chars.)."
                  : "Completa Discord, ID de Epic y WhatsApp (mín. 6 caracteres."}
              </p>
            )}
          </div>
        )}

        {/* ── STEP  ​3: Jugadores ── */}
        {step === 2 && (
          <div className="fade-slide space-y-4">
            <p className="text-xs text-slate-500">
              {en
                ? "Format: 3v3 (3 players) or 2v2 (leave the 3rd player fields empty)."
                : "Formato: 3v3 (3 jugadores) o 2v2 (deja vacíos los campos del 3er jugador.."}
            </p>
            {form.players.map((p, i) => (
              <fieldset
                key={i}
                className="rounded-2xl border border-white/8 bg-white/3 p-4"
              >
                <legend className="px-1 text-sm font-semibold text-rivals-gold">{playerLabel(i)}</legend>
                <div className="mt-2 space-y-3">
                  <label className="block">
                    <span className="text-xs text-slate-400">Discord</span>
                    <input
                      autoFocus={i === 0}
                      value={p.discord}
                      onChange={(e) => setPlayer(i, "discord", e.target.value)}
                      required={i < 2}
                      className={inputCls}
                      placeholder={i === 2 ? "NA / vacío" : en ? "E.g.: @Rooster" : "Ej: @Rooster"}
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
                      className={inputCls}
                      placeholder={i === 2 ? "NA / vacío" : en ? "E.g.: RoosterRL" : "Ej: RoosterRL"}
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
                    </div>
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
                      className={inputCls}
                      placeholder={i === 2 ? "NA / vacío" : en ? "E.g.: +507 6XXX-XXXX" : "Ej: +507 6XXX-XXXX"}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-400">
                      {en ? "Peak rank (e.g.: Diamond 2, D1, Champ 3...)" : "Rank máximo (ej: Diamante 2, D1, Champ 3...)"}
                    </span>
                    <input
                      value={p.peakRank}
                      onChange={(e) => setPlayer(i, "peakRank", e.target.value)}
                      required={i < 2}
                      className={inputCls}
                      placeholder={i === 2 ? "NA / vacío" : en ? "E.g.: Diamond 2" : "Ej: Diamante 2"}
                    />
                  </label>
                </div>
              </fieldset>
            ))}
            {touched && !playersValid && (
              <p className="text-xs font-semibold text-rose-400">
                {en
                  ? "Players 1-2 need Discord, Epic ID, phone and peak rank. Player 3: leave empty for 2v2 or fill everything for 3v3."
                  : "Los jugadores 1-2 necesitan Discord, ID Epic, teléfono y rank máximo.. Jugador 3: déjalo vacío si es 2v2 o complétalo para 3v3."}
              </p>
            )}
          </div>
        )}

        {/* ── STEP  ​4: Resumen ── */}
        {step === 3 && !done && (
          <div className="fade-slide space-y-4">
            <p className="text-sm font-semibold text-rivals-gold">
              {en ? "Review before sending" : "Revisa antes de enviar"}
            </p>
            <dl className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  <dt className="w-40 shrink-0 text-xs font-bold uppercase tracking-widest text-slate-500">{row.label}</dt>
                  <dd className="break-words text-slate-200">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {!done && (
          <div className="flex items-center gap-3 pt-1">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="soft-ring rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                ← {en ? "Back" : "Atrás"}
              </button>
            )}
            <button
              type="submit"
              disabled={!canGoNext && touched}
              className={`flex-1 soft-ring rounded-full px-6 py-2.5 text-sm font-bold text-white transition ${isLast ? "bg-rivals-gold text-[#0b111c] hover:brightness-110" : "bg-rivals-red shadow-[0_8px_24px_rgba(230,57,70,0.35)] hover:brightness-110"} disabled:opacity-50`}
            >
              {isLast
                ? en
                  ? "✓ Confirm & register"
                  : "✓ Confirmar y registrar"
                : en
                  ? "Continue"
                  : "Continuar"}
            </button>
          </div>
        )}

        {done && (
          <div className="fade-slide space-y-3 text-center">
            <p className="emoji text-4xl">🎉</p>
            <p className="text-sm font-semibold text-emerald-300">
              {en
                ? "✓ Your team is registered for Season 2. The admin assigns it to a group at the draw."
                : "✓ Tu equipo quedó registrado para la Temporada 2. La admin lo asigna a un grupo en el sorteo."}
            </p>
            <Link
              href="/"
              className="soft-ring inline-flex items-center gap-2 rounded-full bg-rivals-red px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(230,57,70,0.35)] transition hover:brightness-110"
            >
              {en ? "Back to home" : "Volver al inicio"} →
            </Link>
          </div>
        )}
      </form>

      {myReg && myReg.status === "approved" && (
        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <p>{en ? "Your team was accepted for Season 2." : "Tu equipo fue aceptado para la Temporada 2."}</p>
          <Link
            href="/bracket"
            className="soft-ring mt-3 inline-flex items-center gap-2 rounded-full bg-rivals-gold px-4 py-1.5 text-xs font-bold text-[#0b111c] transition hover:brightness-110"
          >
            {en ? "See the bracket →" : "Ver el bracket →"}
          </Link>
        </div>
      )}
      {myReg && myReg.status === "declined" && (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {en
            ? "The admin rejected this registration. Check your data and resubmit the form."
            : "La admin rechazó este registro. Revisa tus datos y vuelve a enviar el formulario."}
        </div>
      )}
      {myReg && myReg.status === "pending" && (
        <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {en
            ? "This team is pending admin review."
            : "Este equipo está pendiente de revisión por la admin.."}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        {en
          ? "Registration links to the next tournament. When closed, this form becomes a 'substitute registration' until it opens again."
          : 'Registro se enlaza al siguiente torneo. Cuando está cerrado, este formulario se convierte en "registro de suplente" para luego abrirse de nuevo.'}
      </p>
    </div>
  );
}
