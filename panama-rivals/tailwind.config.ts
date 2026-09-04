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
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
