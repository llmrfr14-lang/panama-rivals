"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Match } from "@/lib/types";

const CHECK_IN_MS = 15 * 60 * 1000;

function fmtClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MatchCard({ m, teamById, myTeam, now, onCheckIn, innerRef }: {
  m: Match;
  teamById:((id: string | null) => { name: string } | null);
  myTeam: string;
  now: number;
  onCheckIn:((matchId: string, teamId: string) => void);
  innerRef?:(el: HTMLDivElement | null) => void;
}) {
  const { t } = useI18n();
  const home = teamById(m.homeTeamId)?.name ?? "TBD";
  const away = teamById(m.awayTeamId)?.name ?? "TBD";
  const isMine = Boolean(myTeam) && (m.homeTeamId === myTeam || m.awayTeamId === myTeam);

  const homeWon = m.status === "approved" ? m.homeScore > m.awayScore : m.status === "ff" ? m.ffWinner === m.homeTeamId : false;
  const awayWon = m.status === "approved" ? m.awayScore > m.homeScore : m.status === "ff" ? m.ffWinner === m.awayTeamId : false;
  const resolved = m.status === "approved" || m.status === "ff";

  const checked = m.checkedIn;
  const [popped, setPopped] = useState<string | null>(null);
  useEffect(() => {
    if (!checked) return;
    setPopped(checked);
    const td = window.setTimeout(() => setPopped(null), 900);
    return () => window.clearTimeout(td);
  }, [checked]);
  const deadline = m.scheduledAt ? m.scheduledAt + CHECK_IN_MS : null;
  const open = Boolean(m.scheduledAt && m.scheduledAt <= now && (m.status === "scheduled" || m.status === "checked_in" || m.status === "declined"));
  const scheduledUpcoming = Boolean(m.scheduledAt && m.scheduledAt > now) && !resolved;
  

  const teamName = (id: string | null, won: boolean, lost: boolean) => (
    <span className={won ? "font-semibold text-emerald-300" : lost ? "text-slate-500 line-through" : "font-semibold text-slate-200"}>
      {teamById(id)?.name ?? "TBD"}
    </span>
  );

  return (
    <div
      ref={innerRef ? (el) => innerRef(el) : undefined}
      className={`rounded-lg border p-3 ${isMine ? "border-rivals-gold/60 bg-rivals-gold/5" : "border-rivals-border/60 bg-rivals-bg/60"} ${popped ? "checkin-ring" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm">
          {teamName(m.homeTeamId, homeWon, resolved && !homeWon)}{" "}
          <span className="text-slate-600">vs</span>{" "}
          {teamName(m.awayTeamId, awayWon, resolved && !awayWon)}
        </p>
        {isMine && <span className="shrink-0 rounded-full bg-rivals-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rivals-gold">Tu</span>}
      </div>

      {m.status === "approved" ? (
        <p className="mt-2 font-mono font-bold text-rivals-gold">{m.homeScore}–{m.awayScore}</p>
      ) : m.status === "pending_review" ? (
        <p className="mt-2 text-xs text-amber-400">{t("div.reviewing")}</p>
      ) : m.status === "ff" ? (
        <p className="mt-2 text-xs font-bold text-rose-400">
          {home === away ? "" : (m.ffWinner === m.homeTeamId ? home : away)} {t("bracket.winsByFF")}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {open && (
            <>
              {(m.homeTeamId || m.awayTeamId) && (
                <div className="flex gap-2">
                  {[m.homeTeamId, m.awayTeamId].map((tid) => tid && (
                    <button
                      key={tid}
                      onClick={() => onCheckIn(m.id, tid)}
                      disabled={checked === tid || m.status === "ff"}
                      className={`flex-1 truncate rounded-full px-3 py-1.5 text-xs font-bold transition ${checked === tid ? (popped === tid ? "bg-emerald-500/90 text-white checkin-pop" : "bg-emerald-500/90 text-white") : "bg-rivals-blue text-white hover:brightness-110"}`}
                    >
                      {checked === tid ? "✓ " + (teamById(tid)?.name ?? "Team") + " listo" : "✓ " + (teamById(tid)?.name ?? "Team")}
                    </button>
                  ))}
                </div>
              )}
              {deadline && deadline > now && (
                <p className="text-xs text-slate-400">
                  ⏳ {t("bracket.ffIn")} {fmtClock(deadline - now)}
                </p>
              )}
            </>
          )}
          {scheduledUpcoming && m.scheduledAt && (
            <p className="text-xs text-slate-500">
{t("bracket.startsAt")} {new Date(m.scheduledAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {m.status === "checked_in" && !open && (
            <p className="text-xs text-emerald-400">{t("bracket.checkInDone")}</p>
          )}
          {m.status === "declined" && (
            <p className="text-xs text-slate-500">{t("bracket.declined")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function bracketWinner(m: Match): string | null {
  if (m.status === "approved") return m.homeScore > m.awayScore ? m.homeTeamId : m.homeScore < m.awayScore ? m.awayTeamId : null;
  if (m.status === "ff" && m.ffWinner) return m.ffWinner;


  return null;
}

function RoundColumn({ title, matches, teamById, myTeam, now, onCheckIn, cardRefs, gap }: {
  title: string;
  matches: Match[];
  teamById:((id: string | null) => { name: string } | null);
  myTeam: string;
  now: number;

  onCheckIn:((matchId: string, teamId: string) => void);
  cardRefs?: ((el: HTMLDivElement | null) => void)[];
  gap: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-5 text-center font-display text-base font-black uppercase tracking-[0.22em] text-rivals-gold">{title}</h3>
      <div className={`flex flex-col ${gap}`}>
        {matches.map((m, i) => (
          <MatchCard
            key={m.id}
            m={m}
            teamById={teamById}
            myTeam={myTeam}
            now={now}
            onCheckIn={onCheckIn}
            innerRef={cardRefs?.[i] ? (el) => cardRefs![i](el) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

type Connector = { key: string; d: string; soft: boolean };

export function BracketTree({ qf, sf, fin, teamById, myTeam, now, onCheckIn, titles }: {
  qf: Match[]; sf: Match[]; fin: Match | null | undefined;
  teamById:((id: string | null) => { name: string } | null);
  myTeam: string;
  now: number;
  onCheckIn:((matchId: string, teamId: string) => void);


  titles: { qf: string; sf: string; fin: string };
}) {
  const { t } = useI18n();
  const needsQf = qf.length > 0;
 const hasSf = sf.length >  0;
 const hasFin = Boolean(fin);


  const treeRef = useRef<HTMLDivElement | null>(null);
 const qfRefs = useRef<(HTMLDivElement | null)[]>([]);
 const sfRefs = useRef<(HTMLDivElement | null)[]>([]);
 const finRef = useRef<HTMLDivElement | null>(null);
 const [connectors, setConnectors] = useState<Connector[]>([]);



  const champion = fin ? bracketWinner(fin) : null;
 const championName = (champion && teamById(champion)?.name) ?? null;
 const runnerUpName = useMemo(() => {
    if (!fin) return null;
    const w = bracketWinner(fin);
    if (!w) return null;
    const runner = fin.homeTeamId === w ? fin.awayTeamId : fin.homeTeamId;

    return runner ? teamById(runner)?.name ?? null : null;
  }, [fin, teamById]);


  useEffect(() => {
    const measure = () => {
      const tree = treeRef.current;
      if (!tree) return;
     const t = tree.getBoundingClientRect();
     const out: Connector[] = [];
     const right = (r: DOMRect) => r.right - t.left;
     const left = (r: DOMRect) => r.left - t.left;
     const cy = (r: DOMRect) => (r.top + r.bottom) / 2 - t.top;

     // QF pair (2i, 2i+1) merges into SF card i.

     if (needsQf && hasSf && sf.length >  0) {
       for (let i =  0; i < sf.length; i++) {
         const top = qfRefs.current[i * 2];
         const bot = qfRefs.current[i * 2 +  1];
         const s = sfRefs.current[i];
         if (!top || !bot || !s) continue;
         const x1 = right(top.getBoundingClientRect());
         const y1 = cy(top.getBoundingClientRect());
         const x2 = right(bot.getBoundingClientRect());
         const y2 = cy(bot.getBoundingClientRect());
         const sx = left(s.getBoundingClientRect());
         const sy = cy(s.getBoundingClientRect());
         const mx = (x1 + sx) / 2;
         out.push(
           { key: `qs-${i}-a`, soft: false, d: `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${sy} L ${sx} ${sy}` },
           { key: `qs-${i}-b`, soft: false,d: `M ${x2} ${y2} L ${mx} ${y2} L ${mx} ${sy} L ${sx} ${sy}` },
         );
       }
     }

     // SF winners merge into the Final card.




     if (hasSf && hasFin && finRef.current) {
       const fr = finRef.current.getBoundingClientRect();
       const fx = left(fr);
       const fy = cy(fr);
       for (let i =  0; i < sf.length; i++) {



         const s = sfRefs.current[i];
         if (!s) continue;
         const sr = s.getBoundingClientRect();
         const rx = right(sr);
         const sy = cy(sr);
         const mx = (rx + fx) / 2;
         out.push({ key: `sf-${i}`, soft: true,d: `M ${rx} ${sy} L ${mx} ${sy} L ${mx} ${fy} L ${fx} ${fy}` });
       }
     }
     setConnectors(out);
   };
   measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
   // Re-measure when the tree structure or the ticking clock changes layout.






  }, [needsQf, hasSf, hasFin, qf.length, sf.length, now]);


  return (
    <div ref={treeRef} className="relative mt-10 rounded-3xl border border-rivals-border/40 bg-white/[0.02] p-6 md:p-8">
      <div className="relative overflow-x-auto pb-4">
        <div className="flex items-stretch justify-center gap-6 md:gap-10 lg:gap-14">
          {needsQf && (
            <div className="flex flex-none items-center">
              <div className="w-56 sm:w-64">
                <RoundColumn
                  title={titles.qf}
                  matches={qf}
                  teamById={teamById}
                  myTeam={myTeam}
                  now={now}
                  onCheckIn={onCheckIn}
                  gap="gap-4 md:gap-6"
                  cardRefs={qf.map((_, i) => (el) => { qfRefs.current[i] = el; })}
                />
              </div>
            </div>
          )}

          {hasSf && (
            <div className="flex flex-none items-center">
              <div className="w-56 sm:w-64">
                <RoundColumn
                  title={titles.sf}
                  matches={sf}
                  teamById={teamById}
                  myTeam={myTeam}
                  now={now}
                  onCheckIn={onCheckIn}
                  gap="gap-12 md:gap-16"
                  cardRefs={sf.map((_, i) => (el) => { sfRefs.current[i] = el; })}
                />
              </div>
            </div>
          )}

          {hasFin && fin && (
            <div className="flex flex-none items-center">
              <div className="w-56 sm:w-64">
                <RoundColumn
                  title={titles.fin}
                  matches={[fin]}
                  teamById={teamById}
                  myTeam={myTeam}
                  now={now}
                  onCheckIn={onCheckIn}
                  gap="gap-0"
                  cardRefs={[(el) => { finRef.current = el; }]}
                />
              </div>
            </div>
          )}

          {championName && (
            <div className="flex flex-none items-center">
              <div className="flex w-44 flex-col items-center gap-1 text-center">
                <span className="emoji text-6xl">🏆</span>
                <span className="font-display text-sm font-black uppercase tracking-widest text-rivals-gold">{t("s1.champion")}</span>
                <span className="text-sm font-bold">{championName}</span>
                {runnerUpName && <span className="text-[11px] text-slate-400">2º {runnerUpName}</span>}
              </div>
            </div>
          )}
        </div>

        {connectors.length >  0 && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {connectors.filter((c) => !c.soft).map((c) => (
              <path key={c.key} d={c.d} fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} strokeDasharray="5 5" />
            ))}
            {connectors.filter((c) => c.soft).map((c) => (
              <path key={c.key} d={c.d} fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth={1.5} strokeDasharray="5 5" />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}