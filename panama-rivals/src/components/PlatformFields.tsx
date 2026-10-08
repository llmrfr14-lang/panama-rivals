"use client";

import { PLATFORMS, platformById } from "@/lib/platforms";

type Props = {
  en: boolean;
  platform: string;
  platformId: string;
  onPlatform: (v: string) => void;
  onPlatformId: (v: string) => void;
  className?: string;
  /** 3rd 2v2 slot: hints that the fields can be left blank. */
  optional?: boolean;
};

/** Platform picker + the matching platform handle (PSN ID, Gamertag, etc.). */
export default function PlatformFields({
  en,
  platform,
  platformId,
  onPlatform,
  onPlatformId,
  className,
  optional,
}: Props) {
  const selected = platformById(platform) ?? PLATFORMS[0];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="text-xs text-slate-400">{en ? "Platform" : "Plataforma"}</span>
        <select
          value={platform || "epic"}
          onChange={(e) => onPlatform(e.target.value)}
          className={className}
        >
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0b111c]">
              {p.icon} {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-slate-400">{selected.idLabel[en ? "en" : "es"]}</span>
        <input
          value={platformId}
          onChange={(e) => onPlatformId(e.target.value)}
          required={!optional}
          className={className}
          placeholder={optional ? "NA / vacío" : `Ej: ${selected.placeholder}`}
        />
      </label>
    </div>
  );
}
