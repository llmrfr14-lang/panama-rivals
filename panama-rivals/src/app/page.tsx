"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SocialIcons } from "@/components/SocialIcons";

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
  const { t } = useI18n();
  const heroRef = useRef<HTMLElement | null>(null);
  const [spotOn, setSpotOn] = useState(false);

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
        {/* Runway-generated ad banner as hero backdrop*/}
        <div className="absolute inset-0 -z-1 overflow-hidden rounded-3xl border border-white/10" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bg-banner.webp"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#070b12]/62" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0b1018]" />
        </div>
        <div className={`hero-spotlight${spotOn ? " hero-spotlight-on" : ""}`} aria-hidden="true" />
        <div className="relative">
          <div className="absolute inset-0 -z-10 scale-125 rounded-full bg-rivals-red blur-3xl opacity-30" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Panamá Rivals logo" className="h-36 w-36 rounded-3xl ring-1 ring-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(230,57,70,0.3)] md:h-44 md:w-44" />
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-rivals-gold">{t("hero.next")}</p>
        <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight drop-shadow-[0_2px_24px_rgba(230,57,70,0.35)] md:text-7xl">
          <span className="bg-gradient-to-r from-rivals-red via-rivals-gold to-rivals-blue bg-clip-text text-transparent">
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
      </section>

      {/* ── EXPERIENCE ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-rivals-gold">{t("exp.kicker")}</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-black leading-tight tracking-tight md:text-5xl">{t("exp.title")}</h2>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {(["1", "2", "3"] as const).map((n, i) => (
            <div key={n} className="glass-card glass-hover rounded-3xl p-7 text-center md:text-left">
              <span className="font-display text-5xl font-black text-rivals-red/60">{n}</span>
              <h3 className="mt-3 font-display text-xl font-bold text-rivals-gold">{t(`exp.${n}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{t(`exp.${n}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORMAT / TIERS ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="glass-card rounded-3xl p-8 md:p-12">
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
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <p className="text-center text-xs font-black uppercase tracking-[0.35em] text-rivals-gold">{t("stats.kicker")}</p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.key} className="glass-card rounded-3xl p-6 text-center">
              <p className="font-display text-4xl font-black text-rivals-gold md:text-5xl">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">{t(s.key)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}