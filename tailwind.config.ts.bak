import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0F4C5C",
        "background-light": "#FAFAF9",
        "background-dark": "#151b1d",
        "text-main": "#1C1917",
        "text-muted": "#78716C",
        "border-color": "#E7E5E4",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        serif: ["var(--font-cormorant-garamond)", "serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "3rem",
        full: "9999px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.04)",
        "glass-dark": "0 8px 32px rgba(0,0,0,0.2)",
      },
      keyframes: {
        fadeInTooltip: {
          from: { opacity: "0", transform: "translateY(-50%) translateX(-8px)" },
          to: { opacity: "1", transform: "translateY(-50%) translateX(0)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeInTooltip: "fadeInTooltip 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        slideInLeft: "slideInLeft 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        scaleIn: "scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
} satisfies Config;
