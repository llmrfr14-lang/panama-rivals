# Panamá Rivals — Dev Notes

## Stack
- Next.js 15 (App Router), TypeScript, Tailwind v4+ (custom `rivals-*` theme tokens in tailwind.config.ts), dark-first design.
- Estado global: Zustand store (`src/lib/store.ts`); datos localen localStorage + sync opcional con Supabase si hay env vars.
- i18n: `src/lib/i18n.tsx` — objeto de idioma `es`/`en`, hook `useI18n()` returns `{ t, lang }`.

## Comandos
- `npm run dev` / `npm run build` / `npm run start`
- Typecheck: `npx tsc --noEmit` (project-level, pasar before proseguir.

## Convenciones (agregadas en esta tanda)
- **Tema claro/oscuro**: `src/lib/theme.tsx` — `<ThemeProvider>` en `Providers.tsx`; toggle en `Header.tsx`. Persiste `localStorage["pr-theme"]` + clase `html.light`. Overrides light viven al fondo de `src/app/globals.css` bajo selector `html.light`. NO usar `dark:` variants — el tema default es dark; light se resuelve por overrides CSS globales.

- **PWA install banner**: `src/components/InstallBanner.tsx` — escucha `beforeinstallprompt`, guarda el prompt deferred, botones Install/Después; se oculta si standalone, tras "Después" (sessionStorage `pr-install-dismissed`) o instalado. Renderizado en `src/app/layout.tsx` dentro del `<Providers>`.
- **Wizard de registro**: `src/app/register/page.tsx` — 4 pasos (Equipo, Capitán, Jugadores, Resumen); `STEPS` const, `step` state, validación por paso (`teamValid` etc.), barra de progreso, submit via `registerTeam(...)`.
- **Admin live check-in**: `src/app/admin/page.tsx` — panel "Resultados · Check-in en vivo" (por división y grupo faltantes), botón "Aplicar deadlines FF ahora" (`match.ffDeadline`). Requiere código admin (`/api/admin-auth`, default legacy `fieles-2026-campeon` server-side).
- **Home carousel**: `src/app/page.tsx` — sección EXPERIENCE: carousel automático en móvil (`md:hidden`, auto-advance 3.5s, pausa en hover, dots+flechas), grilla `md:grid-cols-3` en desktop.. Estado: `active`/`paused` + `STEPS=3`, `next`/`prev` con `useCallback`; interval solo corre si matchMedia max-width:767px.
- **Tema Rocket League**: paleta en `tailwind.config.ts` — `rivals.cyan`/`cyanSoft`/`cyanDim` + `orange`/`orangeSoft`/`orangeDim` (team blue/team orange) además de red/blue/gold legacy. Acentos RL: shimmer hero `from-rivals-cyan via-rivals-gold to-rivals-orange`; CTA principal `bg-rivals-orange`; Discord `bg-rivals-cyan/10 text-rivals-cyanSoft`; overline kicker `.rivals-kicker-line` (líneas cyan+orange flanqueando,etiqueta); hazard `.rivals-hazard`; hex mesh `.rivals-hex` (en `layout.tsx`, z-1); boost trail nav `.rl-nav-boost`; scroll hairline cyan→gold→orange. Texto oscuro default; light overrides viven bajo `html.light` al fondo de `globals.css`.
- Texto UI nuevo va a `src/lib/i18n.tsx` siempre (tanto `es` como `en`).