/**
 * LineageTree — Full visual belt-progression tree for the student profile page.
 *
 * Receives token IDs in chronological order (oldest → newest) and renders
 * a vertical spine of LineageNode components, with the current belt at the
 * bottom highlighted with a glow.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Theme } from "@/constants/Theme";
import LineageNode from "@/components/LineageNode";

const { colors, spacing, typography, radius, shadow } = Theme;

interface Props {
  /** Token IDs in chronological order — oldest first, newest/current last. */
  tokenIds: readonly bigint[];
}

export default function LineageTree({ tokenIds }: Props) {
  if (tokenIds.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>BELT LINEAGE</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {tokenIds.length} PROMOTION{tokenIds.length !== 1 ? "S" : ""}
          </Text>
        </View>
      </View>

      {/* ── Tree ── */}
      <View style={styles.tree}>
        {tokenIds.map((id, i) => (
          <LineageNode
            key={String(id)}
            tokenId={id}
            isLatest={i === tokenIds.length - 1}
            isLast={i === tokenIds.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius:    radius.xl,
    padding:         spacing.xl,
    borderWidth:     1,
    borderColor:     colors.gray300,
    ...shadow.sm,
  },

  header: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    marginBottom:    spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  accentBar: {
    width:           3,
    height:          16,
    borderRadius:    2,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.extrabold,
    color:         colors.primary,
    letterSpacing: 2,
  },
  countBadge: {
    backgroundColor:   colors.primaryMuted,
    borderRadius:      radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
  },
  countText: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.bold,
    color:         colors.primary,
    letterSpacing: 0.5,
  },

  tree: {
    // LineageNode handles its own bottom margin and spine rendering
  },
});
