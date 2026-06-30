/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f4f7f4",
          100: "#e3ebe3",
          200: "#c5d8c5",
          300: "#9bb99b",
          400: "#6f9a6f",
          500: "#4f7d4f",
          600: "#3d633d",
          700: "#324f32",
          800: "#2a402a",
          900: "#243524",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgb(36 53 36 / 0.04), 0 8px 24px rgb(36 53 36 / 0.06)",
        "card-hover":
          "0 2px 4px rgb(36 53 36 / 0.05), 0 16px 40px rgb(36 53 36 / 0.1)",
        glow: "0 0 0 1px rgb(79 125 79 / 0.08), 0 12px 32px rgb(61 99 61 / 0.18)",
        inset: "inset 0 1px 2px rgb(36 53 36 / 0.06)",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(at 20% 20%, rgb(227 235 227 / 0.9) 0, transparent 50%), radial-gradient(at 80% 0%, rgb(197 216 197 / 0.45) 0, transparent 45%), radial-gradient(at 50% 100%, rgb(244 247 244 / 0.95) 0, transparent 55%)",
        "card-shine":
          "linear-gradient(135deg, rgb(255 255 255 / 0.9) 0%, rgb(244 247 244 / 0.4) 100%)",
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out forwards",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
