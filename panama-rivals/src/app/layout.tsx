import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Panamá Rivals — Rocket League de Panamá",
  description:
    "Monthly open Rocket League league in Panama. Captains register teams, battle through 4 groups and a knockout bracket, all in one night.",
};

export const viewport: Viewport = {
  themeColor: "#0a0e16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"
        />
      </head>
      <body className="min-h-screen">
        {/* Fixed ambient "wallpaper" — CSA-style floating backdrop, content scrolls over it */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
        >
          <div className="rivals-aura absolute inset-0" />
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(1000px_600px_at_30%_20%,rgba(58,134,255,0.25),transparent_60%),radial-gradient(900px_600px_at_75%_25%,rgba(230,57,70,0.22),transparent_55%),radial-gradient(800px_600px_at_50%_110%,rgba(255,209,102,0.12),transparent_60%)]" />
        </div>
        <Providers>
          <Header />
          <main className="relative z-10 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
