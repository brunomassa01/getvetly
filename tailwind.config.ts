import type { Config } from "tailwindcss";

// Tokens extraídos do design system oficial da Vetly (v1.1)
// Fonte: design/logo/vetly-design-tokens.json + vetly-design-system.html
// Cores tiradas literalmente do logo.svg oficial.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marca
        lime: {
          DEFAULT: "#C8FF02",
          deep: "#A8D900",
          soft: "#E8FF7F",
          faint: "#F8FFD4",
        },
        ink: {
          DEFAULT: "#1E1E1E",
          dim: "#2A2A2A",
          soft: "#383838",
        },
        // Superfícies
        paper: {
          DEFAULT: "#FAFAF7",
          warm: "#F4F0E2",
        },
        // Texto
        texto: {
          1: "#1E1E1E",
          2: "#4A4A48",
          3: "#85827A",
          inverse: "#FAFAF7",
        },
        // Semânticas
        success: "#C8FF02",
        warning: "#F2A03F",
        danger: "#E24B4A",
        info: "#3B8FAD",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(30,30,30,.06)",
        md: "0 8px 24px rgba(30,30,30,.08)",
        lg: "0 24px 60px rgba(30,30,30,.12)",
        ring: "0 0 0 3px rgba(200,255,2,.35)",
      },
      letterSpacing: {
        tightest: "-.025em",
        tighter: "-.02em",
        wide2: ".14em",
        wide3: ".18em",
      },
    },
  },
  plugins: [],
};
export default config;
