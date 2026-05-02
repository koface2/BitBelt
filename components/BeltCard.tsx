import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Theme } from "../constants/Theme";

const { colors, spacing, typography, radius, shadow } = Theme;

// BJJ belt rank labels
const BELT_LABELS: Record<BeltRank, string> = {
  white:  "White Belt",
  blue:   "Blue Belt",
  purple: "Purple Belt",
  brown:  "Brown Belt",
  black:  "Black Belt",
  coral:  "Coral Belt",
  red:    "Red Belt",
};

export type BeltRank = "white" | "blue" | "purple" | "brown" | "black" | "coral" | "red";

export interface BeltCardProps {
  /** Athlete's display name */
  athleteName: string;
  /** Current belt rank */
  beltRank: BeltRank;
  /** On-chain SBT token ID */
  tokenId: string;
  /** ISO-8601 date string of the promotion */
  promotionDate: string;
  /** Wallet address of the promoting instructor */
  instructorAddress?: string;
}

/** Truncate a hex address to 0x1234…5678 format */
function truncateAddress(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Format an ISO date string to a locale-friendly display (e.g. "Apr 13, 2026") */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * BeltCard — High-end digital ID card for a BJJ belt promotion SBT.
 *
 * Design: Clean, minimalist, high-trust (SaaS / Fintech aesthetic).
 * Accessibility: All text meets WCAG AA contrast requirements.
 */
export default function BeltCard({
  athleteName,
  beltRank,
  tokenId,
  promotionDate,
  instructorAddress,
}: BeltCardProps) {
  const beltColor    = colors.belt[beltRank];
  const beltTextColor = colors.onBelt[beltRank];

  return (
    <View style={styles.card}>
      {/* Belt color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: beltColor }]} />

      {/* Card body */}
      <View style={styles.body}>

        {/* Header row: brand + belt badge */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>BitBelt</Text>
            <Text style={styles.subBrand}>BJJ Certification & Lineage</Text>
          </View>
          <View style={[styles.beltBadge, { backgroundColor: beltColor }]}>
            <Text style={[styles.beltBadgeText, { color: beltTextColor }]}>
              {beltRank.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Athlete name */}
        <Text style={styles.labelSmall}>ATHLETE</Text>
        <Text style={styles.athleteName}>{athleteName}</Text>

        {/* Belt rank label */}
        <Text style={styles.beltLabel}>{BELT_LABELS[beltRank]}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Meta row: token ID + promotion date */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.labelSmall}>CERTIFICATE ID</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              #{tokenId}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.labelSmall}>PROMOTED</Text>
            <Text style={styles.metaValue}>{formatDate(promotionDate)}</Text>
          </View>
        </View>

        {/* Instructor row (optional) */}
        {instructorAddress ? (
          <View style={styles.instructorRow}>
            <Text style={styles.labelSmall}>INSTRUCTOR</Text>
            <Text style={styles.instructorAddress}>
              {truncateAddress(instructorAddress)}
            </Text>
          </View>
        ) : null}

        {/* SBT verification pill */}
        <View style={styles.verifiedPill}>
          <View style={styles.verifiedDot} />
          <Text style={styles.verifiedText}>Verified Certificate · Permanent Record</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadow.md,
    borderWidth: 1,
    borderColor: colors.gray300,
  },

  accentBar: {
    height: 6,
    width: "100%",
  },

  body: {
    padding: spacing.xl,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  brand: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.extrabold,
    color: colors.primary,
    letterSpacing: -0.5,
  },

  subBrand: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.regular,
    color: colors.gray500,
    marginTop: 2,
  },

  beltBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    minWidth: 44,
    minHeight: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  beltBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray300,
    marginVertical: spacing.base,
  },

  labelSmall: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },

  athleteName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray900,
    letterSpacing: -0.5,
  },

  beltLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  metaRow: {
    flexDirection: "row",
    gap: spacing.xl,
    marginBottom: spacing.md,
  },

  metaItem: {
    flex: 1,
  },

  metaValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray700,
  },

  instructorRow: {
    marginBottom: spacing.base,
  },

  instructorAddress: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.gray700,
    fontVariant: ["tabular-nums"],
  },

  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },

  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },

  verifiedText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.primary,
  },
});
