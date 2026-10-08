export type PlatformId = "epic" | "steam" | "psn" | "xbox" | "switch";

export type PlatformOption = {
  id: PlatformId;
  /** Brand name — same in es/en. */
  label: string;
  icon: string;
  /** How the in-game handle is called on that platform. */
  idLabel: { es: string; en: string };
  placeholder: string;
};

// Every platform Rocket League runs on. Epic is first since it is the
// cross-play account most players use to link the others.
export const PLATFORMS: PlatformOption[] = [
  {
    id: "epic",
    label: "Epic Games",
    icon: "🎮",
    idLabel: { es: "ID de Epic Games", en: "Epic Games ID" },
    placeholder: "TitoRL",
  },
  {
    id: "steam",
    label: "Steam",
    icon: "💻",
    idLabel: { es: "ID / perfil de Steam", en: "Steam ID / profile" },
    placeholder: "https://steamcommunity.com/id/tito",
  },
  {
    id: "psn",
    label: "PlayStation",
    icon: "🎯",
    idLabel: { es: "ID de PSN", en: "PSN ID" },
    placeholder: "TitoRL_PS",
  },
  {
    id: "xbox",
    label: "Xbox",
    icon: "🟢",
    idLabel: { es: "Gamertag de Xbox", en: "Xbox Gamertag" },
    placeholder: "TitoRL XB",
  },
  {
    id: "switch",
    label: "Nintendo Switch",
    icon: "🔴",
    idLabel: { es: "Código de amigo de Switch", en: "Switch friend code" },
    placeholder: "SW-1234-5678-9012",
  },
];

export const platformById = (id: string | undefined | null): PlatformOption | undefined =>
  PLATFORMS.find((p) => p.id === id);

/** Human label for a platform id, falling back to the raw value. */
export const platformLabel = (id: string | undefined | null): string =>
  platformById(id)?.label ?? id ?? "";

export const platformIcon = (id: string | undefined | null): string =>
  platformById(id)?.icon ?? "🎮";

/** True when the player actually filled a platform handle ("NA" 2v2 slots don't count). */
export const hasPlatformId = (platformId: string | undefined | null): boolean =>
  Boolean(platformId && platformId.trim() && platformId.trim().toUpperCase() !== "NA");

/** "TitoPS (PlayStation)" — the platform handle with its brand name. */
export const platformIdLabel = (p: { platform?: string; platformId?: string }): string => {
  if (!hasPlatformId(p.platformId)) return "—";
  const id = p.platformId!.trim();
  return id === p.platform ? id : `${id} (${platformLabel(p.platform)})`;
};
