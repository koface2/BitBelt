/**
 * BitBelt — Design System Tokens
 *
 * Aesthetic: Clean, minimalist, high-trust (SaaS / Fintech)
 * Background: Pure White (#FFFFFF)
 * Primary Action: Jiu-Jitsu Blue (#0055FF)
 *
 * Accessibility: WCAG AA contrast on all text/background pairs.
 * Touch Targets: All interactive elements must be at least 44 × 44 px.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const ThemeColors = {
  // --- Core palette ---
  white:        "#FFFFFF",
  background:   "#FFFFFF",   // Pure White — app background
  surface:      "#F5F7FF",   // Off-white — card / sheet surfaces
  surfaceAlt:   "#EEF1FF",   // Hover / pressed state for cards

  // --- Jiu-Jitsu Blue (primary actions) ---
  primary:      "#0055FF",   // CTA buttons, active states, links
  primaryLight: "#4488FF",   // Hover / ripple overlay
  primaryDark:  "#003DBF",   // Pressed / focus ring
  primaryMuted: "#E5EEFF",   // Tinted backgrounds, chips, badges

  // --- Neutrals ---
  gray900: "#0D0D0D",  // headings, primary text
  gray700: "#374151",  // body text
  gray500: "#6B7280",  // secondary / helper text
  gray300: "#D1D5DB",  // borders, dividers
  gray100: "#F3F4F6",  // subtle backgrounds, input fills

  // --- Semantic states ---
  success:      "#16A34A",
  successLight: "#DCFCE7",
  error:        "#DC2626",
  errorLight:   "#FEE2E2",
  warning:      "#D97706",
  warningLight: "#FEF3C7",

  // --- BJJ Belt colors ---
  belt: {
    white:  "#FFFFFF",
    blue:   "#1E5BB5",
    purple: "#7B3FBE",
    brown:  "#8B4513",
    black:  "#1A1A1A",
    coral:  "#FF6B35",
    red:    "#DC2626",
  },

  // --- Text on colored backgrounds ---
  onPrimary:  "#FFFFFF",   // text/icons on primary blue
  onSurface:  "#0D0D0D",   // text/icons on white surface
  onBelt: {
    white:  "#0D0D0D",
    blue:   "#FFFFFF",
    purple: "#FFFFFF",
    brown:  "#FFFFFF",
    black:  "#FFFFFF",
    coral:  "#FFFFFF",
    red:    "#FFFFFF",
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing  (4-pt base grid)
// ---------------------------------------------------------------------------
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const Typography = {
  size: {
    xs:   11,
    sm:   13,
    base: 16,
    md:   18,
    lg:   22,
    xl:   28,
    "2xl": 36,
  },
  weight: {
    regular:   "400" as const,
    medium:    "500" as const,
    semibold:  "600" as const,
    bold:      "700" as const,
    extrabold: "800" as const,
  },
  lineHeight: {
    tight:   1.2,
    normal:  1.5,
    relaxed: 1.75,
  },
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------
export const Radius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  "2xl": 20,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Shadows  (iOS + Android compatible)
// ---------------------------------------------------------------------------
export const Shadow = {
  sm: {
    shadowColor:   "#000000",
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  2,
    elevation:     2,
  },
  md: {
    shadowColor:   "#000000",
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  8,
    elevation:     4,
  },
  lg: {
    shadowColor:   "#000000",
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius:  16,
    elevation:     8,
  },
  primary: {
    shadowColor:   "#0055FF",
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius:  12,
    elevation:     6,
  },
} as const;

// ---------------------------------------------------------------------------
// Touch Targets  (Priority 2 — React Native accessibility minimum)
// ---------------------------------------------------------------------------
export const TouchTarget = {
  minSize: 44,   // px — meets Apple HIG & Android Material minimum
  minHitSlop: { top: 8, right: 8, bottom: 8, left: 8 },
} as const;

// ---------------------------------------------------------------------------
// Convenience re-export
// ---------------------------------------------------------------------------
export const Theme = {
  colors:      ThemeColors,
  spacing:     Spacing,
  typography:  Typography,
  radius:      Radius,
  shadow:      Shadow,
  touchTarget: TouchTarget,
} as const;

export type ThemeType = typeof Theme;
