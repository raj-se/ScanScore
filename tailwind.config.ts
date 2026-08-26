import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#120B1E",
          panel: "#1C1330",
          raised: "#271A42",
          line: "#3C2C5C",
        },
        signal: {
          cyan: "#B490FF",
          green: "#3ED9B6",
          amber: "#FDB870",
          red: "#FF6E8E",
        },
        mist: {
          DEFAULT: "#A398C2",
          bright: "#EDE7FA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "sweep-radar": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        scan: "scan 1.8s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
        "sweep-radar": "sweep-radar 3s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
