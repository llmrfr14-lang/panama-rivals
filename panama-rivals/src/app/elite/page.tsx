"use client";

import DivisionView from "@/components/DivisionView";
import { useStore } from "@/lib/store";

export default function ElitePage() {
  const { registrations } = useStore();
  const n = registrations.filter((r) => r.division === "elite").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-5xl font-black tracking-tight">
        <span className="bg-gradient-to-r from-rivals-gold via-rivals-red to-rivals-blue bg-clip-text text-transparent">Elite</span>
      </h1>
      <p className="mt-2 text-slate-400">División Elite — Champion 3 en adelante. {n} equipos registrados.</p>
      <DivisionView division="elite" />
    </div>
  );
}
