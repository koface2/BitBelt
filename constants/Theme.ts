/**
 * BitBelt — Design System Tokens (Expo app copy)
 * Keep in sync with /constants/Theme.ts at the repo root.
 *
 * Inlined here because Metro cannot resolve paths that escape the
 * project root (/workspaces/BitBelt/BitBelt/).
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const ThemeColors = {
  white:        "#FFFFFF",
  background:   "#FFFFFF",
  surface:      "#F5F7FF",
  surfaceAlt:   "#EEF1FF",
  primary:      "#0055FF",
  primaryLight: "#4488FF",
  primaryDark:  "#003DBF",
  primaryMuted: "#E5EEFF",
  gray900: "#0D0D0D",
  gray700: "#374151",
  gray500: "#6B7280",
  gray300: "#D1D5DB",
  gray100: "#F3F4F6",
  success:      "#16A34A",
  successLight: "#DCFCE7",
  error:        "#DC2626",
  errorLight:   "#FEE2E2",
  warning:      "#D97706",
  warningLight: "#FEF3C7",
  belt: {
    white:  "#FFFFFF",
    blue:   "#1E5BB5",
    purple: "#7B3FBE",
    brown:  "#8B4513",
    black:  "#1A1A1A",
    coral:  "#FF6B35",
    red:    "#DC2626",
  },
  onPrimary:  "#FFFFFF",
  onSurface:  "#0D0D0D",
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
// Spacing (4-pt base grid)
// ---------------------------------------------------------------------------
export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
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
    xs:    11,
    sm:    13,
    base:  16,
    md:    18,
    lg:    22,
    xl:    28,
    "2xl": 36,
  },
  weight: {
    regular:   "400" as const,
    medium:    "500" as const,
    semibold:  "600" as const,
    bold:      "700" as const,
    extrabold: "800" as const,
  },
  lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------
export const Radius = {
  sm:    4,
  md:    8,
  lg:    12,
  xl:    16,
  "2xl": 20,
  full:  9999,
} as const;

// ---------------------------------------------------------------------------
// Shadows
// boxShadow is used by React Native Web (new arch); shadow* props remain for
// older native renderers / Expo Go on device.
// ---------------------------------------------------------------------------
export const Shadow = {
  sm:      { shadowColor: "#000000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,  elevation: 2, boxShadow: "0px 1px 2px rgba(0,0,0,0.06)" },
  md:      { shadowColor: "#000000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8,  elevation: 4, boxShadow: "0px 4px 8px rgba(0,0,0,0.10)" },
  lg:      { shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 8, boxShadow: "0px 8px 16px rgba(0,0,0,0.14)" },
  primary: { shadowColor: "#0055FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 12, elevation: 6, boxShadow: "0px 4px 12px rgba(0,85,255,0.30)" },
} as const;

// ---------------------------------------------------------------------------
// Touch Targets
// ---------------------------------------------------------------------------
export const TouchTarget = {
  minSize:    44,
  minHitSlop: { top: 8, right: 8, bottom: 8, left: 8 },
} as const;

// ---------------------------------------------------------------------------
// Convenience export
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
