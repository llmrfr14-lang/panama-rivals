"use client";

type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "champion" | "gc" | "ssl";

const TIERS: Record<Tier, { abbr: string; labelEs: string; labelEn: string; cls: string }> = {
  bronze: { abbr: "BR", labelEs: "Bronce", labelEn: "Bronze", cls: "from-[#b98355] to-[#5d3a2b] text-amber-100 ring-amber-500/30" },
  silver: { abbr: "SV", labelEs: "Plata", labelEn: "Silver", cls: "from-[#cdd3dd] to-[#5b6470] text-slate-900 ring-slate-400/40" },
  gold:  { abbr: "GL", labelEs: "Oro", labelEn: "Gold", cls: "from-[#ffd166] to-[#b8860b] text-[#3a2c00] ring-yellow-400/40" },
  platinum: { abbr: "PL", labelEs: "Platino", labelEn: "Platinum", cls: "from-[#7be6ff] to-[#1a9bd6] text-[#05303f] ring-cyan-300/40" },
  diamond: { abbr: "DM", labelEs: "Diamante", labelEn: "Diamond", cls: "from-[#46d7ff] to-[#2563eb] text-white ring-blue-400/40" },
  champion: { abbr: "CH", labelEs: "Campeón", labelEn: "Champion", cls: "from-[#b388ff] to-[#6d28d9] text-white ring-purple-400/40" },
  gc: { abbr: "GC", labelEs: "Gran Campeón", labelEn: "Grand Champion", cls: "from-[#ff7a2f] to-[#e63946] text-white ring-orange-400/40" },
  ssl: { abbr: "SSL", labelEs: "Leyenda Supersónica", labelEn: "Supersonic Legend", cls: "from-[#ffd166] via-[#ff7a2f] to-[#e63946] text-white ring-rivals-gold/60" },
};

const ROMAN: Record<string, number> = { i: 1, ii:  2, iii:  3, iv:  4 };

function tierFor(rank: string): Tier | null {
  const r = rank.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  if (!r) return null;
  if (r.includes("ssl") || r.includes("supersonic") || r.includes("leyenda")) return "ssl";
  if (r.includes("grandchamp") || r.includes("grancamp") || r.includes("grandcamp") || r.startsWith("gc")) return "gc";
  if (r.includes("champion") || r.includes("campeon") || r.includes("champ") || r.includes("camp")) return "champion";
  if (/^c[0-9ivx]{0,,4}$/.test(r)) return "champion";
  if (/^d/.test(r)) return "diamond";
  if (/^pl/.test(r)) return "platinum";
  if (/^p/.test(r)) return "platinum";
  if (/^g/.test(r)) return "gold";
  if (/^s/.test(r)) return "silver";
  if (/^b/.test(r)) return "bronze";
  return null;
}

function divisionOf(rank: string): number | "" {
  const r = rank.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const m = r.match(/([0-9]+|iv|iii|ii|i)$/);
  if (!m) return "";
  const v = m[1];
  if (/^[0-9]+$/.test(v)) {
    const n = parseInt(v, 10);
    return n >=  1 && n <=  4 ? n : "";
  }
  return ROMAN[v] ?? "";
}

/** Mini "logo" del rank Rocket League — pill degradado + división (ej: DM2, CH3, GC1, SSL). */
export default function RankBadge({ rank, lang = "es" }: { rank: string | null | undefined; lang?: "es" | "en" }) {
  const tier = tierFor(rank ?? "");
  if (!tier) return null;
  const t = TIERS[tier];
  const div = divisionOf(rank ?? "");
  const label = `${t[lang === "en" ? "labelEn" : "labelEs"]}${div ? ` · División ${div}` : ""}`;
  return (
    <span
      title={label}
      className={`soft-ring inline-flex h-4.5 min-w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-b px-1 text-[9px] font-black leading-none ring-1 ring-inset ${t.cls}`}
    >
      {t.abbr}
      {div || ""}
    </span>
  );
}