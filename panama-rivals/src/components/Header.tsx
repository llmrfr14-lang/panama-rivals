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
    <>
      {/* Floating glass pill nav — CSA-style */}
      <nav className="fixed inset-x-0 top-0 z-50 flex justify-center px-4">
        <div className="mt-3 flex h-14 w-max max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0b111c]/70 px-3 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#0b111c]/45">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex shrink-0 items-center gap-2 pr-2 font-display text-base font-black tracking-tight"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Panamá Rivals" className="h-8 w-8 rounded-lg ring-1 ring-white/10" />
            <span className="hidden lg:inline">{t("brand")}</span>
          </Link>

          <div className="mx-1 hidden h-6 w-px bg-white/15 md:block" />

          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map(([key, href]) => (
              <Link key={key} href={href} className={`rounded-lg px-2.5 py-1.5 text-sm ${linkClass(href)}`}>
                {t(key)}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="soft-ring ml-1 shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
            aria-label="Switch language"
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="soft-ring shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
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
      </nav>

      {open && (
        <nav className="fixed inset-x-3 top-16 z-40 rounded-2xl border border-white/10 bg-[#0b111c]/85 px-2 py-2 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:hidden">
          <div className="flex flex-col">
            {links.map(([key, href]) => (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-base ${linkClass(href)}`}
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
