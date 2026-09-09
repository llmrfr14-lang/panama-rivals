import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SkipLink } from "@/components/SkipLink";
import { ScrollProgress } from "@/components/ScrollProgress";
import { InstallBanner } from "@/components/InstallBanner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const title = "Panamá Rivals — Rocket League de Panamá";
const description =
  "Liga abierta de Rocket League en Panamá. Registra tu equipo, juega grupos y eliminatorias en un solo día.. 🏆";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "https://panamarivals.com",
    siteName: title,
    locale: "es_PA",
    type: "website",
    images: [{ url: "https://panamarivals.com/logo.png", width: 512, height: 512, alt: "Panamá Rivals logo" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["https://panamarivals.com/logo.png"],
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

const LIGHT_THEME_COLOR = "#eef2f8";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070b12" },
    { media: "(prefers-color-scheme: light)", color: LIGHT_THEME_COLOR },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${outfit.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pr-theme");if(t==="light"){document.documentElement.classList.add("light");document.documentElement.classList.remove("dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#eef2f8");}}catch(e){}})();`,
          }}
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PR Rivals" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"
        />
      <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsEvent",
              name: title,
              description,
              sport: "Rocket League (esports)",
              location: {
                "@type": "Place",
                name: "Panamá (online)",
                address: { "@type": "PostalAddress", addressCountry: "PA" },
              },
              eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
              organiser: {
                "@type": "Organization",
                name: "Panamá Rivals",
                url: "https://panamarivals.com",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen">
        <SkipLink />
        {/* Fixed ambient backdrop — glass atmosphere only */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div className="rivals-aura absolute inset-0" />
        </div>
        {/* Fixed hexagonal arena-mesh texture — RL honeycomb over everything */}
        <div aria-hidden="true" className="rivals-hex" />
        <Providers>
          <ScrollProgress />
          <Header />
          <main id="main" className="relative z-10 flex flex-col">{children}</main>
          <Footer />
          <InstallBanner />
        </Providers>
      </body>
    </html>
  );
}
