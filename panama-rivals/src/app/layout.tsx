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

export const viewport: Viewport = {
  themeColor: "#0a0e16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${outfit.variable} ${inter.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PR Rivals" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"
        />
      </head>
      <body className="min-h-screen">
        <SkipLink />
        {/* Fixed ambient backdrop — glass atmosphere only */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div className="rivals-aura absolute inset-0" />
        </div>
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
