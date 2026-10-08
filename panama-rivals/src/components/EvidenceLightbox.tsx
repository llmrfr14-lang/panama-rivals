"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

type Props = {
  photo?: string | null;
  replay?: string | null;
  replayName?: string;
  onClose: () => void;
};

/**
 * Full-screen viewer for match evidence. A thumbnail is unreadable on a phone
 * (you can't tell whether every player is in the shot), so the photo opens here
 * at the largest size that fits the viewport, with a link to the raw original.
 */
export function EvidenceLightbox({ photo, replay, replayName, onClose }: Props) {
  const { lang } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const labels = {
    title: lang === "es" ? "Evidencia del resultado" : "Result evidence",
    close: lang === "es" ? "Cerrar" : "Close",
    openOriginal: lang === "es" ? "Abrir original" : "Open original",
    download: lang === "es" ? "Descargar" : "Download",
    replayHint:
      lang === "es"
        ? "Replay adjunto — descárgalo para revisarlo en el juego."
        : "Replay attached — download it to review in game.",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b111c]/95 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-rivals-gold">{labels.title}</p>
          <div className="flex items-center gap-2">
            {photo && (
              <a
                href={photo}
                target="_blank"
                rel="noreferrer"
                className="soft-ring rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 transition hover:bg-white/10"
              >
                {labels.openOriginal}
              </a>
            )}
            <button
              onClick={onClose}
              autoFocus
              className="soft-ring rounded-full bg-rivals-red px-3 py-1 text-xs font-bold text-white transition hover:brightness-110"
            >
              {labels.close} ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={labels.title}
              className="mx-auto max-h-[78vh] w-auto max-w-full rounded-lg border border-white/10 object-contain"
            />
          ) : replay ? (
            <div className="py-12 text-center">
              <p className="emoji text-4xl">🎞️</p>
              <p className="mt-3 text-sm text-slate-300">{labels.replayHint}</p>
              <a
                href={replay}
                download={replayName || "match.replay"}
                className="soft-ring mt-4 inline-block rounded-full bg-rivals-blue px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
              >
                ⬇ {labels.download} {replayName ? `· ${replayName}` : ".replay"}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
