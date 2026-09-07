"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function ScrollProgress() {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? el.scrollTop / max : 0);
        setVisible(el.scrollTop > 300);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Top scroll-progress hairline — rivals red→gold */}
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-rivals-red via-rivals-gold to-rivals-red transition-[width] duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Back-to-top — appears after 300px */}
      <button
        type="button"
        aria-label={t("nav.backToTop")}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:text-rivals-gold ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
      >
        ↑
      </button>
    </>
  );
}