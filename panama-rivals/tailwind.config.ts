import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rivals: {
          bg: "#0b1018",
          surface: "#121a26",
          border: "#22303f",
          red: "#e63946",
          blue: "#3a86ff",
          gold: "#ffd166",
          // Rocket League arena accents — sky team-blue + burnt team-orange
          cyan: "#46d7ff",
          cyanSoft: "#7be6ff",
          cyanDim: "#1a9bd6",
          orange: "#ff7a2f",
          orangeSoft: "#ffa45c",
          orangeDim: "#d9531e",
        },
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.28)",
        "card-hover": "0 2px 4px rgba(0,0,0,0.35), 0 20px 48px rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(255,209,102,0.12), 0 0 36px rgba(255,209,102,0.22)",
        "glow-red": "0 20px 60px rgba(230,57,70,0.35)",
        boost:"0 0 0 1px rgba(70,215,255,0.14), 0 0 42px rgba(70,215,255,0.28)",
        "boost-orange": "0 0 0 1px rgba(255,122,47,0.14), 0 0 42px rgba(255,122,47,0.26)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
