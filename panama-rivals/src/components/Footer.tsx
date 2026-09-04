"use client";

import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-rivals-border py-8 text-center text-sm text-slate-400">
      <p>{t("brand")} — Rocket League de Panamá 🇵🇦</p>
      <p className="mt-1">Community-run. Tournament days at 7pm.</p>
    </footer>
  );
}
