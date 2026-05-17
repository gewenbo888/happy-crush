import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        candy: {
          pink:   "#ff6fae",
          rose:   "#ff85c1",
          peach:  "#ffd1a4",
          mint:   "#a8f5e2",
          cyan:   "#7be8ff",
          blue:   "#7aa6ff",
          violet: "#c79bff",
          yellow: "#ffe17a",
          orange: "#ff9d57",
          red:    "#ff5d6d",
        },
        sky: {
          deep:  "#1e0c3a",
          night: "#2a1158",
          dawn:  "#5b2e9b",
          rose:  "#ff9ed1",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
        han:     ["var(--font-han)", "serif"],
      },
      animation: {
        "float-y":   "floatY 6s ease-in-out infinite",
        "float-x":   "floatX 7s ease-in-out infinite",
        "spin-slow": "spin 18s linear infinite",
        "bounce-soft": "bounceSoft 2.2s ease-in-out infinite",
        "rainbow-pan": "rainbowPan 8s linear infinite",
        "wiggle":    "wiggle 0.6s ease-in-out infinite",
        "pop":       "pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "shake":     "shake 0.55s cubic-bezier(.36,.07,.19,.97) both",
      },
      keyframes: {
        floatY: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-14px)" },
        },
        floatX: {
          "0%,100%": { transform: "translateX(0)" },
          "50%":     { transform: "translateX(10px)" },
        },
        bounceSoft: {
          "0%,100%": { transform: "translateY(0) scale(1)" },
          "50%":     { transform: "translateY(-6px) scale(1.04)" },
        },
        rainbowPan: {
          "0%":   { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%":     { transform: "rotate(3deg)" },
        },
        pop: {
          "0%":   { transform: "scale(0.4)", opacity: "0" },
          "60%":  { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "10%, 90%": { transform: "translate3d(-1px, 0, 0)" },
          "20%, 80%": { transform: "translate3d(2px, 0, 0)" },
          "30%, 50%, 70%": { transform: "translate3d(-4px, 0, 0)" },
          "40%, 60%": { transform: "translate3d(4px, 0, 0)" },
        },
      },
      boxShadow: {
        "glow-pink":   "0 0 24px rgba(255, 111, 174, 0.55), 0 0 48px rgba(255, 111, 174, 0.35)",
        "glow-cyan":   "0 0 24px rgba(123, 232, 255, 0.55), 0 0 48px rgba(123, 232, 255, 0.35)",
        "glow-yellow": "0 0 24px rgba(255, 225, 122, 0.55), 0 0 48px rgba(255, 225, 122, 0.35)",
        "candy":       "0 8px 22px rgba(89, 22, 122, 0.28), inset 0 1px 0 rgba(255,255,255,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
