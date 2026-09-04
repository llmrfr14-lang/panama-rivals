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
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-6H9v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  "/tournament": (
    <>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-1.07.99H11c-.6 0-1-.44-1-.99v-2.34" />
      <path d="M14 14.66V17c0 .55.47.98 1.07.99H13c.6 0 1-.44 1-.99v-2.34" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      <path d="M6 4H2v2a6 6 0 0 0 4 4" />
      <path d="M18 4h4v2a6 6 0 0 1-4 4" />
    </>
  ),
  "/teams": (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  "/stats": (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </>
  ),
  "/rules": (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1h2c1.5 0 3-.5 5-.5 7 .5h.4c2-.1 3.5-.5 5-.5h2a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  "/season1": (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </>
  ),
  "/register": (
    <>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0  1-2-2V6a2 2 0  1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </>
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

  const pillRef = useRef<HTMLDivElement | null>(null);

  // Magnetic tilt — the glass pill leans toward the cursor and springs back on leave
  useEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const onMove = (e: PointerEvent) => {
      const r = pill.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width; // 0..1
      const y = (e.clientY - r.top) / r.height;
      const rx = (0.5 - y) * 14; // deg
      const ry = (x - 0.5) * 18;
      const tx = (x -  0.5) * 16;
      const ty = (y -  0.5) * 12;
      pill.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      pill.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      pill.style.setProperty("--tx", `${tx.toFixed(1)}px`);
      pill.style.setProperty("--ty", `${ty.toFixed(1)}px`);
    };
    const onLeave = () => {
      pill.style.setProperty("--rx", "0deg");
      pill.style.setProperty("--ry", "0deg");
      pill.style.setProperty("--tx", "0px");
      pill.style.setProperty("--ty", "0px");
    };
    pill.addEventListener("pointermove", onMove);
    pill.addEventListener("pointerleave", onLeave);
    return () => {
      pill.removeEventListener("pointermove", onMove);
      pill.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const linkClass = (href: string) =>
    `transition hover:text-rivals-gold ${
      pathname === href ? "font-semibold text-rivals-gold" : "text-slate-300"
    }`;

  return (
    <>
      {/* Floating glass pill nav — CSA-style */}
      <nav className="fixed inset-x-0 top-0 z-50 flex justify-center px-4">
        <div
            ref={pillRef}
            className="pill-tilt mt-3 flex h-14 w-max max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-2xl border border-white/10 bg-[#0b111c]/70 px-3 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#0b111c]/45"
          >
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
