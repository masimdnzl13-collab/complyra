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
        mono: ["var(--font-jetbrains-mono)"],
      },
      spacing: {
        // Shared section-rhythm scale — every marketing section picks its
        // top/bottom padding from here so vertical spacing stays consistent
        // across the page instead of ad hoc py-* values per section.
        "section-lg": "6rem",
        "section-md": "4rem",
        "section-sm": "1.5rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
