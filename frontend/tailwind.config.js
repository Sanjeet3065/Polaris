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
        // Override Tailwind default sky & cyan so no neon blue/cyan AI generated styling leaks through
        sky: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316", // Polar Safety Orange
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407"
        },
        cyan: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316", // Polar Safety Orange
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          950: "#431407"
        },
        blue: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B", // Clean industrial slate
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617"
        },
        polar: {
          950: "#0C0D11", // Deep neutral carbon black (Chassis body)
          900: "#13151B", // Command center graphite (Panels & Headers)
          850: "#181B23", // Card background
          800: "#1E222D", // Elevated card / modal
          750: "#292E3B", // Hairline carbon border
          700: "#373E4F", // Hover border
          600: "#50586D",
          500: "#758097"
        },
        expedition: {
          DEFAULT: "#F97316", // Polar Safety International Orange
          hover: "#EA580C",
          light: "#FB923C",
          dim: "rgba(249, 115, 22, 0.12)"
        },
        tactical: {
          orange: "#F97316", // High-vis polar expedition accent
          amber: "#F59E0B",  // Caution / Advisory
          red: "#EF4444",    // Critical Hazard
          green: "#10B981",  // Nominal Status
          slate: "#94A3B8"   // Secondary telemetry
        },
        ice: {
          DEFAULT: "#F97316",
          glow: "#FB923C",
          dim: "#EA580C",
          dark: "#9A3412"
        },
        aurora: {
          DEFAULT: "#10B981",
          bright: "#34D399",
          dim: "#059669"
        },
        blizzard: {
          DEFAULT: "#F1F5F9",
          pure: "#FFFFFF",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"]
      },
      boxShadow: {
        "polar-card": "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)",
        "titanium": "0 1px 3px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        "hud": "0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        "orange-glow": "0 0 16px -2px rgba(249, 115, 22, 0.25)",
        "aurora-glow": "0 0 16px -2px rgba(16, 185, 129, 0.25)",
        "alert-glow": "0 0 18px -2px rgba(239, 68, 68, 0.3)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};
