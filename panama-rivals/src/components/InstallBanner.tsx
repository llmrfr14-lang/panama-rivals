"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type DeferredPrompt = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event;
    appinstalled: Event;
  }
}

function isInstalled() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallBanner() {
  const { lang } = useI18n();
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null);
  const [hidden, setHidden] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let dismissedSession = false;
    try { dismissedSession = sessionStorage.getItem("pr-install-dismissed") === "1"; } catch { /* private mode */ }
    if (isInstalled() || dismissedSession) { setHidden(true); return; }
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as unknown as DeferredPrompt);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || dismissed || !deferred) return null;

  const en = lang === "en";

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setHidden(true);
    } catch { /* prompt unavailable or already installed */ }
    setDeferred(null);
  };

  const dismiss = () => {
    try { sessionStorage.setItem("pr-install-dismissed", "1"); } catch { /* private mode */ }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-rivals-gold/40 bg-[#0d1420]/90 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:right-6 sm:bottom-6" role="dialog" aria-label={en ? "Install app" : "Instalar app"}>
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/10" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {en ? "Install Panamá Rivals" : "Instalá Panamá Rivals"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {en
              ? "Add it to your home screen — always ready on matchday."
              : "Agregala tu pantalla principal — siempre lista el día del torneo."}
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="soft-ring rounded-full bg-rivals-red px-4 py-1.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(230,57,70,0.35)] transition hover:brightness-110"
            >
              {en ? "Install app" : "Instalá la app"} 📲
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="soft-ring rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {en ? "Later" : "Después"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}