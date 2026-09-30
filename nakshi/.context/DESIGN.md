---
name: Nokshi
colors:
  surface: "#fbf9f4"
  surface-dim: "#dbdad5"
  surface-bright: "#fbf9f4"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f5f3ee"
  surface-container: "#f0eee9"
  surface-container-high: "#eae8e3"
  surface-container-highest: "#e4e2dd"
  on-surface: "#1b1c19"
  on-surface-variant: "#53433d"
  inverse-surface: "#30312e"
  inverse-on-surface: "#f2f1ec"
  outline: "#86736c"
  outline-variant: "#d9c2ba"
  surface-tint: "#904c31"
  primary: "#86452a"
  on-primary: "#ffffff"
  primary-container: "#a45c40"
  on-primary-container: "#fff1ec"
  inverse-primary: "#ffb59a"
  secondary: "#5f5e5e"
  on-secondary: "#ffffff"
  secondary-container: "#e2dfde"
  on-secondary-container: "#636262"
  tertiary: "#5a574e"
  on-tertiary: "#ffffff"
  tertiary-container: "#736f65"
  on-tertiary-container: "#faf3e7"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#ffdbce"
  primary-fixed-dim: "#ffb59a"
  on-primary-fixed: "#380d00"
  on-primary-fixed-variant: "#72351c"
  secondary-fixed: "#e5e2e1"
  secondary-fixed-dim: "#c8c6c5"
  on-secondary-fixed: "#1c1b1b"
  on-secondary-fixed-variant: "#474746"
  tertiary-fixed: "#e8e2d6"
  tertiary-fixed-dim: "#cbc6ba"
  on-tertiary-fixed: "#1e1c14"
  on-tertiary-fixed-variant: "#4a473e"
  background: "#fbf9f4"
  on-background: "#1b1c19"
  surface-variant: "#e4e2dd"
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: "700"
    lineHeight: "1.2"
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: "600"
    lineHeight: "1.2"
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: "600"
    lineHeight: "1.3"
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.6"
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: "1"
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The brand identity centers on a "Digital Gallery" experience, prioritizing the artwork as the hero of every interaction. The design system adopts a **Minimalist** and **Elegant** style, utilizing generous whitespace to provide breathing room for vibrant craft imagery. The aesthetic is curated and quiet, ensuring that UI elements provide structure without competing for attention.

The target audience includes discerning collectors and traditional artisans. The emotional response is one of calm, sophistication, and cultural pride. By stripping away heavy borders and excessive ornamentation, the UI feels like a clean gallery wall where the interface serves only to facilitate discovery and appreciation.

## Colors

The palette is rooted in the organic materials of Bangladeshi crafts—terracotta clay, charcoal, and unbleached muslin.

- **Primary (Terracotta):** A muted, earthy red used sparingly for key actions, live auction indicators, and subtle accents. It provides warmth and cultural relevance.
- **Secondary (Charcoal):** Used for all primary typography and high-emphasis UI elements to ensure a grounded, authoritative feel.
- **Neutral (Muslin & Bone):** The "off-white" background system. `#F9F7F2` is the primary surface, while `#E8E2D6` is used for subtle container differentiation.

Avoid using pure black or high-vibrancy reds; keep the tones natural and understated.

## Typography

This design system uses a high-contrast typographic pairing to evoke a gallery editorial feel.

- **Headlines (Playfair Display):** These bring a classical, sophisticated character to the page. Use for artist names, artwork titles, and page sections.
- **UI & Body (Inter):** A neutral, highly legible sans-serif for descriptions, metadata, and navigation. It remains functional and unobtrusive.
- **Labels:** Use uppercase Inter with slight letter spacing for categories and status badges to create a distinct visual separation from body text.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to maintain a controlled, curated presentation, transitioning to a fluid model on mobile devices.

- **Desktop (1024px+):** 12-column grid with 24px gutters. Center the main content container at a maximum width of 1280px.
- **Tablet (768px - 1023px):** 8-column grid with 24px margins.
- **Mobile (<768px):** 4-column grid with 16px margins.

Spacing between sections should be generous (80px+ on desktop) to enforce the minimalist aesthetic and prevent visual clutter.

## Elevation & Depth

To maintain a clean and airy feel, this design system avoids heavy shadows. Depth is communicated through:

- **Tonal Layers:** Using the neutral tertiary color (`#E8E2D6`) for secondary containers or hover states.
- **Ambient Shadows:** Only use extremely soft, diffused shadows for floating elements like cards or modals. Use a `15%` opacity charcoal tint with a high blur radius (`20px - 40px`) and `0` offset to create an "uplifted" effect rather than a harsh drop shadow.
- **Minimal Borders:** Borders should be restricted to functional elements like inputs or active states, using a very light tint of the secondary color (e.g., `#1A1A1A` at 10% opacity).

## Shapes

The shape language is **Soft** and restrained. Sharp 90-degree corners are avoided to feel more welcoming, but large radii are also avoided to maintain professional elegance.

- **Cards & Images:** Use `0.5rem` (8px) for artwork containers.
- **Buttons & Inputs:** Use `0.25rem` (4px) to keep them feeling crisp and precise.
- **Badges:** Use a full pill shape for status indicators (e.g., "Live Auction") to differentiate them from structural UI elements.

## Components

### Artwork & Auction Cards

Artwork is the focal point. Cards should have no border; use a very subtle ambient shadow on hover. Metadata (Title/Artist) is aligned left using `body-md` and `label-sm`. Auction status indicators should use the primary terracotta color for "Live" status, featuring a small pulsing dot icon.

### Navigation

- **Desktop:** A minimalist top-fixed bar with clear, text-based links. Use `label-sm` for nav items.
- **Mobile:** A fixed bottom navigation bar with simple outline icons for primary actions (Home, Search, Auctions, Profile).

### Buttons

- **Primary:** Solid Charcoal (`#1A1A1A`) with Muslin (`#F9F7F2`) text.
- **Secondary:** Outline Charcoal with 1px weight.
- **Ghost:** No background, Terracotta text for "Buy" or "Bid" actions to draw the eye.

### Inputs

Minimalist underlines or very soft-bordered boxes. Focus states should transition the border color to the primary terracotta or a slightly darker neutral.

### Dashboard Metrics

Clean, flat cards using the Muslin background with a subtle 1px border of `#E8E2D6`. Use `display-lg` typography for key figures to emphasize performance data.
