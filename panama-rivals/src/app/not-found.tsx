import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[16rem] font-black text-white/[0.03]">
        404
      </div>
      <div className="relative">
        <p className="emoji text-7xl">🏆</p>
        <span aria-hidden="true" className="absolute -bottom-1 left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-full bg-rivals-gold/20 blur-md" />
      </div>
      <p className="mt-8 text-xs font-black uppercase tracking-[0.35em] text-rivals-gold">
        Fuera de juego · Offside
      </p>
      <h1 className="mt-3 font-display text-4xl font-black text-white md:text-5xl">
        Esta página no existe
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-400">
        El balón se fue por la banda. Volvé a la cancha principal y seguí la Temporada 2.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="soft-ring rounded-full bg-rivals-red px-7 py-3 text-sm font-bold text-white shadow-[0_4px_24px_rgba(230,57,70,0.35)] transition hover:bg-rivals-red/90 hover:shadow-[0_4px_32px_rgba(230,57,70,0.5)]"
        >
          ← Volver al inicio
        </Link>
        <Link
          href="/register"
          className="soft-ring rounded-full border border-white/10 bg-white/5 px-7 py-3 text-sm font-bold text-slate-200 backdrop-blur transition hover:bg-white/10 hover:text-rivals-gold"
        >
          Registrá tu equipo
        </Link>
      </div>
    </div>
  );
}