/**
 * MiniLineageChain — Compact horizontal belt-progression strip for the
 * StudentHoverCard popup.
 *
 * Each MiniDot is its own component so useReadContract is called from a
 * mounted component (not in a loop), respecting the rules of hooks.
 *
 * Visual:  ●──●──◆   (current belt is larger + glowing)
 */

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useReadContract } from "thirdweb/react";
import { Theme } from "@/constants/Theme";
import { sbtContract } from "@/constants/BitBelt";

const { colors, spacing, typography, radius } = Theme;

const DOT   = 12;      // default dot diameter
const DOT_L = 16;      // current-belt dot diameter

// Matching BeltVisual.tsx body colours
const BELT_COLOR: Record<string, string> = {
  White:  "#E4E4E7",
  Blue:   "#1D4ED8",
  Purple: "#7C3AED",
  Brown:  "#92400E",
  Black:  "#111827",
};

const BELT_GLOW: Record<string, string> = {
  White:  "rgba(228,228,231,0.7)",
  Blue:   "rgba(29,78,216,0.7)",
  Purple: "rgba(124,58,237,0.7)",
  Brown:  "rgba(146,64,14,0.7)",
  Black:  "rgba(17,24,39,0.7)",
};

// ── Per-token sub-component ───────────────────────────────────────────────────

interface MiniDotProps {
  tokenId:  bigint;
  isLatest: boolean;
  isLast:   boolean;
}

function MiniDot({ tokenId, isLatest, isLast }: MiniDotProps) {
  const { data: info, isLoading } = useReadContract({
    contract: sbtContract,
    method:   "function getRankInfo(uint256 tokenId) view returns ((uint256 promotionDate, string beltColor, address instructorAddress))",
    params:   [tokenId],
  });

  const beltColor = info ? String((info as any).beltColor) : "White";
  const dotColor  = isLoading ? colors.gray300 : (BELT_COLOR[beltColor] ?? "#E4E4E7");
  const glow      = BELT_GLOW[beltColor] ?? "rgba(0,0,0,0)";
  const size      = isLatest ? DOT_L : DOT;

  return (
    <View style={styles.dotWrapper}>
      <View
        style={[
          styles.dot,
          {
            width:        size,
            height:       size,
            borderRadius: size / 2,
            backgroundColor: dotColor,
          },
          isLatest && {
            shadowColor:   glow,
            shadowOpacity: 1,
            shadowRadius:  8,
            elevation:     6,
            borderWidth:   2,
            borderColor:   "rgba(255,255,255,0.5)",
          },
        ]}
      >
        {isLoading && (
          <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.5 }] }} />
        )}
        {isLatest && !isLoading && (
          <View style={styles.dotCoreDot} />
        )}
      </View>

      {/* Connector line to the next dot */}
      {!isLast && <View style={styles.connector} />}
    </View>
  );
}

// ── Legend sub-component ──────────────────────────────────────────────────────

interface LegendDotProps {
  tokenId:  bigint;
  isLatest: boolean;
}

function LegendDot({ tokenId, isLatest }: LegendDotProps) {
  const { data: info } = useReadContract({
    contract: sbtContract,
    method:   "function getRankInfo(uint256 tokenId) view returns ((uint256 promotionDate, string beltColor, address instructorAddress))",
    params:   [tokenId],
  });

  const beltColor = info ? String((info as any).beltColor) : "?";

  return (
    <Text style={[styles.legendLabel, isLatest && styles.legendLabelLatest]}>
      {beltColor[0] ?? "?"}
    </Text>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  /** Token IDs in chronological order — oldest first, current last. */
  tokenIds: readonly bigint[];
}

export default function MiniLineageChain({ tokenIds }: Props) {
  if (tokenIds.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>PROGRESSION</Text>

      {/* Dot chain */}
      <View style={styles.chain}>
        {tokenIds.map((id, i) => (
          <MiniDot
            key={String(id)}
            tokenId={id}
            isLatest={i === tokenIds.length - 1}
            isLast={i === tokenIds.length - 1}
          />
        ))}
      </View>

      {/* Belt initial labels below dots */}
      <View style={styles.legend}>
        {tokenIds.map((id, i) => (
          <LegendDot
            key={String(id)}
            tokenId={id}
            isLatest={i === tokenIds.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },

  sectionLabel: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.extrabold,
    color:         colors.primary,
    letterSpacing: 1.5,
  },

  chain: {
    flexDirection: "row",
    alignItems:    "center",
  },

  dotWrapper: {
    flexDirection: "row",
    alignItems:    "center",
  },

  dot: {
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     1,
    borderColor:     "rgba(255,255,255,0.25)",
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.15,
    shadowRadius:    2,
    elevation:       2,
  },

  dotCoreDot: {
    width:           5,
    height:          5,
    borderRadius:    3,
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  connector: {
    width:           10,
    height:          1.5,
    backgroundColor: colors.gray300,
    marginHorizontal: 1,
  },

  // Legend row (belt initials below each dot)
  legend: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           0,
  },

  legendLabel: {
    width:         DOT,
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.bold,
    color:         colors.gray500,
    textAlign:     "center",
    marginRight:   12,   // mirrors connector + dot spacing
  },

  legendLabelLatest: {
    color:         colors.primary,
    fontWeight:    typography.weight.extrabold,
    marginRight:   0,
    width:         DOT_L,
  },
});
