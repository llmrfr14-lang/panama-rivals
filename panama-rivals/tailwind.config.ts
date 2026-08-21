import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rivals: {
          bg: "#0a0e16",
          surface: "#11161f",
          border: "#1e2634",
          red: "#e63946",
          blue: "#3a86ff",
          gold: "#ffd166",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
