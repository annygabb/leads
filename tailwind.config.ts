import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07111F",
        card: "#101827",
        table: "#0E1726",
        border: "#22324A",
        foreground: "#FFFFFF",
        muted: "#94A3B8",
        "text-blue": "#7DD3FC",
        priority: {
          urgent: "#EF4444",
          high: "#EF4444",
          medium: "#F97316",
          waiting: "#EAB308",
          progress: "#3B82F6",
          client: "#22C55E",
        },
        status: {
          hot: "#EF4444",
          warm: "#F97316",
          waiting: "#EAB308",
          progress: "#3B82F6",
          client: "#22C55E",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
