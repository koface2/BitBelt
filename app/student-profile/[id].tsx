/**
 * Student Profile — /student-profile/[id]
 *
 * Displays a student's identity from the local registry and their full belt
 * promotion history pulled from the BitBeltSBT smart contract on Base Sepolia.
 *
 * Data flow:
 *   1. Look up Student in local registry by route param `id`.
 *   2. Call getLineage(address) → ordered array of tokenIds.
 *   3. For each tokenId, call getRankInfo(tokenId) → { promotionDate, beltColor, instructorAddress }.
 *   4. Render a belt history timeline, newest first.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useReadContract } from "thirdweb/react";
import { readContract } from "thirdweb";
import { Theme } from "@/constants/Theme";
import { sbtContract } from "@/constants/BitBelt";
import { useStudents } from "@/hooks/useStudents";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ── Types ─────────────────────────────────────────────────────────────────────

interface RankEntry {
  tokenId: bigint;
  beltColor: string;
  promotionDate: bigint;
  instructorAddress: string;
}

// ── Belt colour helpers ───────────────────────────────────────────────────────

const BELT_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  White:  { bg: colors.belt.white,  fg: colors.onBelt.white,  border: colors.gray300 },
  Blue:   { bg: colors.belt.blue,   fg: colors.onBelt.blue,   border: colors.belt.blue },
  Purple: { bg: colors.belt.purple, fg: colors.onBelt.purple, border: colors.belt.purple },
  Brown:  { bg: colors.belt.brown,  fg: colors.onBelt.brown,  border: colors.belt.brown },
  Black:  { bg: colors.belt.black,  fg: colors.onBelt.black,  border: colors.belt.black },
};

function getBeltStyle(color: string) {
  return BELT_COLORS[color] ?? { bg: colors.surface, fg: colors.gray700, border: colors.gray300 };
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) * 1000;
  if (ms <= 0 || isNaN(ms)) return "Unknown date";
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { students } = useStudents();

  const student = students.find((s) => s.id === id);

  // ── Lineage from contract ──────────────────────────────────────────────────
  const {
    data: tokenIds,
    isLoading: lineageLoading,
    error: lineageError,
  } = useReadContract({
    contract: sbtContract,
    method: "function getLineage(address student) external view returns (uint256[] memory)",
    params: [student?.address ?? "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!student },
  });

  // ── Fetch each RankInfo ────────────────────────────────────────────────────
  const [rankEntries, setRankEntries] = useState<RankEntry[]>([]);
  const [rankLoading, setRankLoading] = useState(false);

  useEffect(() => {
    if (!tokenIds || tokenIds.length === 0) {
      setRankEntries([]);
      return;
    }

    let cancelled = false;
    setRankLoading(true);

    (async () => {
      const results: RankEntry[] = [];
      for (const tokenId of tokenIds) {
        try {
          const info = await readContract({
            contract: sbtContract,
            method:
              "function getRankInfo(uint256 tokenId) external view returns (uint256 promotionDate, string beltColor, address instructorAddress)",
            params: [tokenId],
          });
          results.push({
            tokenId,
            promotionDate:     info[0],
            beltColor:         info[1],
            instructorAddress: info[2],
          });
        } catch {
          // Token may have been burned — skip it
        }
      }
      if (!cancelled) {
        // Show most-recent promotion first
        setRankEntries(results.reverse());
        setRankLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tokenIds]);

  // ── Current belt (first entry after reversal = most recent) ──────────────
  const currentBelt = rankEntries[0]?.beltColor ?? null;
  const beltStyle   = currentBelt ? getBeltStyle(currentBelt) : null;

  const isLoading = lineageLoading || rankLoading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={touchTarget.minHitSlop}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.iconButtonText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.iconPlaceholder} />
        </View>

        {/* ── Student not found ── */}
        {!student && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Student Not Found</Text>
            <Text style={styles.emptyBody}>
              This student may have been removed from the registry.
            </Text>
          </View>
        )}

        {student && (
          <>
            {/* ── Identity card ── */}
            <View style={styles.identityCard}>
              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  beltStyle && { backgroundColor: beltStyle.bg, borderColor: beltStyle.border },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    beltStyle && { color: beltStyle.fg },
                    !beltStyle && { color: colors.primary },
                    currentBelt === "White" && { color: colors.gray700 },
                  ]}
                >
                  {student.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Name + belt */}
              <View style={styles.identityInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                {currentBelt && (
                  <View style={[styles.beltBadge, { backgroundColor: beltStyle!.bg, borderColor: beltStyle!.border }]}>
                    <Text style={[styles.beltBadgeText, { color: beltStyle!.fg }, currentBelt === "White" && { color: colors.gray700 }]}>
                      {currentBelt} Belt
                    </Text>
                  </View>
                )}
                {!currentBelt && !isLoading && (
                  <Text style={styles.noBeltText}>No promotions on-chain</Text>
                )}
              </View>
            </View>

            {/* ── Wallet address ── */}
            <View style={styles.walletCard}>
              <Text style={styles.walletLabel}>WALLET ADDRESS</Text>
              <Text style={styles.walletAddress} selectable numberOfLines={1}>
                {student.address}
              </Text>
            </View>

            {/* ── Belt history ── */}
            <View>
              <Text style={styles.sectionLabel}>BELT HISTORY</Text>
              <Text style={styles.sectionSub}>
                Immutable promotions recorded on Base blockchain
              </Text>

              {isLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Loading blockchain records…</Text>
                </View>
              )}

              {lineageError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    Could not load blockchain data. Check your connection.
                  </Text>
                </View>
              )}

              {!isLoading && !lineageError && rankEntries.length === 0 && (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>
                    No belt promotions found on-chain for this wallet.
                  </Text>
                </View>
              )}

              {rankEntries.map((entry, i) => {
                const bs = getBeltStyle(entry.beltColor);
                const isLatest = i === 0;
                return (
                  <View key={String(entry.tokenId)} style={styles.timelineItem}>
                    {/* Track line */}
                    {i < rankEntries.length - 1 && <View style={styles.timelineTrack} />}

                    {/* Dot */}
                    <View style={[styles.timelineDot, { backgroundColor: bs.bg, borderColor: bs.border }]} />

                    {/* Card */}
                    <View style={[styles.promotionCard, isLatest && styles.promotionCardLatest]}>
                      {isLatest && (
                        <View style={styles.latestBadge}>
                          <Text style={styles.latestBadgeText}>CURRENT</Text>
                        </View>
                      )}

                      <View style={styles.promotionHeader}>
                        <View style={[styles.beltPill, { backgroundColor: bs.bg, borderColor: bs.border }]}>
                          <Text style={[styles.beltPillText, { color: bs.fg }, entry.beltColor === "White" && { color: colors.gray700 }]}>
                            {entry.beltColor}
                          </Text>
                        </View>
                        <Text style={styles.promotionDate}>{formatDate(entry.promotionDate)}</Text>
                      </View>

                      <View style={styles.promotionMeta}>
                        <Text style={styles.metaLabel}>Token ID</Text>
                        <Text style={styles.metaValue}>#{String(entry.tokenId)}</Text>
                      </View>

                      <View style={styles.promotionMeta}>
                        <Text style={styles.metaLabel}>Instructor</Text>
                        <Text style={styles.metaValueMono} numberOfLines={1}>
                          {entry.instructorAddress.slice(0, 8)}…{entry.instructorAddress.slice(-6)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
    paddingBottom: spacing["5xl"],
    gap: spacing["2xl"],
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray900,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.sm,
  },
  iconButtonPressed: { backgroundColor: colors.surfaceAlt },
  iconButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray900,
  },
  iconPlaceholder: { width: 44 },

  // ── Identity card ──
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray300,
    ...shadow.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.extrabold,
    color: colors.primary,
  },
  identityInfo: { flex: 1, gap: spacing.sm },
  studentName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.extrabold,
    color: colors.gray900,
  },
  beltBadge: {
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  beltBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.3,
  },
  noBeltText: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    fontStyle: "italic",
  },

  // ── Wallet card ──
  walletCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  walletLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  walletAddress: {
    fontSize: typography.size.sm,
    color: colors.gray700,
    fontFamily: "monospace",
  },

  // ── Section heading ──
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    marginBottom: spacing.base,
  },

  // ── Loading / error / empty ──
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    justifyContent: "center",
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.gray500,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    fontWeight: typography.weight.medium,
  },
  emptyHistory: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray300,
    borderStyle: "dashed",
  },
  emptyHistoryText: {
    fontSize: typography.size.sm,
    color: colors.gray500,
    textAlign: "center",
  },

  // ── Timeline ──
  timelineItem: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.base,
    position: "relative",
  },
  timelineTrack: {
    position: "absolute",
    left: 11,
    top: 24,
    bottom: -spacing.base,
    width: 2,
    backgroundColor: colors.gray300,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: spacing.base,
    flexShrink: 0,
  },
  promotionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray300,
    padding: spacing.base,
    gap: spacing.sm,
    ...shadow.sm,
  },
  promotionCardLatest: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primaryMuted,
  },
  latestBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  latestBadgeText: {
    fontSize: typography.size.xs - 1,
    fontWeight: typography.weight.bold,
    color: colors.onPrimary,
    letterSpacing: 0.8,
  },
  promotionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  beltPill: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  beltPillText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  promotionDate: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.gray700,
  },
  promotionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    fontWeight: typography.weight.medium,
  },
  metaValue: {
    fontSize: typography.size.xs,
    color: colors.gray700,
    fontWeight: typography.weight.semibold,
  },
  metaValueMono: {
    fontSize: typography.size.xs,
    color: colors.gray700,
    fontFamily: "monospace",
  },

  // ── Empty state (student not in registry) ──
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing["5xl"],
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray900,
  },
  emptyBody: {
    fontSize: typography.size.sm,
    color: colors.gray500,
    textAlign: "center",
    maxWidth: 280,
  },
});
