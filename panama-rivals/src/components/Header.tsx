"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

const links = [
  ["nav.home", "/"],
  ["nav.tournament", "/tournament"],
  ["nav.teams", "/teams"],
  ["nav.stats", "/stats"],
  ["nav.rules", "/rules"],
  ["nav.s1", "/season1"],
  ["nav.register", "/register"],
] as const;

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `transition hover:text-rivals-gold ${
      pathname === href ? "font-semibold text-rivals-gold" : "text-slate-300"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-rivals-border bg-rivals-bg/85 backdrop-blur supports-[backdrop-filter]:bg-rivals-bg/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 font-display text-xl font-black tracking-tight"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Panamá Rivals" className="h-10 w-10 rounded-lg ring-1 ring-rivals-gold/30" />
          <span>{t("brand")}</span>
        </Link>

        <nav className="hidden gap-4 md:flex">
          {links.map(([key, href]) => (
            <Link key={key} href={href} className={`text-sm ${linkClass(href)}`}>
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="rounded border border-rivals-border px-2 py-1 text-xs font-bold text-slate-300 hover:text-white"
            aria-label="Switch language"
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded border border-rivals-border px-2 py-1 text-slate-300 hover:text-white md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-rivals-border bg-rivals-bg/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {links.map(([key, href]) => (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={`border-b border-rivals-border/50 py-3 text-base last:border-0 ${linkClass(href)}`}
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
