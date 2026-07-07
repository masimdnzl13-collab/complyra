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
    },
  },
  plugins: [],
};
export default config;
