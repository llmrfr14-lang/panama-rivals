"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SocialIcons } from "@/components/SocialIcons";

const features = [
  { key: "groups", icon: "🗺️" },
  { key: "points", icon: "🔥" },
  { key: "knockout", icon: "🏆" },
  { key: "stats", icon: "📊" },
  { key: "matchday", icon: "⏰" },
] as const;

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,rgba(58,134,255,0.25),transparent_50%),radial-gradient(circle_at_70%_30%,rgba(230,57,70,0.22),transparent_50%)]" />

      <section className="relative mx-auto max-w-6xl px-4 py-20 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Panamá Rivals logo"
          className="mx-auto h-44 w-44 rounded-3xl ring-1 ring-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.55),0_0_40px_rgba(230,57,70,0.25)] md:h-56 md:w-56"
        />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-rivals-gold">{t("hero.next")}</p>
        <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight drop-shadow-[0_2px_24px_rgba(230,57,70,0.35)] md:text-7xl">
          <span className="bg-gradient-to-r from-rivals-red via-rivals-gold to-rivals-blue bg-clip-text text-transparent">
            {t("hero.title")}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">{t("hero.sub")}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register" className="soft-ring rounded-full bg-rivals-red px-7 py-3 font-bold text-white shadow-[0_8px_30px_rgba(230,57,70,0.4)] transition hover:brightness-110 hover:shadow-[0_12px_40px_rgba(230,57,70,0.5)]">
            {t("hero.cta")}
          </Link>
          <a href="https://discord.gg/h66gaD8rA" className="soft-ring rounded-full border border-white/10 bg-white/5 px-6 py-3 font-bold text-slate-200 backdrop-blur transition hover:bg-white/10 hover:text-rivals-gold">
            {t("hero.discord")}
          </a>
        </div>
        <div className="mt-6">
          <SocialIcons size="lg" />
        </div>
        <Link
          href="/season1"
          className="soft-ring mt-8 inline-block rounded-full border border-rivals-gold/30 bg-rivals-gold/10 px-6 py-2.5 text-sm font-bold text-rivals-gold backdrop-blur transition hover:border-rivals-gold/60 hover:bg-rivals-gold/15"
        >
          {t("hero.champ")} →
        </Link>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-center font-display text-3xl font-black tracking-tight text-rivals-gold">{t("how.title")}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.key} className="glass-card glass-hover rounded-3xl p-6 text-center">
              <span className="emoji text-3xl">{f.icon}</span>
              <p className="mt-3 text-sm text-slate-300">{t(`how.${f.key}`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
