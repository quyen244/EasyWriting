---
name: Swiss-Nordic Editorial
colors:
  surface: '#f6f9ff'
  surface-dim: '#d4dbe2'
  surface-bright: '#f6f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4fc'
  surface-container: '#e8eef6'
  surface-container-high: '#e3e9f1'
  surface-container-highest: '#dde3eb'
  on-surface: '#161c22'
  on-surface-variant: '#45464d'
  inverse-surface: '#2b3137'
  inverse-on-surface: '#ebf1f9'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006d30'
  on-secondary: '#ffffff'
  secondary-container: '#92f5a4'
  on-secondary-container: '#007233'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1d'
  on-tertiary-container: '#828485'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#95f8a7'
  secondary-fixed-dim: '#79db8d'
  on-secondary-fixed: '#00210a'
  on-secondary-fixed-variant: '#005323'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f6f9ff'
  on-background: '#161c22'
  surface-variant: '#dde3eb'
typography:
  display-score:
    fontFamily: Geist
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: '0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-page: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is anchored in Swiss International Style and Nordic minimalism. It prioritizes functional clarity, typographic rigor, and credible editorial aesthetics over generic SaaS trends. The emotional response should be one of calm focus, academic authority, and precision.

The style is characterized by a "reduced" aesthetic:
- **Minimalism:** Use of generous negative space to reduce cognitive load during intensive writing tasks.
- **Editorial Influence:** High-contrast typography and strict grid alignments that mirror modern academic journals.
- **Functional Credibility:** Avoiding soft shadows or playful gradients in favor of structural borders and purposeful color application.

## Colors

The palette is restrained to maintain an academic and focused atmosphere.

- **Background (#F9FAFB):** A soft off-white surface that reduces eye strain compared to pure white, serving as the primary canvas for the workspace.
- **Primary Text (#0F172A):** Slate Navy ensures maximum legibility and a sophisticated, authoritative tone.
- **Functional Accent (#15803D):** Deep Forest Green is reserved exclusively for "success" states, high band scores, and primary actions. It signals growth and achievement without the urgency of brighter greens.
- **Borders (#E2E8F0):** Subtle Slate is used for structural definition and hair-line dividers, maintaining the grid without creating visual noise.

## Typography

Geist is utilized for its technical precision and neutral, modern letterforms. 

- **Headings:** Utilize tight letter spacing and bold weights to create a strong visual anchor.
- **Body:** Standardized at 16px or 18px with a generous 1.6 line-height to facilitate long-form reading and editing.
- **Data Points:** Large "Display" sizes are used for band scores to provide immediate feedback.
- **Labels:** Uppercase labels with slight tracking are used for secondary metadata and form headers.

## Layout & Spacing

The layout follows a strict 12-column grid for dashboards and a specialized two-column "Workspace" layout for the writing interface.

- **Workspace Layout:** A 60/40 split between the text editor (left) and the feedback/scoring panel (right). This ensures the user's primary focus remains on the writing while keeping metrics in the periphery.
- **Rhythm:** An 8px base unit drives all spacing decisions.
- **Responsiveness:** On tablet, the workspace stacks vertically or uses a collapsible sidebar for feedback. On mobile, margins reduce to 16px, and the feedback panel becomes an overlay.

## Elevation & Depth

This design system avoids traditional shadows to maintain its "flat" Swiss-Nordic aesthetic. 

- **Tonal Layering:** Depth is achieved by placing off-white containers (#FFFFFF) on the soft-gray background (#F9FAFB).
- **Subtle Outlines:** 1px solid borders (#E2E8F0) provide the only necessary separation between elements.
- **Active States:** Instead of a shadow, an active state or focus state is indicated by a 1px or 2px solid border in Slate Navy (#0F172A).

## Shapes

Shapes are intentionally conservative to emphasize structure and professional credibility.

- **Radius:** A consistent 0.25rem (4px) radius is applied to buttons, input fields, and cards. This provides a "soft" geometric feel without leaning into the playfulness of fully rounded corners.
- **Interactive Elements:** Buttons and inputs share the same height and radius to maintain a modular, architectural look.

## Components

### Buttons
- **Primary:** High-contrast. Background: #0F172A; Text: #F9FAFB. No shadow.
- **Functional:** Background: #15803D; Text: #FFFFFF. Used for "Submit" or "Grade My Essay."
- **Secondary:** Transparent background with 1px border (#E2E8F0).

### Metric Chips
- Used for Band Scores. Large typography within a light green tinted background (#F0FDF4) with dark green text (#15803D).

### Cards (Comparison & Feedback)
- Flat white containers with a 1px border (#E2E8F0). No shadows.
- Headers within cards should use the `label-sm` typographic style for categorization.

### Input Fields (The Editor)
- Distraction-free. No border by default, or a very light bottom border. 
- Focus state: 1px solid border (#0F172A) to indicate the active writing area.

### List Items
- Clean, tight vertical padding. Separated by hairline borders. Used for "Common Errors" or "Vocabulary Suggestions."