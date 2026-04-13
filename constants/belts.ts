export const BELT_COLORS = {
  white: {
    label: "White",
    bg: "bg-white",
    border: "border-gray-200",
    text: "text-gray-900",
    hex: "#FFFFFF",
    order: 0,
  },
  blue: {
    label: "Blue",
    bg: "bg-blue-700",
    border: "border-blue-500",
    text: "text-white",
    hex: "#1D4ED8",
    order: 1,
  },
  purple: {
    label: "Purple",
    bg: "bg-purple-700",
    border: "border-purple-500",
    text: "text-white",
    hex: "#7C3AED",
    order: 2,
  },
  brown: {
    label: "Brown",
    bg: "bg-amber-800",
    border: "border-amber-600",
    text: "text-white",
    hex: "#92400E",
    order: 3,
  },
  black: {
    label: "Black",
    bg: "bg-gray-900",
    border: "border-gray-600",
    text: "text-white",
    hex: "#1F2937",
    order: 4,
  },
} as const;

export type BeltColor = keyof typeof BELT_COLORS;

export const BELT_DEGREES = [0, 1, 2, 3, 4] as const;
export type BeltDegree = (typeof BELT_DEGREES)[number];

export interface BeltRank {
  color: BeltColor;
  degree: BeltDegree;
  promotedAt: number; // Unix timestamp
  tokenId?: string;
  instructor: string;
  gym?: string;
}
