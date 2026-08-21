"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

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
          className="mx-auto h-44 w-44 rounded-2xl ring-2 ring-rivals-gold/40 shadow-[0_10px_40px_rgba(230,57,70,0.45)] md:h-56 md:w-56"
        />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-rivals-gold">{t("hero.next")}</p>
        <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
          <span className="bg-gradient-to-r from-rivals-red via-rivals-gold to-rivals-blue bg-clip-text text-transparent">
            {t("hero.title")}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">{t("hero.sub")}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/register" className="rounded bg-rivals-red px-6 py-3 font-bold text-white shadow-lg shadow-rivals-red/30 transition hover:brightness-110">
            {t("hero.cta")}
          </Link>
          <a href="https://discord.com/invite/yourinvite" className="rounded border border-rivals-border px-6 py-3 font-bold transition hover:border-rivals-gold hover:text-rivals-gold">
            {t("hero.discord")}
          </a>
        </div>
        <Link
          href="/season1"
          className="mt-8 inline-block rounded-full border border-rivals-gold/40 bg-rivals-gold/10 px-5 py-2 text-sm font-bold text-rivals-gold transition hover:bg-rivals-gold/20"
        >
          {t("hero.champ")} →
        </Link>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-center font-display text-3xl font-black tracking-tight text-rivals-gold">{t("how.title")}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.key} className="rounded-xl border border-rivals-border bg-rivals-surface p-5 transition hover:-translate-y-1 hover:border-rivals-blue/50">
              <span className="emoji text-3xl">{f.icon}</span>
              <p className="mt-3 text-sm text-slate-300">{t(`how.${f.key}`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
