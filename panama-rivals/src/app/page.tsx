"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { placementFor, type Division } from "@/lib/league";
import { SocialIcons } from "@/components/SocialIcons";
import Reveal from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";

function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current ?? 0);
  }, [target, durationMs]);
  return value;
}
const features = [
  { icon: "🗺️", key: "groups" },
  { icon: "🔥", key: "points" },
  { icon: "🏆", key: "knockout" },
  { icon: "📊", key: "stats" },
  { icon: "⏰", key: "matchday" },
] as const;

const stats = [
  { value: "54+", key: "stats.1" },
  { value: "18", key: "stats.2" },
  { value: "4", key: "stats.3" },
  { value: "1", key: "stats.4" },
] as const;

export default function Home() {
  const { t, lang } = useI18n();
  const { registrations, matches } = useStore();
  const heroRef = useRef<HTMLElement | null>(null);
  const [spotOn, setSpotOn] = useState(false);
  const teamCount = useCountUp(registrations.length);

  // Live Season 2 ranking — top 8 across both divisions (placement points per the official PDF).
  const top8 = useMemo(() => {
    const divs: Division[] = ["challenger", "elite"];
    return divs
      .flatMap((d) => placementFor(d, matches, registrations).map((r) => ({ ...r, div: d })))
      .filter((r) => r.points >  0)
      .sort((a, b) => b.points - a.points || a.label.localeCompare(b.label))
      .slice(0, 8);
  }, [matches, registrations]);

  // Cursor spotlight: a soft gold glow follows the mouse inside the hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      hero.style.setProperty("--sx", `${x.toFixed(1)}px`);
      hero.style.setProperty("--sy", `${y.toFixed(1)}px`);
      setSpotOn(true);
    };
    const onLeave = () => setSpotOn(false);
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="relative">
      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-24 text-center md:pt-32"
      >
        {/* Background video — hero only */}
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          src="/hero-bg.mp4"
          poster="/hero-bg-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-rivals-bg/80 via-rivals-bg/50 to-rivals-bg"
          aria-hidden="true"
        />
        <div className={`hero-spotlight${spotOn ? " hero-spotlight-on" : ""}`} aria-hidden="true" />
        <div className="relative">
          <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-rivals-red blur-3xl opacity-30" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Panamá Rivals logo" className="h-36 w-36 rounded-3xl ring-1 ring-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(230,57,70,0.3)] md:h-44 md:w-44" />
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-rivals-gold">{t("hero.next")}</p>
        <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight drop-shadow-[0_2px_24px_rgba(230,57,70,0.35)] md:text-7xl">
          <span className="shimmer-text bg-gradient-to-r from-rivals-red via-rivals-gold to-rivals-blue bg-clip-text text-transparent">
            {t("hero.title")}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">{t("hero.sub")}</p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="soft-ring rounded-full bg-rivals-red px-8 py-3.5 font-bold text-white shadow-[0_8px_30px_rgba(230,57,70,0.45)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_42px_rgba(230,57,70,0.55)]">
            {t("hero.cta")}
          </Link>
          <a href="https://discord.gg/h66gaD8rA" className="soft-ring rounded-full border border-white/10 bg-white/5 px-7 py-3.5 font-bold text-slate-200 backdrop-blur-md transition hover:bg-white/10 hover:text-rivals-gold">
            {t("hero.discord")}
          </a>
        </div>

        <div className="mt-8">
          <SocialIcons size="lg" />
        </div>

        <Link href="/season1" className="soft-ring mt-10 inline-flex items-center gap-2 rounded-full border border-rivals-gold/30 bg-rivals-gold/10 px-5 py-2 text-sm font-bold text-rivals-gold backdrop-blur transition hover:border-rivals-gold/60 hover:bg-rivals-gold/15">
          {t("hero.champ")} →
        </Link>

        <Link
          href="/teams"
          className="soft-ring mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 backdrop-blur-md transition hover:border-rivals-blue/50 hover:text-white"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rivals-blue/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rivals-blue" />
          </span>
          {lang === "en"
            ? `${teamCount} teams in · Season 2`
            : `${teamCount} equipos en · Temporada 2`}
        </Link>
      </section>

      <Marquee />

      {/* ── EXPERIENCE ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Reveal>
        <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-rivals-gold">{t("exp.kicker")}</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">{t("exp.title")}</h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {(["1", "2", "3"] as const).map((n, i) => (
            <Reveal key={n} delay={i * 120} className="glass-card glass-hover rounded-3xl p-7 text-center md:text-left h-full">
              <span className="font-display text-5xl font-black text-rivals-red/60">{n}</span>
              <h3 className="mt-3 font-display text-xl font-bold text-rivals-gold">{t(`exp.${n}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{t(`exp.${n}.body`)}</p>
            </Reveal>
          ))}
        </div>
        </Reveal>
      </section>

      {/* ── FORMAT / TIERS ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Reveal className="glass-card rounded-3xl p-8 md:p-12">
          <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-rivals-gold">{t("tiers.kicker")}</p>
          <h2 className="mx-auto mt-3 max-w-xl text-center font-display text-2xl font-black leading-tight tracking-tight md:text-4xl">{t("tiers.title")}</h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((f, i) => (
              <div key={f.key} className="rounded-2xl border border-white/8 bg-white/4 p-5 text-center transition hover:-translate-y-1 hover:border-rivals-gold/40 hover:bg-white/6">
                <span className="emoji text-3xl">{f.icon}</span>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{t(`how.${f.key}`)}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/tournament" className="soft-ring inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-bold text-slate-200 backdrop-blur transition hover:bg-white/10 hover:text-rivals-gold">
              {t("tiers.cta")} →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── STATS ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-rivals-gold">{t("stats.kicker")}</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.key} delay={i * 100} className="glass-card rounded-3xl p-6 text-center">
                <p className="font-display text-4xl font-black text-rivals-gold md:text-5xl">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">{t(s.key)}</p>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {top8.length > 0 && (
        <Reveal className="relative mx-auto max-w-6xl px-4 pb-20">
          <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-rivals-gold">{t("bracket.ranking")}</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">
            {lang === "en" ? "Live Season 2 Ranking" : "Ranking en vivo · Temporada 2"}
          </h2>
          <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <table className="w-full text-sm">
              <thead className="bg-white/2 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">{lang === "en" ? "Team" : "Equipo"}</th>
                  <th className="px-4 py-3 text-right">{t("bracket.pts")}</th>
                </tr>
              </thead>
              <tbody>
                {top8.map((r, i) => {
                  const rec = registrations.find((x) => x.id === r.teamId);
                  const g = rec?.groupId?.split("-")[1] ?? "";
                  const gLabel = g ? `${r.div === "elite" ? "Elite" : "Challenger"} · Grupo ${g.toUpperCase()}` : (r.div === "elite" ? "⚡ Elite" : "🛡️ Challenger");
                  return (
                    <tr key={`${r.div}-${r.teamId}`} className="group relative border-t border-rivals-border/50 transition hover:bg-white/5">
                      <td className="px-4 py-3 text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          {i === 0 && <span className="text-base">🥇</span>}
                          {i === 1 && <span className="text-base">🥈</span>}
                          {i === 2 && <span className="text-base">🥉</span>}
                          {r.label}
                        </span>
                      </td>
                      <td className="relative px-4 py-3 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          {rec?.teamName ?? r.teamId}
                          <span
                            className={
                              r.div === "elite"
                                ? "rounded-full bg-rivals-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rivals-gold"
                                : "rounded-full bg-rivals-blue/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rivals-blue"
                            }
                          >
                            {r.div === "elite" ? "Elite" : "Challenger"}
                          </span>
                        </span>
                        <div className="pointer-events-none invisible absolute right-2 top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#0b111c]/95 px-4 py-3 text-xs shadow-2xl opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                          <p className="font-bold text-white">{rec?.teamName ?? r.teamId}</p>
                          <p className="mt-1 text-slate-400">{gLabel}</p>
                          <p className="mt-1 font-semibold text-rivals-gold">{r.points} PTS</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rivals-gold">{r.points} PTS</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-8 text-center">
            <Link href="/bracket" className="soft-ring inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-rivals-gold">
              {t("bracket.ranking")} completo →
            </Link>
          </div>
        </Reveal>
      )}
    </div>
  );
}
