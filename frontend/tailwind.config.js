/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        polar: {
          950: "#020617",
          900: "#080e1e",
          850: "#0c152e",
          800: "#0f172a",
          700: "#1e293b",
          600: "#334155",
          500: "#475569"
        },
        ice: {
          DEFAULT: "#38bdf8",
          glow: "#7dd3fc",
          dim: "#0284c7",
          dark: "#0369a1"
        },
        aurora: {
          DEFAULT: "#10b981",
          bright: "#34d399",
          dim: "#059669"
        },
        blizzard: {
          DEFAULT: "#e2e8f0",
          pure: "#ffffff",
          muted: "#94a3b8"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"]
      },
      boxShadow: {
        "polar-card": "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        "ice-glow": "0 0 25px -5px rgba(56, 189, 248, 0.35)",
        "aurora-glow": "0 0 25px -5px rgba(16, 185, 129, 0.35)",
        "alert-glow": "0 0 25px -5px rgba(239, 68, 68, 0.45)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};
