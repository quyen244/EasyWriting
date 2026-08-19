---
name: Academic Editorial
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747781'
  outline-variant: '#c4c6d1'
  surface-tint: '#3f5e95'
  primary: '#0d3368'
  on-primary: '#ffffff'
  primary-container: '#2a4a80'
  on-primary-container: '#9dbbf8'
  inverse-primary: '#acc7ff'
  secondary: '#7b5800'
  on-secondary: '#ffffff'
  secondary-container: '#fdcd70'
  on-secondary-container: '#775600'
  tertiary: '#2d3441'
  on-tertiary: '#ffffff'
  tertiary-container: '#444b58'
  on-tertiary-container: '#b4bbcb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#26467c'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#eec064'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#dce2f3'
  tertiary-fixed-dim: '#c0c7d7'
  on-tertiary-fixed: '#151c27'
  on-tertiary-fixed-variant: '#404754'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: literata
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: literata
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: literata
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: literata
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  mono-ui:
    fontFamily: geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max-width: 1200px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

This design system is built on an **Editorial Modernist** aesthetic, tailored for the high-stakes academic environment of IELTS preparation. It rejects the over-saturated, gradient-heavy trends of typical SaaS products in favor of a "Physical Journal" feel. The emotional goal is to provide a calm, studious atmosphere that reduces anxiety while maintaining a high standard of professional authority.

The system utilizes high-contrast typography and a structured grid to mimic the legibility of a premium academic publication. It avoids shadows and blurs, relying instead on hairline strokes and tonal shifts to define hierarchy. The aesthetic is human and scholarly, prioritizing the written word above all else.

## Colors

The palette is anchored by **Deep Ink Indigo**, used strategically for primary actions and active navigational states to signal reliability. The canvas is a **Warm Near White**, chosen to reduce eye strain during long reading and writing sessions compared to a clinical pure white.

**Muted Gold** is reserved strictly for evaluation metrics—scores, band levels, and achievement indicators—giving them a distinct "medal" or "certificate" status without being gaudy. Neutral tones are desaturated and lean toward the cool spectrum of the Indigo to maintain a cohesive, ink-on-paper relationship. Semantics are intentionally muted to remain professional and avoid a "game-like" feel.

## Typography

The typographic strategy employs a high-contrast pairing: **Literata** (Serif) for narrative and editorial weight, and **Geist** (Sans-serif) for functional, data-driven, and interface tasks.

- **Headlines:** Use Literata for all major page titles and section headers. This establishes the academic "voice."
- **Body Text:** Use Geist for essay inputs, feedback notes, and general UI. Its geometric clarity ensures legibility at small sizes.
- **Micro-copy:** Use "label-caps" (Geist Bold, Uppercase) for category labels, breadcrumbs, and small metadata to provide a disciplined, structured feel.
- **Line Height:** Generous line heights are maintained to ensure the "Editorial" feel and improve readability of long-form feedback.

## Layout & Spacing

This design system utilizes a **Fixed-Fluid Hybrid Grid**. Content is centered within a 1200px container on desktop to maintain optimal line lengths for reading. On mobile, margins reduce to 16px to maximize the writing area.

Hierarchy is created through **Negative Space** rather than containment. Large vertical gaps (stack-lg) separate major conceptual sections. Dividers should be 1px hairlines using the lightest neutral shade. Layouts should feel asymmetric and editorial, with ample "white space" around critical scoring components to give them breathing room.

## Elevation & Depth

This system avoids traditional shadows to maintain its flat, editorial character. Depth is achieved through **Tonal Layering** and **Hairline Strokes**:

1.  **Level 0 (Base):** Warm Near White (#FAFAF7).
2.  **Level 1 (In-set):** Slightly darker neutral tint or a 1px border (#E2E8F0) for input fields and content cards.
3.  **Active/Overlay:** 1px solid Deep Ink Indigo border for focused elements.

Floating elements (like tooltips or dropdowns) should use a very subtle, sharp 1px border and a tiny 2px "hard" shadow if absolutely necessary for visibility, avoiding large blurs.

## Shapes

The shape language is **Refined and Modern**. A 0.5rem (8px) base radius is applied to buttons and cards, providing a professional "medium" roundness that feels more approachable than sharp corners but more serious than "bubble" shapes.

- **Small elements (Checkboxes, Tags):** 4px (Soft).
- **Large containers (Score Panels, Essay Boxes):** 16px (Rounded-XL).
- **Buttons:** Standard 8px radius to match the UI's balanced character.

## Components

### Buttons
- **Primary:** Deep Ink Indigo background, White text. No gradients.
- **Secondary:** Transparent background, 1px Deep Ink Indigo border.
- **Tertiary:** Text-only with an underline on hover, using Geist Medium.

### Input Fields
- **Essay Area:** Large, bordered box with Geist 18px text. Background remains the base color to feel like paper. Active state is signaled by a 2px Indigo border.
- **Labels:** Always Geist Bold, 12px, Uppercase, positioned above the input.

### Scoring Cards
- Large, bold Muted Gold number using Literata.
- Surrounded by ample whitespace and a 1px hairline border.
- Sub-scores (Grammar, Vocabulary, etc.) should use horizontal progress bars in Muted Gold.

### Lists & Dividers
- Use 1px #E2E8F0 horizontal lines to separate list items.
- Bullet points should be small, solid Indigo squares for a more modern, structured look than standard circles.

### Feedback Chips
- Use the semantic colors (Success/Warning/Error) for inline feedback, but keep the backgrounds very light (10% opacity) with dark text to ensure the editorial tone is not broken by "loud" blocks of color.