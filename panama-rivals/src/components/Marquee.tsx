"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

function Item({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 px-6 text-sm font-semibold tracking-wide text-slate-200">
      <span className="opacity-80">{icon}</span>
      <span>{text}</span>
      {sub && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-rivals-gold">{sub}</span>}
    </span>
  );
}

export function Marquee() {
  const { t, lang } = useI18n();
  const { matches, registrations, teamById } = useStore();
  const items = useMemo(() => {
    const live: { icon: string; text: string; sub?: string }[] = [];
    for (const div of ["challenger", "elite"] as const) {
      const upcoming = matches
        .filter((m) => (m.groupId === div || m.groupId?.startsWith(`${div}-`)) && m.status === "scheduled")
        .sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || a.id.localeCompare(b.id));
      if (upcoming.length > 0) {
        const m = upcoming[0];
        const home = teamById(m.homeTeamId)?.name ?? "TBD";
        const away = teamById(m.awayTeamId)?.name ?? "TBD";
        live.push({
          icon: div === "challenger" ? "🛡️" : "⚡",
          text: `${div === "challenger" ? t("nav.challenger") : t("nav.elite")} · ${home} vs ${away}`,
          sub: typeof m.round === "number" ? `${t("div.matchday")} ${m.round}` : undefined,
        });
      }
    }
    if (registrations.length > 0) {
      live.push({
        icon: "👥",
        text: lang === "es"
          ? `${registrations.length} equipos inscritos · Temporada 3`
          : `${registrations.length} teams registered · Season 3`,
      });
    }
    live.push({ icon: "🏆", text: t("home.marqueePremier"), sub: lang === "es" ? "Próximo" : "Up next" });
    return live;
  }, [matches, registrations, teamById, t, lang]);

  if (items.length === 0) return null;
  const strip = items.map((it, i) => <Item key={i} {...it} />);

  return (
    <div className="relative z-10 border-y border-white/10 bg-white/[0.03] backdrop-blur-md">
      <p className="sr-only">{t("home.marqueeLive")} — {items.map((i) => i.text).join(" · ")}</p>
      <div className="group flex overflow-hidden whitespace-nowrap py-3">
        <div className="marquee-track flex shrink-0 items-center">
          {strip}
        </div>
        <div className="marquee-track flex shrink-0 items-center" aria-hidden="true">
          {strip}
        </div>
      </div>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-rivals-red px-3 py-1 text-[11px] font-black tracking-widest text-white shadow-[0_4px_16px_rgba(230,57,70,0.5)]">
        {t("home.marqueeLive")}
      </span>
    </div>
  );
}