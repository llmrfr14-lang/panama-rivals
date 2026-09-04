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
          className="pointer-events-none fixed inset-0 z-0"
        >
          {/* Looped background video (put your clip in public/ and set VIDEO_URL below) */}
          <video
            className="rivals-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/bg-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#070b12]/55" />
          <div className="rivals-aura absolute inset-0" />
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
