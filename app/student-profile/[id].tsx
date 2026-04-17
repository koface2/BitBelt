/**
 * Student Profile — /student-profile/[id]
 *
 * Shows a student's local identity and their full belt history from the
 * BitBeltSBT contract on Base Sepolia.
 *
 * Data strategy — each belt entry is rendered as its own <BeltEntryCard>
 * sub-component whose single useReadContract call is always mounted.
 * This avoids the useEffect+readContract chain that failed silently.
 */

import React from "react";
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
import { Theme } from "@/constants/Theme";
import { sbtContract } from "@/constants/BitBelt";
import { useStudents } from "@/hooks/useStudents";
import BeltVisual from "@/components/BeltVisual";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  const ms = Number(ts) * 1000;
  if (!ms || isNaN(ms)) return "Unknown date";
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ── Per-token sub-component ───────────────────────────────────────────────────
// Each instance has its own useReadContract — valid hook usage since each
// BeltEntryCard is a separate component with a stable token ID.

interface EntryProps {
  tokenId:  bigint;
  isLatest: boolean;
}

function BeltEntryCard({ tokenId, isLatest }: EntryProps) {
  const { data: info, isLoading, error } = useReadContract({
    contract: sbtContract,
    method:   "function getRankInfo(uint256) view returns (uint256, string, address)",
    params:   [tokenId],
  });

  if (isLoading) {
    return (
      <View style={styles.entryLoading}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.entryLoadingText}>Loading token #{String(tokenId)}…</Text>
      </View>
    );
  }

  if (error || !info) return null;

  const promotionDate     = info[0] as bigint;
  const beltColor         = String(info[1]);
  const instructorAddress = String(info[2]);

  return (
    <View style={[styles.entryCard, isLatest && styles.entryCardLatest]}>
      {isLatest && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>CURRENT RANK</Text>
        </View>
      )}

      <BeltVisual
        color={beltColor}
        size={isLatest ? "lg" : "md"}
        style={styles.beltVisual}
      />

      <View style={styles.entryMeta}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>{formatDate(promotionDate)}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Token ID</Text>
          <Text style={styles.metaValue}>#{String(tokenId)}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Instructor</Text>
          <Text style={styles.metaValueMono} numberOfLines={1}>
            {instructorAddress.slice(0, 8)}…{instructorAddress.slice(-6)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StudentProfileScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>();
  const router       = useRouter();
  const { students } = useStudents();

  const student = students.find((s) => s.id === id);

  const {
    data:      tokenIds,
    isLoading: lineageLoading,
    error:     lineageError,
  } = useReadContract({
    contract: sbtContract,
    method:   "function getLineage(address) view returns (uint256[])",
    params:   [student?.address ?? "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!student },
  });

  const orderedIds = tokenIds ? [...tokenIds].reverse() : [];

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
          <Text style={styles.headerTitle}>Student Profile</Text>
          <View style={styles.placeholder} />
        </View>

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
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {student.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.identityInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.walletLabel}>WALLET</Text>
                <Text style={styles.walletAddress} selectable numberOfLines={1}>
                  {student.address}
                </Text>
              </View>
            </View>

            {/* ── Belt History ── */}
            <View>
              <Text style={styles.sectionLabel}>BELT HISTORY</Text>
              <Text style={styles.sectionSub}>
                Immutable promotions verified on Base Sepolia
              </Text>

              {lineageLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Reading blockchain…</Text>
                </View>
              )}

              {lineageError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    Could not read on-chain data. Check your connection.
                  </Text>
                </View>
              )}

              {!lineageLoading && !lineageError && orderedIds.length === 0 && (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryIcon}>🥋</Text>
                  <Text style={styles.emptyHistoryText}>
                    No belt promotions recorded on-chain for this wallet.
                  </Text>
                </View>
              )}

              {orderedIds.map((tokenId, i) => (
                <View key={String(tokenId)} style={styles.timelineItem}>
                  {i < orderedIds.length - 1 && (
                    <View style={styles.trackLine} />
                  )}
                  <BeltEntryCard tokenId={tokenId} isLatest={i === 0} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing["2xl"],
    paddingTop:        spacing.xl,
    paddingBottom:     spacing["5xl"],
    gap:               spacing["2xl"],
  },

  header: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width:           44,
    height:          44,
    borderRadius:    radius.md,
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.gray300,
    alignItems:      "center",
    justifyContent:  "center",
    ...shadow.sm,
  },
  iconButtonPressed: { backgroundColor: colors.surfaceAlt },
  iconButtonText: {
    fontSize:   typography.size.lg,
    fontWeight: typography.weight.bold,
    color:      colors.gray900,
  },
  headerTitle: {
    fontSize:   typography.size.md,
    fontWeight: typography.weight.bold,
    color:      colors.gray900,
  },
  placeholder: { width: 44 },

  identityCard: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             spacing.xl,
    backgroundColor: colors.surface,
    borderRadius:    radius.xl,
    padding:         spacing.xl,
    borderWidth:     1,
    borderColor:     colors.gray300,
    ...shadow.md,
  },
  avatarCircle: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: colors.primaryMuted,
    borderWidth:     3,
    borderColor:     colors.primary,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },
  avatarText: {
    fontSize:   typography.size.xl,
    fontWeight: typography.weight.extrabold,
    color:      colors.primary,
  },
  identityInfo: { flex: 1, gap: spacing.xs },
  studentName: {
    fontSize:   typography.size.lg,
    fontWeight: typography.weight.extrabold,
    color:      colors.gray900,
  },
  walletLabel: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop:     spacing.xs,
  },
  walletAddress: {
    fontSize:   typography.size.xs,
    color:      colors.gray700,
    fontFamily: "monospace",
  },

  sectionLabel: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom:  2,
  },
  sectionSub: {
    fontSize:     typography.size.xs,
    color:        colors.gray500,
    marginBottom: spacing.base,
  },

  loadingRow: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             spacing.sm,
    paddingVertical: spacing.xl,
    justifyContent:  "center",
  },
  loadingText: {
    fontSize: typography.size.sm,
    color:    colors.gray500,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius:    radius.lg,
    padding:         spacing.base,
  },
  errorText: {
    fontSize:   typography.size.sm,
    color:      colors.error,
    fontWeight: typography.weight.medium,
  },
  emptyHistory: {
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    padding:         spacing["2xl"],
    alignItems:      "center",
    gap:             spacing.sm,
    borderWidth:     1,
    borderColor:     colors.gray300,
    borderStyle:     "dashed",
  },
  emptyHistoryIcon: { fontSize: 32 },
  emptyHistoryText: {
    fontSize:  typography.size.sm,
    color:     colors.gray500,
    textAlign: "center",
  },

  timelineItem: {
    marginBottom: spacing.base,
    position:     "relative",
  },
  trackLine: {
    position:        "absolute",
    left:            20,
    top:             "100%",
    width:           2,
    height:          spacing.base,
    backgroundColor: colors.gray300,
    zIndex:          0,
  },

  entryLoading: {
    flexDirection:   "row",
    gap:             spacing.sm,
    alignItems:      "center",
    padding:         spacing.base,
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.gray300,
  },
  entryLoadingText: {
    fontSize: typography.size.xs,
    color:    colors.gray500,
  },

  entryCard: {
    backgroundColor: colors.surface,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.gray300,
    padding:         spacing.base,
    gap:             spacing.sm,
    ...shadow.sm,
  },
  entryCardLatest: {
    borderColor: colors.primary,
    borderWidth: 2,
    ...shadow.md,
  },

  currentBadge: {
    backgroundColor:  colors.primary,
    borderRadius:     radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical:  3,
    alignSelf:        "flex-start",
  },
  currentBadgeText: {
    fontSize:      typography.size.xs - 1,
    fontWeight:    typography.weight.bold,
    color:         colors.onPrimary,
    letterSpacing: 0.8,
  },

  beltVisual: {
    marginVertical: spacing.xs,
  },

  entryMeta: {
    backgroundColor: colors.background,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.gray100,
    padding:         spacing.sm,
    gap:             spacing.xs,
  },
  metaRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  metaDivider: {
    height:          1,
    backgroundColor: colors.gray100,
  },
  metaLabel: {
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    fontWeight: typography.weight.medium,
  },
  metaValue: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.semibold,
    color:      colors.gray700,
  },
  metaValueMono: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.semibold,
    color:      colors.gray700,
    fontFamily: "monospace",
  },

  emptyState: {
    alignItems:      "center",
    gap:             spacing.md,
    paddingVertical: spacing["5xl"],
  },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: {
    fontSize:   typography.size.lg,
    fontWeight: typography.weight.bold,
    color:      colors.gray900,
  },
  emptyBody: {
    fontSize:  typography.size.sm,
    color:     colors.gray500,
    textAlign: "center",
    maxWidth:  280,
  },
});
