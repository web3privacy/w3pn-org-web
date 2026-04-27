# W3PN Org Web Design Tokens

This document describes the W3PN visual tokens that can be reused across the standalone org web and the portal.

## Where they live

- canonical workspace copy: `W3PN-DESIGN-SYSTEM/design-tokens.css`
- portal runtime mirror: `PRIVACY-PORTAL/packages/portal-ui/design-tokens.css`
- org web runtime mirror: `W3PN-ORG-WEB/src/styles/portal-ui/design-tokens.css`

At the moment the mirror copies still need to stay in sync manually.

## Structure

Tokens are split into two layers:

1. `--w3pn-*` = canonical brand tokens
2. legacy aliases such as `--accent`, `--content-max`, `--radius-lg` = compatibility for existing CSS and Tailwind mappings

That means:

- new shared UI should use `--w3pn-*`
- existing apps can keep working through the alias layer without an immediate refactor

## Main token groups

### Typography

- `--w3pn-font-sans`
- `--w3pn-font-serif`

Brand character:

- sans = `Archivo`
- serif = `Domine`

### Layout

- `--w3pn-layout-content-max`
- `--w3pn-space-*`

Use them for:

- page shells
- section spacing
- card paddings
- footer/header rhythm

### Color

Dark-first brand layer:

- `--w3pn-color-canvas`
- `--w3pn-color-surface`
- `--w3pn-color-surface-2`
- `--w3pn-color-text`
- `--w3pn-color-text-muted`
- `--w3pn-color-border`
- `--w3pn-color-accent`
- `--w3pn-color-accent-foreground`

Light companion layer:

- `--w3pn-color-light-canvas`
- `--w3pn-color-light-surface`
- `--w3pn-color-light-text`
- `--w3pn-color-light-text-muted`
- `--w3pn-color-light-border`

### Shape

- `--w3pn-radius-sm`
- `--w3pn-radius-md`
- `--w3pn-radius-lg`
- `--w3pn-radius-xl`
- `--w3pn-radius-full`

### Effects

- `--w3pn-shadow-card`
- `--w3pn-shadow-elevated`
- `--w3pn-overlay-soft`
- `--w3pn-overlay-strong`

### Motion

- `--w3pn-motion-fast`
- `--w3pn-motion-base`
- `--w3pn-motion-slow`
- `--w3pn-ease-standard`

## Portal guidance

If you want portal work to stay aligned with the org web style:

1. import `@web3privacy/portal-ui/design-tokens.css`
2. map app-level variables (`--background`, `--foreground`, `--card`, `--border`) to `--w3pn-*`
3. build new components on top of canonical token names
4. avoid adding new hardcoded brand colors such as `#70ff88`, `#0f1318`, `#181d25`

## Minimal import

```css
@import "@web3privacy/portal-ui/design-tokens.css";
```

## Theme mapping

Typical pattern:

```css
:root {
  --background: var(--w3pn-color-light-canvas);
  --foreground: var(--w3pn-color-light-text);
  --accent: var(--w3pn-color-accent);
}

.dark {
  --background: var(--w3pn-color-canvas);
  --foreground: var(--w3pn-color-text);
  --accent: var(--w3pn-color-accent);
}
```

## Goal

The goal is not just to share one green accent. The goal is to carry over:

- dark-first editorial mood
- contrasting serif/sans pairing
- soft radii
- subtle border/surface separation
- consistent CTA and card rhythm
