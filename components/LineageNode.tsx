/**
 * LineageNode — a single node in the belt lineage tree.
 *
 * Fetches its own getRankInfo so hook rules are never violated
 * (each mounted instance has one stable hook call).
 *
 * Used exclusively by LineageTree.tsx.
 */

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useReadContract } from "thirdweb/react";
import { Theme } from "@/constants/Theme";
import { sbtContract } from "@/constants/BitBelt";
import type { Student } from "@/hooks/useStudents";

const { colors, spacing, typography, radius } = Theme;

const ORB_SIZE  = 38;
const SPINE_W   = 2;

// Belt body + text colours — mirrors BeltVisual.tsx SPECS
const BELT_SPEC: Record<string, { body: string; glow: string; text: string }> = {
  White:  { body: "#E4E4E7", glow: "rgba(228,228,231,0.5)", text: "#374151" },
  Blue:   { body: "#1D4ED8", glow: "rgba(29,78,216,0.55)",  text: "#EFF6FF" },
  Purple: { body: "#7C3AED", glow: "rgba(124,58,237,0.55)", text: "#F5F3FF" },
  Brown:  { body: "#92400E", glow: "rgba(146,64,14,0.55)",  text: "#FEF3C7" },
  Black:  { body: "#111827", glow: "rgba(17,24,39,0.55)",   text: "#F9FAFB" },
};

function formatDate(ts: bigint): string {
  const ms = Number(ts) * 1000;
  if (!ms || isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export interface LineageNodeProps {
  tokenId:  bigint;
  /** True for the most-recent (current) belt. */
  isLatest: boolean;
  /** True for the last node rendered — suppresses the spine below. */
  isLast:   boolean;
  /** Full student registry — used to resolve instructor addresses to names. */
  students?: Student[];
}

export default function LineageNode({ tokenId, isLatest, isLast, students = [] }: LineageNodeProps) {
  const { data: info, isLoading } = useReadContract({
    contract: sbtContract,
    method:   "function getRankInfo(uint256 tokenId) view returns ((uint256 promotionDate, string beltColor, address instructorAddress))",
    params:   [tokenId],
  });

  const beltColor  = info ? String((info as any).beltColor)        : "White";
  const date       = info ? formatDate((info as any).promotionDate) : "";
  const instructor = info ? String((info as any).instructorAddress) : "";
  const spec       = BELT_SPEC[beltColor] ?? BELT_SPEC.White;

  // Resolve instructor wallet → name from local student registry
  const instructorName = instructor
    ? (students.find((s) => s.address.toLowerCase() === instructor.toLowerCase())?.name ?? null)
    : null;
  const instructorLabel = instructorName
    ? instructorName
    : instructor
    ? `${instructor.slice(0, 6)}…${instructor.slice(-4)}`
    : "";

  return (
    <View style={styles.root}>
      {/* ── Left column: orb + spine ── */}
      <View style={styles.leftCol}>
        {/* Orb */}
        <View
          style={[
            styles.orb,
            { backgroundColor: spec.body },
            isLatest && {
              shadowColor:   spec.glow,
              shadowOpacity: 1,
              shadowRadius:  14,
              elevation:     10,
              borderColor:   "rgba(255,255,255,0.5)",
              transform:     [{ scale: 1.12 }],
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={spec.text} />
          ) : (
            <View style={[styles.orbRing, { borderColor: spec.text + "55" }]} />
          )}
        </View>

        {/* Spine segment to the next node */}
        {!isLast && (
          <View
            style={[
              styles.spine,
              isLatest && { backgroundColor: colors.primary + "55" },
            ]}
          />
        )}
      </View>

      {/* ── Right column: info card ── */}
      <View
        style={[
          styles.card,
          isLatest && styles.cardLatest,
        ]}
      >
        {isLatest && (
          <View style={styles.currentPill}>
            <Text style={styles.currentPillText}>CURRENT RANK</Text>
          </View>
        )}

        {/* Belt name row */}
        <View style={styles.beltRow}>
          <View style={[styles.beltDot, { backgroundColor: spec.body }]} />
          <Text style={[styles.beltName, isLatest && { color: colors.primary }]}>
            {isLoading ? "Loading…" : `${beltColor} Belt`}
          </Text>
        </View>

        {/* Meta: date */}
        {!isLoading && !!date && (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{date}</Text>
          </View>
        )}

        {/* Promoted by */}
        {!isLoading && !!instructorLabel && (
          <View style={styles.promoterRow}>
            <Text style={styles.promoterLabel}>Promoted by</Text>
            <Text
              style={[
                styles.promoterName,
                !instructorName && styles.promoterAddr,
              ]}
              numberOfLines={1}
            >
              {instructorLabel}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems:    "flex-start",
  },

  // ── Left: orb + spine ──
  leftCol: {
    alignItems:   "center",
    marginRight:  spacing.base,
    // width is fixed so the spine always aligns with orb centres
    width:        ORB_SIZE,
  },
  orb: {
    width:           ORB_SIZE,
    height:          ORB_SIZE,
    borderRadius:    ORB_SIZE / 2,
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     2,
    borderColor:     "rgba(255,255,255,0.25)",
    // default subtle shadow
    shadowColor:     "#000",
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.18,
    shadowRadius:    4,
    elevation:       3,
  },
  orbRing: {
    width:           14,
    height:          14,
    borderRadius:    7,
    borderWidth:     2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  spine: {
    width:           SPINE_W,
    flex:            1,
    minHeight:       20,
    backgroundColor: colors.primary + "28",
    borderRadius:    1,
  },

  // ── Right: card ──
  card: {
    flex:            1,
    backgroundColor: colors.background,
    borderRadius:    radius.lg,
    padding:         spacing.md,
    borderWidth:     1,
    borderColor:     colors.gray300,
    gap:             spacing.xs,
    marginBottom:    spacing.base,
  },
  cardLatest: {
    borderColor:     colors.primary,
    borderWidth:     1.5,
    backgroundColor: colors.primaryMuted,
  },
  currentPill: {
    alignSelf:         "flex-start",
    backgroundColor:   colors.primary,
    borderRadius:      radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    marginBottom:      spacing.xs,
  },
  currentPillText: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.extrabold,
    color:         colors.onPrimary,
    letterSpacing: 1.5,
  },
  beltRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  beltDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    borderWidth:  1,
    borderColor:  "rgba(0,0,0,0.12)",
  },
  beltName: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.bold,
    color:      colors.gray900,
  },
  metaRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
    flexWrap:      "wrap",
  },
  metaSep: {
    width:           3,
    height:          3,
    borderRadius:    2,
    backgroundColor: colors.gray300,
  },
  metaText: {
    fontSize: typography.size.xs,
    color:    colors.gray500,
  },
  promoterRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.xs,
    flexWrap:      "wrap",
  },
  promoterLabel: {
    fontSize:      typography.size.xs,
    color:         colors.gray500,
    fontStyle:     "italic",
  },
  promoterName: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray700,
    flexShrink:    1,
  },
  promoterAddr: {
    fontFamily:  "monospace",
    color:       colors.gray500,
    fontWeight:  typography.weight.normal,
  },
});
