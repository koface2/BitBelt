// BitBelt — "Grim-Cute" Color Palette
// Deep purples, neon pinks, and slate grays.

export const Colors = {
  // --- Deep Purples ---
  purple: {
    darkest: "#1A0A2E",  // near-black purple — primary background
    dark:    "#2D1B4E",  // card / surface background
    mid:     "#4B2D7F",  // interactive elements, borders
    accent:  "#7B3FBE",  // highlights, active states
  },

  // --- Neon Pinks ---
  pink: {
    neon:   "#FF2D78",   // primary CTA, belt rank badge glow
    bright: "#FF6EB4",   // secondary accents, icon tints
    soft:   "#FFB3D1",   // subtle highlights, disabled state text
  },

  // --- Slate Grays ---
  slate: {
    darkest: "#1C1C2E",  // alternate dark surface
    dark:    "#2E2E42",  // dividers, input backgrounds
    mid:     "#5A5A7A",  // placeholder text, secondary labels
    light:   "#A0A0C0",  // body text on dark backgrounds
    lightest:"#E8E8F0",  // headings, high-contrast text
  },

  // --- Semantic aliases ---
  background: "#1A0A2E",
  surface:    "#2D1B4E",
  primary:    "#FF2D78",
  secondary:  "#7B3FBE",
  textPrimary:"#E8E8F0",
  textMuted:  "#A0A0C0",
  border:     "#4B2D7F",
} as const;

export type ColorToken = typeof Colors;
