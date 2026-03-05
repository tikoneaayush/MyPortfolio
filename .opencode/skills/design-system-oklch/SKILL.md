---
name: design-system-oklch
description: >-
  OKLCH color system, Tailwind token mapping, and anti-generic-AI design rules
  for Caffeine frontends. Use when setting up design tokens, choosing a visual
  direction, customizing index.css or tailwind.config.js, or when the generated
  UI looks generic.
compatibility: opencode
---

# Caffeine Design System

## When to Apply

- Setting up design tokens and visual direction for a new frontend
- Customizing `index.css` or `tailwind.config.js`
- Implementing or adjusting light/dark mode
- Improving a UI that looks generic

## Step 1 — Choose a Visual Direction

Before writing any code, decide on:

- **Color palette**: primary, secondary, accent, neutral, success, warning, destructive (3–5 colors max)
- **Typography**: font families, scale, weights, tracking
- **Shape language**: radii, spacing density, shadows, motion

## Step 2 — Avoid Generic AI Aesthetics

| Don't                             | Do                                                          |
| --------------------------------- | ----------------------------------------------------------- |
| Purple gradients for everything   | Match colors to the app's purpose                           |
| Safe blue `#3B82F6` for every CTA | Vary button colors by action/hierarchy                      |
| System/Inter fonts only           | Add at least one distinctive font in `tailwind.config.js`   |
| Uniform `rounded-lg` everywhere   | Vary border-radius intentionally (0, 4px, 12px, 24px, full) |
| Same spacing everywhere           | Vary density for rhythm and visual hierarchy                |
| Rainbow palettes                  | 3–5 colors maximum                                          |

## Step 3 — Encode Tokens

Edit these files **as often as needed** to avoid boring designs:

- **`src/frontend/src/index.css`** — CSS custom properties using raw L C H values, for both light and dark modes
- **`src/frontend/tailwind.config.js`** — map tokens in `theme.extend` (colors, fontFamily, borderRadius, boxShadow)

## Step 4 — OKLCH Rules

- Express every color token as raw `L C H` values (no `oklch()` wrapper).
- Maintain **AA+ contrast** in both light and dark; tune L (lightness) and C (chroma) — do not rely on opacity.
- Keep semantic names (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`, `chart-*`, `sidebar-*`) while adjusting OKLCH values to the chosen palette.
- **Exception**: Canvas/WebGL drawing APIs may use literal color values since they cannot resolve CSS variables.

## Step 5 — Token-Only Styling

After setting up design tokens:

- **Never** use raw color literals (`#fff`, `rgb(...)`) in components.
- **Never** use arbitrary Tailwind color classes (`bg-[#123]`) or inline color styles.
- Use semantic tokens and Tailwind theme keys exclusively: `bg-primary`, `text-foreground`, `border-border`.

## Pre-Bundled Fonts

The template self-hosts 16 variable fonts as `.woff2` files in `public/assets/fonts/`. Choose only from these fonts. Do not use Google Fonts, external CDNs, or any font not listed below — deployed apps cannot reach external servers, so external fonts will silently fail.

For each font you use: add its `@font-face` declaration in `index.css` (with `font-display: swap` and the correct `/assets/fonts/` path), then register it in `tailwind.config.js` `fontFamily`. Do not reference fonts only in Tailwind — the `@font-face` in `index.css` is required or the font silently falls back.

Display: Fraunces, Mona Sans, Bricolage Grotesque, Cabinet Grotesk, Playfair Display, Instrument Serif. Body: General Sans, Figtree, Outfit, Sora, Plus Jakarta Sans, Crimson Pro, Satoshi. Mono: Geist Mono, JetBrains Mono, Geist.

## Responsive & Dark Mode

- Design mobile-first (`sm:`, `md:`, `lg:` breakpoints).
- Choose light or dark mode based on the design direction. Only implement both if it serves the aesthetic or the user requests it.
- If using dark mode, design it intentionally — not just inverted lightness. Tune backgrounds, text, borders, and interactive elements for readability and visual hierarchy.
