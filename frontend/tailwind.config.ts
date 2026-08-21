import type { Config } from "tailwindcss";

/**
 * WriteWise design tokens, sourced from the `writewise` Figma file
 * (fileKey JGr2ZuKKC8JEiAIHzNAFLH, node 1001:2) via the Figma MCP connection.
 *
 * Colors resolve through CSS custom properties defined in `globals.css` rather than
 * literal hex values here, so a component cannot be legible in only one theme: the
 * token swaps at the `<html>` level instead of relying on someone remembering a
 * `dark:` variant on every element.
 *
 * Channels are stored space-separated (`249 115 22`) so Tailwind's `/<alpha-value>`
 * modifier keeps working.
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
  // Figma accent swatches used verbatim by the landing sections.
  "ink",
  "accent-yellow",
  "accent-yellow-soft",
  "accent-blue",
  "accent-blue-soft",
  "accent-green",
  "accent-green-soft",
  "accent-peach",
] as const;

const colors = Object.fromEntries(COLOR_TOKENS.map((name) => [name, token(name)]));

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors,
      fontFamily: {
        // Playfair Display carries every heading in the design, including the italic
        // emphasis runs ("AI-powered feedback", "focus area", "plan").
        display: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        body: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        // Caveat is the handwritten marker voice: "Simple process", "Start practicing →",
        // "Coming soon", "Examiner Grade". Decorative only — never load-bearing text.
        accent: ["var(--font-caveat)", "Caveat", "cursive"],
      },
      fontSize: {
        // The hero headline is three words, so it can carry far more weight than the
        // section headings. Fluid rather than stepped: at 9vw it stays optically the
        // same size relative to the column across the whole breakpoint range.
        "display-hero": [
          "clamp(2.75rem, 6.4vw, 6.5rem)",
          { lineHeight: "0.92", letterSpacing: "-0.04em", fontWeight: "700" },
        ],
        eyebrow: ["12px", { lineHeight: "16px", letterSpacing: "1.6px", fontWeight: "600" }],
        "mono-caps": ["11px", { lineHeight: "16px", letterSpacing: "2px", fontWeight: "600" }],
        "display-xl": ["72px", { lineHeight: "72px", letterSpacing: "-1.8px", fontWeight: "700" }],
        "display-xl-mobile": ["44px", { lineHeight: "1.08", letterSpacing: "-1px", fontWeight: "700" }],
        "display-lg": ["48px", { lineHeight: "48px", fontWeight: "700" }],
        "display-lg-mobile": ["34px", { lineHeight: "1.15", fontWeight: "700" }],
        "headline-md": ["36px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-sm": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "title-lg": ["30px", { lineHeight: "36px", fontWeight: "700" }],
        "stat": ["36px", { lineHeight: "40px", fontWeight: "700" }],
        "body-xl": ["20px", { lineHeight: "28px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "29.25px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "1.2px", fontWeight: "700" }],
        "label-caps-lg": ["14px", { lineHeight: "20px", letterSpacing: "1.4px", fontWeight: "700" }],
        "marker": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "mono-ui": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.25rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        // The Skill Selection cards use asymmetric "organic" corners rather than a
        // uniform radius — the design's signature shape, not a rounding choice. Values
        // are the reference's own percentage pairs, which keep the blob proportional at
        // any card size where a px radius would distort it.
        blob: "60% 40% 30% 70% / 60% 30% 70% 40%",
        "blob-alt": "30% 70% 70% 30% / 30% 30% 70% 70%",
      },
      boxShadow: {
        // The comparison and CTA cards use hard offset shadows (no blur), which is what
        // gives the page its sticker-on-paper feel. Blurred shadows read as generic.
        brutal: "8px 8px 0px 0px #000000",
        "brutal-lg": "12px 12px 0px 0px #000000",
        "brutal-sm": "4px 4px 0px 0px #000000",
        "brutal-accent": "8px 8px 0px 0px #ff7a38",
        "brutal-accent-soft": "12px 12px 0px 0px rgba(255,122,56,0.3)",
        card: "0px 20px 25px -5px rgba(0,0,0,0.1), 0px 8px 10px -6px rgba(0,0,0,0.1)",
        hairline: "0px 1px 2px 0px rgba(0,0,0,0.05)",
      },
      spacing: {
        unit: "4px",
        gutter: "24px",
        "margin-mobile": "24px",
        "margin-desktop": "24px",
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "48px",
        "stack-xl": "64px",
        "section-y": "96px",
      },
      maxWidth: {
        container: "1280px",
        prose: "576px",
      },
      rotate: {
        "1.5": "1.5deg",
        "2.5": "2.5deg",
      },
      zIndex: {
        // A named scale, so nothing has to invent a number. Previously the page mixed
        // z-50 / z-20 / -z-10 with no stated order between them.
        base: "0",
        raised: "10",
        sticky: "40",
        nav: "50",
        overlay: "60",
      },
      keyframes: {
        // The `floatUp` keyframes and the four `float-*` utilities that used to live
        // here were referenced by nothing in src/ and are gone.
        caretBlink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        grainShift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-2%, 1%)" },
          "50%": { transform: "translate(1%, -2%)" },
          "75%": { transform: "translate(2%, 2%)" },
        },
      },
      animation: {
        caret: "caretBlink 1.05s step-end infinite",
        grain: "grainShift 8s steps(4) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
