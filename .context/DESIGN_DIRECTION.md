# Design System: Nokshi

A specialized design system for **Nokshi**, an image-focused, modern digital art platform, professional marketplace, and virtual exhibition space celebrating Bangladeshi arts, textiles, and craft heritage.

---

## 1. Brand Philosophy & Visual Identity

- **Art-First Minimalism**: The artwork must always be the visual hero. UI elements recede cleanly into the background through warm neutral surfaces, deliberate whitespace, and minimal chrome.
- **Cultural Heritage in Modern Form**: Subtle warmth inspired by Bangladeshi crafts—earthen pottery, terracotta temples, handloom Jamdani, and natural river pigments—blended with contemporary editorial gallery elegance.
- **Restraint & Craftsmanship**: Sharp typography, whisper-soft shadows, generous margins, and no gratuitous gradients or distracting micro-animations.

---

## 2. Color Palette & Token System

### Surface & Canvas

| Token                   | Hex       | Usage                                                    |
| ----------------------- | --------- | -------------------------------------------------------- |
| `surface`               | `#FBF9F4` | Primary global canvas / page background (warm off-white) |
| `surface-dim`           | `#DBD7CD` | Subtle borders, dividers, subtle neutral backgrounds     |
| `surface-bright`        | `#FFFFFF` | Card surfaces, modal sheets, elevated panels             |
| `surface-container-low` | `#F5F2EB` | Subtle alternating section backgrounds, builder toolbars |
| `surface-container`     | `#EFECE3` | Filter chips, search bars, inputs default state          |

### Primary & Accent Colors

| Token               | Hex       | Usage                                                                |
| ------------------- | --------- | -------------------------------------------------------------------- |
| `primary`           | `#A45C40` | Muted terracotta heritage accent; active states, primary CTA accents |
| `primary-hover`     | `#8A4A32` | Darker terracotta hover state                                        |
| `primary-container` | `#F8EBE6` | Soft blush terracotta tint for badges, tags, and highlights          |
| `on-primary`        | `#FFFFFF` | Text on terracotta surfaces                                          |

### Typography & Neutrals

| Token                | Hex       | Usage                                                   |
| -------------------- | --------- | ------------------------------------------------------- |
| `on-surface`         | `#1A1918` | Deep charcoal primary typography and icons              |
| `on-surface-variant` | `#66625D` | Secondary labels, metadata (dimensions, weight, medium) |
| `outline`            | `#E5E0D8` | Structural dividing lines, card borders, minimal frames |

### Status & Functional

| Token          | Hex       | Usage                                                     |
| -------------- | --------- | --------------------------------------------------------- |
| `status-live`  | `#B93826` | Live auction badge, urgent countdown timer                |
| `status-valid` | `#4E7A58` | Verified artist mark, ticket valid badge, in-stock status |
| `status-match` | `#A45C40` | AI visual similarity indicator (e.g., "80% Similarity")   |

---

## 3. Typography Hierarchy

### Font Families

- **Display & Headings**: `Playfair Display`, serif (Editorial, elegant, classic art gallery demeanor).
- **Body & Technical UI**: `Inter` or system sans-serif (Neutral, highly legible for metadata, commerce pricing, and admin workflows).

### Type Scale

- **Display Hero (`font-display-lg`)**: `48px – 64px`, serif, weight `600`, line-height `1.1`. Used for featured exhibition banners and major editorial headlines.
- **Headline H1 (`font-headline-lg`)**: `36px – 40px`, serif, weight `600`, line-height `1.2`. Used for Collection and Profile Titles (`Spring Collection`, `Jamini Roy`).
- **Headline H2 (`font-headline-md`)**: `24px – 28px`, serif, weight `500`. Used for Artwork Titles (`Eternal Bloom`, `Vessel of Silence No. 4`).
- **Subhead / Artist Byline**: `18px – 20px`, serif or sans-serif, italic or medium.
- **Section Label (`font-label-sm`)**: `11px – 13px`, sans-serif, weight `600`, uppercase, tracking `0.1em` (`FEATURED EXHIBITION`, `CURRENT BID`, `MEDIUM`).
- **Price Display**: `20px – 28px`, sans-serif, weight `600`, formatted with Bengali Taka (`৳`) or standard currency format.
- **Body Copy (`font-body-md`)**: `15px – 16px`, sans-serif, weight `400`, line-height `1.6`, color `text-on-surface-variant`.

