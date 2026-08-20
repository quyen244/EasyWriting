import type { Config } from "tailwindcss";

/**
 * `academic_editorial` design tokens (002 T004).
 *
 * Colors resolve through CSS custom properties defined in `globals.css` rather than
 * being literal hex values here. That is a deliberate deviation from tasks.md T030's
 * literal instruction to "add `dark:` variants" to every workspace component.
 *
 * The requirement behind T030 is FR-018/SC-007: no element may be legible in only one
 * theme. Hand-writing `dark:` on every element satisfies that only as long as nobody
 * ever forgets one — and the one that gets forgotten is exactly the failure SC-007
 * describes. Routing every color through a semantic token that swaps at the `<html>`
 * level makes a light-only component structurally impossible instead of merely
 * discouraged. `dark:` remains available and is still used where a token genuinely
 * cannot express the difference.
 *
 * Channels are stored space-separated (`13 51 104`) so Tailwind's `/<alpha-value>`
 * modifier keeps working — the design system asks for 10%-opacity feedback chips.
 */
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const COLOR_TOKENS = [
  "surface",
  "surface-dim",
  "surface-bright",
  "surface-container-lowest",
  "surface-container-low",
  "surface-container",
  "surface-container-high",
  "surface-container-highest",
  "surface-variant",
  "on-surface",
  "on-surface-variant",
  "inverse-surface",
  "inverse-on-surface",
  "outline",
  "outline-variant",
  "surface-tint",
  "primary",
  "on-primary",
  "primary-container",
  "on-primary-container",
  "inverse-primary",
  "primary-fixed",
  "primary-fixed-dim",
  "on-primary-fixed",
  "on-primary-fixed-variant",
  "secondary",
  "on-secondary",
  "secondary-container",
  "on-secondary-container",
  "secondary-fixed",
  "secondary-fixed-dim",
  "on-secondary-fixed",
  "on-secondary-fixed-variant",
  "tertiary",
  "on-tertiary",
  "tertiary-container",
  "on-tertiary-container",
  "tertiary-fixed",
  "tertiary-fixed-dim",
  "on-tertiary-fixed",
  "on-tertiary-fixed-variant",
  "error",
  "on-error",
  "error-container",
  "on-error-container",
  "background",
  "on-background",
] as const;

const colors = Object.fromEntries(COLOR_TOKENS.map((name) => [name, token(name)]));

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors,
      fontFamily: {
        display: ["var(--font-literata)", "Literata", "Georgia", "serif"],
        body: ["var(--font-geist)", "Geist", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["36px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["32px", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-sm": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label-caps": [
          "12px",
          { lineHeight: "1.0", letterSpacing: "0.05em", fontWeight: "600" },
        ],
        "mono-ui": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.25rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      spacing: {
        unit: "4px",
        gutter: "24px",
        "margin-mobile": "16px",
        "margin-desktop": "64px",
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "48px",
      },
      maxWidth: {
        container: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
