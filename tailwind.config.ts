import type { Config } from "tailwindcss";
import { brandColors } from "./src/config/site";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: brandColors.navy,
        accent: brandColors.accent,
        surface: brandColors.background.surface,
        success: brandColors.success.DEFAULT,
        warning: brandColors.warning.DEFAULT,
        danger: brandColors.danger.DEFAULT,
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
      },
      spacing: {
        section: "120px",
      },
      borderRadius: {
        "card-lg": "20px",
      },
      boxShadow: {
        premium: "0 1px 2px rgba(10, 22, 38, 0.04), 0 8px 24px rgba(10, 22, 38, 0.06)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