---

## 4. Layout, Grids & Spatial System

### Container & Margins

- **Max Container Width**: `1440px` centered with responsive gutter padding (`px-6 md:px-12 lg:px-16`).
- **Standard Vertical Rhythm**: `py-12 lg:py-20` between major thematic zones.

### Grid Formats

- **Marketplace Grid**: 3-column desktop (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), `gap-8 lg:gap-12`.
- **Large-Scale Collection Grid**: 2-column or 3-column oversized art focus (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), with generous vertical aspect ratios (`aspect-[3/4]` or natural height) allowing each piece ample room to breathe.
- **Split-Screen Layouts**:
  - **Artwork Details**: 55% primary imagery canvas on left, 45% sticky metadata and purchasing drawer on right.
  - **Duplicate Detection Moderation**: 50/50 split comparison view with floating similarity badge pinned at center.
  - **Virtual Exhibition Builder**: Left asset palette (or floating), central digital wall plane, right placement toolbar.

---

## 5. Key UI Components & Design Patterns

### 1. Global Navigation Chrome

- **Desktop**: Clean top bar with wordmark `Art & Crafts BD` (Playfair Display), clear category links (`Home`, `Marketplace`, `Explore`, `Auctions`, `Exhibitions`), right-aligned minimal search input, notification icon, user avatar, and primary action `Create Artwork`.
- **Separation**: Zero drop shadows; subtle bottom hairline (`border-b border-outline`).

### 2. Artwork Cards

- **Structure**:
  1. Artwork image container with smooth neutral background fallback (`bg-[#F5F2EB]`).
  2. Minimalist matted or frameless presentation.
  3. Clean text footer: Title in Playfair Display serif, Artist Name in subtle sans-serif caps, Price clearly aligned right in bold sans-serif.
  4. Subtle hover transition (`hover:scale-[1.01] transition-transform duration-300`).

### 3. Action Buttons & Controls

- **Primary CTA**: Dark charcoal background (`bg-[#1A1918] text-white hover:bg-black`) or terracotta accent (`bg-[#A45C40] hover:bg-[#8A4A32]`), `rounded-md` or `rounded-full`, generous horizontal padding (`px-8 py-3.5`).
- **Secondary / Wishlist CTA**: Outline border (`border border-[#1A1918] text-[#1A1918] bg-transparent hover:bg-[#1A1918]/5`).
- **Floating Toolbars (Builders & Canvas)**: Rounded pill container (`rounded-2xl shadow-xl bg-white/95 backdrop-blur border border-outline px-6 py-3`).

### 4. Badges & Tags

- **Live Auction Indicator**: Terracotta/crimson dot badge with pulsing state or countdown counter (`LIVE AUCTION`).
- **Access / Ticket Token**: Large monospaced/serif alphanumeric display (`AC-BD-2024-X9Z`) with QR code pairing and "Valid" state chip.
- **AI Similarity Score**: Centered pill tag (`87% SIMILARITY`) floating between comparative artworks with high contrast.

---

## 6. Interaction & Accessibility Standards

- **Touch & Click Targets**: Minimum target size of `44px x 44px` for interactive controls.
- **Contrast Compliance**: Dark charcoal (`#1A1918`) on warm off-white (`#FBF9F4`) exceeds WCAG AAA standards for legibility.
- **Responsive Adaptability**: Seamless transition from desktop multi-column gallery to fluid single/double column mobile view with native bottom navigation.
