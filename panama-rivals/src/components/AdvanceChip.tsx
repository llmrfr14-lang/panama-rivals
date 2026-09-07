"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Division, standingsFor } from "@/lib/league";

const groupKeys = ["A", "B", "C", "D"];

export default function AdvanceChip({ division }: { division: Division }) {
  const { t } = useI18n();
  const { matches, registrations, teamById } = useStore();

  const groups = useMemo(() =>
    groupKeys.map((g) => {
      const rows = standingsFor(g, division, matches, registrations);
      const hasMatches = matches.some((m) => m.stage === "group" && m.groupId === `${division}-${g}`);
      return { key: g, rows, hasMatches };
    }),
  [matches, division, registrations]);

  const pairs = useMemo(() => {
    const out: { groups: typeof groups; bracket: "fin" | "qf" }[] = [];
    const active = groups.filter((g) => g.hasMatches);
    if (active.length === 2) out.push({ groups: [active[0], active[1]], bracket: "fin" });
    else if (active.length === 4) {
      const quads = [groups.slice(0, 2), groups.slice(2, 4)];
      quads.forEach((pair) => out.push({ groups: pair, bracket: "qf" }));
    }
    return out;
  }, [groups]);

  if (pairs.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {pairs.map((pair, pi) => (
        <div key={pi} className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {t(pair.bracket === "fin" ? "div.finDirect" : "div.quarters")}
            </p>
            <p className="text-[11px] text-slate-500">{t("div.top2")}</p>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {pair.groups.map((g) => (
              <div key={g.key} className="flex items-center gap-2 text-sm">
                <span className="w-6 shrink-0 text-xs font-bold text-slate-500">{t("div.group")} {g.key}</span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  {g.rows.slice(0, 2).map((r, i) => (
                    <p key={r.teamId} className="truncate">
                      <span className={i === 0 ? "text-rivals-gold" : "text-rivals-blue"}>
                        {i + 1}º{" "}
                      </span>
                      <span className="text-slate-200">{teamById(r.teamId)?.name ?? r.teamId}</span>
                    </p>
                  ))}
                  {g.rows.length < 2 && (
                    <p className="text-xs italic text-slate-500">
                      {g.rows.length === 0 ? t("div.noResultsYet") : t("div.waitingOpponent")}
                    </p>
                  )}
                </div>
                <Link
                  href={`/bracket?div=${division}`}
                  className="soft-ring rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-rivals-gold/50 hover:text-rivals-gold"
                >
                  {t("div.details")} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}