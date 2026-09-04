"use client";

import { useEffect, useRef, useState } from "react";
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

const icons: Record<string, React.ReactNode> = {
  "/": (
    <path d="M3 10.5L12 3l9 7.5M5 9.5V21h5.25v-6h3.5v6H19V9.5" />
  ),
  "/tournament": (
    <path d="M6 3h12v3H6zM4 6h16v3H4zM7 9v12m5-12v12m5-12v12" />
  ),
  "/teams": (
    <path d="M12 12a4 4 0 1 0-8 4 4 0 0 0 8 0zM12 12a4 4 0 1 1 8 0M4 21c.8-3 3.6-5 7-5s6.2 2 7 5M16 8a3 3 0 1 0-6 3 3 0 0 0 6 0" />
  ),
  "/stats": (
    <path d="M4 20h16M6 16l4-5 3 3 5-7" />
  ),
  "/rules": (
    <path d="M12 3l2.3 4.7 5.2.7 1.6-3.8 3.7.9 5.2-2.3 4.8-4.7l-5.2.7-1.6-3.8-3.7.9-5.2-2.3-4.7z" />
  ),
  "/season1": (
    <path d="M8 2v3M16 2v3M5 7h14M6 5h12v15H6zM8 5v2m8-2v2M9 14l2 2 4-4" />
  ),
  "/register": (
    <path d="M9 12l2 2 4-4M12 21a9 9 0 1 0-18 9 9 0 0 0 18 0z" />
  ),
};

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Close the mobile Menú if one clicks outside it (or the trigger) or presses Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        !triggerRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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

          <div className="mx-1 hidden h-6 w-px bg-white/15 lg:block" />

          <nav className="hidden items-center gap-0.5 lg:flex">
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
            ref={triggerRef}
            onClick={() => setOpen((o) => !o)}
            className="soft-ring flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 pl-3 pr-2.5 text-xs font-semibold text-slate-200 transition-all duration-300 hover:bg-white/10 hover:text-white hover:scale-105 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span>{lang === "es" ? "Menú" : "Menu"}</span>
            {open ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {open && (
        <nav
          id="mobile-nav"
          ref={menuRef}
          className="fixed inset-x-3 top-16 z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b111c]/85 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="font-display text-sm font-bold tracking-tight text-white">
              {lang === "es" ? "Menú" : "Menu"}
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="soft-ring rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col p-2">
            {links.map(([key, href]) => (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5 ${linkClass(href)}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
                    pathname === href
                      ? "border-rivals-gold/40 bg-rivals-gold/15 text-rivals-gold"
                      : "border-white/10 bg-white/5 text-slate-300 group-hover:border-rivals-gold/30 group-hover:text-rivals-gold"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {icons[href]}
                  </svg>
                </span>
                <span className="flex-1 text-base">{t(key)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-80">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
