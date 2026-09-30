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
          950: "#060A12", // Deep titanium obsidian
          900: "#0B111E", // Command center slate
          850: "#10182A", // Console surface
          800: "#152036", // Elevated panel
          750: "#1B2945", // Hairline border
          700: "#223354",
          600: "#364C77",
          500: "#546E9E"
        },
        tactical: {
          cyan: "#00E5C8", // Arctic tactical cyan
          teal: "#06B6D4", // Secondary telemetry
          blue: "#2563EB", // Command telemetry cobalt
          amber: "#F59E0B", // Advisory caution
          red: "#F43F5E", // Hazard critical
          green: "#10B981" // Nominal status
        },
        ice: {
          DEFAULT: "#00E5C8",
          glow: "#38EDD2",
          dim: "#0891B2",
          dark: "#0E7490"
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
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"]
      },
      boxShadow: {
        "polar-card": "inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 4px 24px -2px rgba(0, 0, 0, 0.65)",
        "titanium": "inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 6px 28px -4px rgba(0, 0, 0, 0.75)",
        "hud": "0 0 0 1px rgba(255, 255, 255, 0.07), 0 10px 30px rgba(0, 0, 0, 0.7)",
        "ice-glow": "0 0 16px -2px rgba(0, 229, 200, 0.2)",
        "aurora-glow": "0 0 16px -2px rgba(16, 185, 129, 0.25)",
        "alert-glow": "0 0 18px -2px rgba(244, 63, 94, 0.3)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};
