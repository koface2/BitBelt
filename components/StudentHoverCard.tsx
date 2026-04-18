/**
 * StudentHoverCard — floating popup shown when hovering over a student's name
 * on web.  On native the component renders nothing (not useful without hover).
 *
 * Internally fires two `useReadContract` calls:
 *   1. getLineage(address) → token IDs
 *   2. getRankInfo(lastTokenId) → current belt info
 *
 * The wrapper parent (StudentHoverRow) handles the hover-event listeners and
 * absolute positioning so the card floats *above* the trigger row.
 */

import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useReadContract } from "thirdweb/react";
import { Theme } from "@/constants/Theme";
import { sbtContract } from "@/constants/BitBelt";
import BeltVisual from "@/components/BeltVisual";
import type { Student } from "@/hooks/useStudents";

const { colors, spacing, typography, radius, shadow } = Theme;

// ── Belt fetch sub-component ──────────────────────────────────────────────────
// Split into a child component so both hooks are always called unconditionally.

interface BeltFetchProps {
  address: string;
  onViewProfile: () => void;
}

function BeltFetch({ address, onViewProfile }: BeltFetchProps) {
  const { data: tokenIds, isLoading: loadingLineage } = useReadContract({
    contract: sbtContract,
    method:   "function getLineage(address) view returns (uint256[])",
    params:   [address as `0x${string}`],
  });

  const lastId =
    tokenIds && tokenIds.length > 0
      ? tokenIds[tokenIds.length - 1]
      : undefined;

  const { data: rankInfo, isLoading: loadingRank } = useReadContract({
    contract: sbtContract,
    method:   "function getRankInfo(uint256 tokenId) view returns ((uint256 promotionDate, string beltColor, address instructorAddress))",
    params:   [lastId ?? 0n],
    queryOptions: { enabled: !!lastId },
  });

  const isLoading   = loadingLineage || (!!lastId && loadingRank);
  const currentBelt =
    rankInfo != null
      ? String((rankInfo as { beltColor: string }).beltColor)
      : null;

  return (
    <>
      {/* ── Belt visual ── */}
      <View style={styles.beltArea}>
        {isLoading ? (
          <View style={styles.beltLoading}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.beltLoadingText}>Loading rank…</Text>
          </View>
        ) : currentBelt ? (
          <>
            <BeltVisual color={currentBelt} size="md" style={styles.beltStrip} />
            <Text style={styles.beltLabel}>{currentBelt} Belt</Text>
          </>
        ) : (
          <View style={styles.noBeltBox}>
            <Text style={styles.noBeltText}>No belt on-chain yet</Text>
          </View>
        )}
      </View>

      {/* ── Action button ── */}
      <Pressable
        onPress={onViewProfile}
        style={({ pressed }) => [
          styles.profileBtn,
          pressed && styles.profileBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="View student profile"
      >
        <Text style={styles.profileBtnText}>View Profile →</Text>
      </Pressable>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  student: Student;
  onViewProfile: () => void;
}

/**
 * Must be rendered inside a `position: relative` container.
 * Floats absolutely above the trigger row via `bottom: '105%'`.
 */
export default function StudentHoverCard({ student, onViewProfile }: Props) {
  if (Platform.OS !== "web") return null;

  return (
    <View style={styles.card} accessibilityViewIsModal={false}>
      {/* Down-pointing arrow */}
      <View style={styles.arrowWrap}>
        <View style={styles.arrow} />
      </View>

      {/* Header: avatar + name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.studentName} numberOfLines={1}>
            {student.name}
          </Text>
          <Text style={styles.walletAddress} numberOfLines={1}>
            {student.address.slice(0, 8)}…{student.address.slice(-6)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Belt section — mounts its own hooks */}
      <BeltFetch address={student.address} onViewProfile={onViewProfile} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Card shell ──
  card: {
    position:        "absolute",
    bottom:          "105%",
    left:            0,
    minWidth:        220,
    maxWidth:        300,
    backgroundColor: colors.background,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.gray300,
    padding:         spacing.base,
    gap:             spacing.sm,
    zIndex:          9999,
    ...shadow.lg,
  },

  // ── Arrow pointing down toward the row ──
  arrowWrap: {
    position:   "absolute",
    bottom:     -9,
    left:       20,
    alignItems: "center",
    zIndex:     10000,
  },
  arrow: {
    width:           16,
    height:          16,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor:     colors.gray300,
    transform:       [{ rotate: "45deg" }],
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems:   "center",
    gap:          spacing.sm,
  },
  avatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.primaryMuted,
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     2,
    borderColor:     colors.primary,
  },
  avatarText: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.extrabold,
    color:      colors.primary,
  },
  nameBlock: {
    flex: 1,
    gap:  2,
  },
  studentName: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.bold,
    color:      colors.gray900,
  },
  walletAddress: {
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    fontFamily: "monospace",
  },

  // ── Divider ──
  divider: {
    height:          1,
    backgroundColor: colors.gray100,
  },

  // ── Belt area ──
  beltArea: {
    gap: spacing.xs,
  },
  beltStrip: {},
  beltLabel: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray700,
    textAlign:     "center",
    marginTop:     2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  beltLoading: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            spacing.xs,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  beltLoadingText: {
    fontSize: typography.size.xs,
    color:    colors.gray500,
  },
  noBeltBox: {
    backgroundColor: colors.surface,
    borderRadius:    radius.md,
    paddingVertical: spacing.sm,
    alignItems:      "center",
  },
  noBeltText: {
    fontSize: typography.size.xs,
    color:    colors.gray500,
    fontStyle: "italic",
  },

  // ── Profile button ──
  profileBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.lg,
    paddingVertical: spacing.sm,
    alignItems:      "center",
    marginTop:       spacing.xs,
    minHeight:       36,
    justifyContent:  "center",
  },
  profileBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  profileBtnText: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.bold,
    color:      colors.onPrimary,
    letterSpacing: 0.3,
  },
});
