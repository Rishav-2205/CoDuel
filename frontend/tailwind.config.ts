import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          950: "#07080d",
          900: "#0d0f17",
          850: "#131622",
          800: "#181d2e",
          700: "#242a42",
          600: "#323a5c",
        },
        electric: {
          purple: "#9333ea",
          violet: "#7c3aed",
          indigo: "#6366f1",
          cyan: "#06b6d4",
          blue: "#2563eb",
          neon: "#a855f7",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(168, 85, 247, 0.6))" },
          "50%": { opacity: "0.85", filter: "drop-shadow(0 0 25px rgba(59, 130, 246, 0.8))" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s infinite ease-in-out",
        "shake": "shake 0.35s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
