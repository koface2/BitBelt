/**
 * constants/belts.ts — Shared belt rank definitions.
 *
 * Single source of truth for belt colours, labels, and UI colours.
 * Imported by any screen that renders a belt picker.
 */

import { Theme } from "./Theme";

const { colors } = Theme;

export type BeltColor = "White" | "Blue" | "Purple" | "Brown" | "Black";

export interface BeltOption {
  label: BeltColor;
  bg: string;
  fg: string;
  border: string;
}

export const BELTS: BeltOption[] = [
  { label: "White",  bg: colors.belt.white,  fg: colors.onBelt.white,  border: colors.gray300 },
  { label: "Blue",   bg: colors.belt.blue,   fg: colors.onBelt.blue,   border: colors.belt.blue },
  { label: "Purple", bg: colors.belt.purple, fg: colors.onBelt.purple, border: colors.belt.purple },
  { label: "Brown",  bg: colors.belt.brown,  fg: colors.onBelt.brown,  border: colors.belt.brown },
  { label: "Black",  bg: colors.belt.black,  fg: colors.onBelt.black,  border: colors.belt.black },
];
