---
name: Lumina Academic
colors:
  surface: '#f9f9f6'
  surface-dim: '#dadad7'
  surface-bright: '#f9f9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f1'
  surface-container: '#eeeeeb'
  surface-container-high: '#e8e8e5'
  surface-container-highest: '#e2e3e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f1f1ee'
  outline: '#747781'
  outline-variant: '#c4c6d1'
  surface-tint: '#3f5e95'
  primary: '#0d3368'
  on-primary: '#ffffff'
  primary-container: '#2a4a80'
  on-primary-container: '#9dbbf8'
  inverse-primary: '#acc7ff'
  secondary: '#516161'
  on-secondary: '#ffffff'
  secondary-container: '#d4e6e5'
  on-secondary-container: '#576867'
  tertiary: '#003e13'
  on-tertiary: '#ffffff'
  tertiary-container: '#0f5721'
  on-tertiary-container: '#85cc88'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#26467c'
  secondary-fixed: '#d4e6e5'
  secondary-fixed-dim: '#b8cac9'
  on-secondary-fixed: '#0e1e1e'
  on-secondary-fixed-variant: '#3a4a49'
  tertiary-fixed: '#abf4ac'
  tertiary-fixed-dim: '#90d792'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#07521d'
  background: '#f9f9f6'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e0'
  surface-cool: '#F1F5F9'
  ink-text: '#334155'
  mint-accent: '#B2DFDB'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Fraunces
    fontSize: 34px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Fraunces
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.06em
  mono-ui:
    fontFamily: Geist
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
  base: 4px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  stack-sm: 16px
  stack-md: 32px
  stack-lg: 64px
  max-width: 1140px
---

## Brand & Style

The design system embodies a **Fresh Editorial** aesthetic, reimagining traditional academic publishing for a modern EdTech context. It moves away from heavy, dense academic styling toward an atmosphere that is "brighter, fresher, and more energetic." The brand personality is scholarly yet revitalizing—designed to reduce the cognitive load and fatigue associated with intensive study.

The visual style is **Minimalist** with a focus on high-clarity typography and a vibrant, airy palette. It rejects heavy shadows and large decorative blobs in favor of a clean, structured interface that uses light tonal shifts and delicate highlights to guide the user's focus. The result is a professional environment that feels intellectually stimulating and approachable.

## Colors

The palette is anchored by **Warm Near White** (#FAFAF7), which serves as the primary canvas to ensure a soft, non-clinical reading experience. **Deep Ink Indigo** (#2A4A80) is the primary brand accent, used with high intentionality only for interactive elements like primary buttons, active navigation states, and critical iconography.

To create rhythm and section differentiation, use **Surface Cool** (#F1F5F9) as a subtle background tint for secondary content blocks. **Soft Mint** (#E0F2F1) and **Muted Green** provide secondary highlights and optimistic visual cues, while the body text utilizes a refined scale of neutral greys (led by **Ink Text** #334155) to maintain high legibility without the harshness of pure black.

## Typography

The typographic strategy balances the literary authority of **Fraunces** with the technical precision of **Geist**. 

- **Display & Headlines:** Fraunces is used to establish the editorial voice. It should be typeset with tight tracking in display sizes to emphasize its characterful serifs.
- **Body & Interface:** Geist is utilized for all functional text. Body copy uses a medium-grey shade to lighten the visual weight of the page.
- **Labels:** Small labels and breadcrumbs use "label-caps" (Geist, All Caps) to create a clear structural hierarchy and a disciplined, professional feel.

## Layout & Spacing

The system follows a **Fixed Grid** model for desktop, centering content within an 1140px container to maintain optimal line lengths for reading-heavy tasks. On mobile, the grid becomes fluid with 20px margins to provide adequate breathing room for touch targets.

The spacing rhythm is generous, using vertical stacks (`stack-lg`) to clearly demarcate chapters or major editorial sections. Negative space is treated as a first-class design element, used to elevate content and prevent the interface from feeling cluttered or "app-like."

## Elevation & Depth

This system avoids traditional drop shadows to maintain its high-contrast, clean editorial profile. Depth is conveyed through **Tonal Layers** and **Low-contrast Outlines**:

- **Layer 0 (Background):** Warm Near White.
- **Layer 1 (Sectioning):** Surface Cool or Soft Mint backgrounds for differentiated content areas.
- **Borders:** Use 1px hairlines in a light neutral or soft indigo tint to define cards and inputs.
- **Focus States:** Only the active element receives a prominent Deep Ink Indigo border (2px) to signify focus, ensuring the rest of the UI remains "flat" and focused on the content.

## Shapes

The shape language is **Rounded**, using an 8px (0.5rem) base to provide a contemporary and friendly feel that softens the seriousness of the academic content.

- **Standard Elements:** 8px radius for buttons and standard cards.
- **Large Containers:** 16px (rounded-lg) for main content areas or featured editorial sections.
- **Interactive Small Elements:** Checkboxes and radio buttons use the 4px (soft) radius to maintain a precise, professional appearance.

## Components

### Buttons
- **Primary:** Deep Ink Indigo background with white text. High contrast, used only for the single most important action on a screen.
- **Secondary:** Soft Mint background with Deep Ink Indigo text. Used for supporting actions.
- **Ghost:** Transparent background with Indigo text, used for navigation or subtle utilities.

### Cards & Sections
- Cards should primarily use a 1px soft-indigo outline or a very subtle `surface-cool` background fill rather than a shadow. 
- Use ample internal padding (32px+) to maintain the airy, editorial feel.

### Input Fields
- Inputs feature a Warm Near White background with a 1px neutral border. 
- On focus, the border transitions to a 2px Deep Ink Indigo stroke.

### Chips & Badges
- **Feedback Chips:** Use very light tints of the secondary (Mint) or semantic colors with dark-tinted text. These should feel like highlights on a page, not heavy blocks.
- **Labeling:** Use the `label-caps` style for consistent categorization across the platform.

### Lists
- Separate list items with a 1px horizontal hairline in the lightest neutral-indigo tint. 
- Bullet points are replaced with small, geometric Indigo squares to reinforce the modern, structured layout.