import type { Config } from "tailwindcss";

// Base scaffold only — 002-core-app-ux's Foundational phase ports the real
// `academic_editorial` design tokens (colors, typography, radii, spacing) here.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
