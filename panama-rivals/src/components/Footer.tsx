"use client";

import { useI18n } from "@/lib/i18n";
import { SocialIcons } from "@/components/SocialIcons";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="relative z-10 mt-8 px-4 pb-4">
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#0b111c]/60 px-4 py-6 text-center text-sm text-slate-400 shadow-[0_-10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <SocialIcons />
        <p className="mt-4">{t("brand")} — Rocket League de Panamá 🇵🇦</p>
      </div>
    </footer>
  );
}
