import Link from "next/link";

const HOME = { es: "Inicio", en: "Home" };

export function Breadcrumbs({
  items,
  lang,
}: {
  items: { href?: string; label: string }[];
  lang: "es" | "en";
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
      <Link href="/" className="transition hover:text-rivals-gold">
        {HOME[lang]}
      </Link>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="text-slate-600">/</span>
          {item.href ? (
            <Link href={item.href} className="transition hover:text-rivals-gold">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}