/**
 * InstructorLineage — Full recursive instructor chain for the student profile.
 *
 * Walks upward from the student's current instructor, fetching each person's
 * on-chain record to find THEIR instructor, until a genesis node is reached
 * (no tokens on-chain, zero address, self-referential, or depth limit).
 *
 * Renders top-down: genesis at top, current student at bottom.
 * Each node is tappable and opens the address on Basescan.
 */

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Linking } from "react-native";
import { useReadContract } from "thirdweb/react";
import { Theme } from "@/constants/Theme";
import { sbtContract, chain } from "@/constants/BitBelt";
import type { Student } from "@/hooks/useStudents";

const { colors, spacing, typography, radius, shadow } = Theme;

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const MAX_DEPTH = 10;

// Block explorer base URL — derived from the active chain.
const EXPLORER_BASE =
  chain.id === 8453
    ? "https://basescan.org/address"
    : "https://sepolia.basescan.org/address";

const BELT_DOT_COLOR: Record<string, string> = {
  White:  "#E4E4E7",
  Blue:   "#1D4ED8",
  Purple: "#7C3AED",
  Brown:  "#92400E",
  Black:  "#111827",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function explorerUrl(address: string): string {
  return `${EXPLORER_BASE}/${address}`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) * 1000;
  if (!ms || isNaN(ms)) return "";
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function resolveName(address: string, students: Student[]): string | null {
  if (!address || address === ZERO_ADDR) return null;
  return (
    students.find((s) => s.address.toLowerCase() === address.toLowerCase())?.name ?? null
  );
}

function isValidAddr(address: string): boolean {
  return !!address && address !== ZERO_ADDR && address.startsWith("0x") && address.length === 42;
}

// ── Chain node (visual) ───────────────────────────────────────────────────────

interface NodeItemProps {
  address:   string;
  beltColor: string;
  date:      string;
  isStudent: boolean;
  isGenesis: boolean;
  students:  Student[];
}

function ChainNodeItem({ address, beltColor, date, isStudent, isGenesis, students }: NodeItemProps) {
  const name     = resolveName(address, students);
  const label    = name ?? `${address.slice(0, 6)}…${address.slice(-4)}`;
  const dotColor = BELT_DOT_COLOR[beltColor] ?? colors.gray300;

  return (
    <Pressable
      onPress={() => Linking.openURL(explorerUrl(address))}
      accessibilityRole="link"
      accessibilityLabel={`View ${label} on block explorer`}
      style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
    >
      <View style={[
        styles.node,
        isStudent && styles.nodeStudent,
        isGenesis && !isStudent && styles.nodeGenesis,
      ]}>
        {/* Tags + explorer link row */}
        <View style={styles.tagRow}>
          <View style={styles.tagLeft}>
            {isGenesis && !isStudent && (
              <View style={styles.genesisTag}>
                <Text style={styles.genesisTagText}>GENESIS</Text>
              </View>
            )}
            {isStudent && (
              <View style={styles.studentTag}>
                <Text style={styles.studentTagText}>CURRENT STUDENT</Text>
              </View>
            )}
          </View>
          <Text style={styles.explorerHint}>↗ Basescan</Text>
        </View>

        {/* Name row */}
        <View style={styles.nameRow}>
          {!!beltColor ? (
            <View style={[styles.beltDot, { backgroundColor: dotColor }]} />
          ) : (
            <View style={styles.genesisDot} />
          )}
          <Text
            style={[styles.nodeName, !name && styles.nodeAddrText]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>

        {/* Belt + date */}
        {!!beltColor && (
          <Text style={styles.nodeBelt}>{beltColor} Belt</Text>
        )}
        {!!date && (
          <Text style={styles.nodeDate}>{date}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Connector between nodes ───────────────────────────────────────────────────

function Connector() {
  return (
    <View style={styles.connector}>
      <View style={styles.connectorLine} />
      <Text style={styles.connectorLabel}>promoted</Text>
      <Text style={styles.connectorArrow}>↓</Text>
      <View style={styles.connectorLine} />
    </View>
  );
}

// ── Recursive chain link ──────────────────────────────────────────────────────

interface ChainLinkProps {
  address:  string;
  depth:    number;
  students: Student[];
  /**
   * Lowercase addresses already in the chain above this node.
   * Prevents cycles — including self-referential genesis nodes (e.g. Helio → Helio).
   */
  visited:  string[];
}

function ChainLink({ address, depth, students, visited }: ChainLinkProps) {
  const valid = isValidAddr(address);

  const { data: tokenIds, isLoading: lineageLoading } = useReadContract({
    contract: sbtContract,
    method:   "function getLineage(address) view returns (uint256[])",
    params:   [address as `0x${string}`],
    queryOptions: { enabled: valid },
  });

  const latestId = tokenIds && tokenIds.length > 0 ? tokenIds[tokenIds.length - 1] : undefined;

  const { data: rankInfo, isLoading: rankLoading } = useReadContract({
    contract: sbtContract,
    method:   "function getRankInfo(uint256 tokenId) view returns ((uint256 promotionDate, string beltColor, address instructorAddress))",
    params:   [latestId ?? BigInt(0)],
    queryOptions: { enabled: !!latestId },
  });

  const isLoading = lineageLoading || (!!latestId && rankLoading);

  if (isLoading) {
    return (
      <View style={styles.loadingNode}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching lineage…</Text>
      </View>
    );
  }

  const hasTokens  = tokenIds && tokenIds.length > 0;
  const parentAddr = rankInfo ? String((rankInfo as any).instructorAddress) : ZERO_ADDR;
  const beltColor  = rankInfo ? String((rankInfo as any).beltColor)         : "";
  const date       = rankInfo ? formatDate((rankInfo as any).promotionDate)  : "";

  // isCycle catches both self-loops (Helio → Helio) and longer cycles.
  // Check parentAddr against the CURRENT address too, not just the ancestors list.
  const isCycle   = parentAddr.toLowerCase() === address.toLowerCase()
                    || visited.includes(parentAddr.toLowerCase());
  const isGenesis = !hasTokens || !isValidAddr(parentAddr) || depth >= MAX_DEPTH || isCycle;
  const hasParent = !isGenesis && isValidAddr(parentAddr);

  const nextVisited = [...visited, address.toLowerCase()];

  return (
    <>
      {hasParent && (
        <>
          <ChainLink
            address={parentAddr}
            depth={depth + 1}
            students={students}
            visited={nextVisited}
          />
          <Connector />
        </>
      )}
      <ChainNodeItem
        address={address}
        beltColor={beltColor}
        date={date}
        isStudent={false}
        isGenesis={isGenesis}
        students={students}
      />
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  /** Latest token ID for the student — start of the chain. */
  latestTokenId:  bigint;
  studentAddress: string;
  students:       Student[];
}

export default function InstructorLineage({ latestTokenId, studentAddress, students }: Props) {
  const { data: rankInfo, isLoading } = useReadContract({
    contract: sbtContract,
    method:   "function getRankInfo(uint256 tokenId) view returns ((uint256 promotionDate, string beltColor, address instructorAddress))",
    params:   [latestTokenId],
  });

  const instructorAddr = rankInfo ? String((rankInfo as any).instructorAddress) : ZERO_ADDR;
  const studentBelt    = rankInfo ? String((rankInfo as any).beltColor)         : "";
  const studentDate    = rankInfo ? formatDate((rankInfo as any).promotionDate)  : "";

  const hasInstructor = isValidAddr(instructorAddr);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.accentBar} />
          <Text style={styles.headerTitle}>BELT LINEAGE</Text>
        </View>
        <Text style={styles.headerSub}>Chain of promotion</Text>
      </View>

      {/* ── Chain ── */}
      <View style={styles.chain}>
        {isLoading ? (
          <View style={styles.loadingNode}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Reading on-chain data…</Text>
          </View>
        ) : (
          <>
            {hasInstructor && (
              <>
                <ChainLink
                  address={instructorAddr}
                  depth={1}
                  students={students}
                  visited={[studentAddress.toLowerCase()]}
                />
                <Connector />
              </>
            )}
            <ChainNodeItem
              address={studentAddress}
              beltColor={studentBelt}
              date={studentDate}
              isStudent
              isGenesis={!hasInstructor}
              students={students}
            />
          </>
        )}
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

  // ── Header ──
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
  headerTitle: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.extrabold,
    color:         colors.primary,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize:  typography.size.xs,
    color:     colors.gray500,
    fontStyle: "italic",
  },

  // ── Chain ──
  chain: {
    gap: 0,
  },

  // ── Node ──
  node: {
    backgroundColor: colors.background,
    borderRadius:    radius.lg,
    padding:         spacing.md,
    borderWidth:     1,
    borderColor:     colors.gray300,
    gap:             spacing.xs,
  },
  nodeStudent: {
    borderColor:     colors.primary,
    borderWidth:     1.5,
    backgroundColor: colors.primaryMuted,
  },
  nodeGenesis: {
    borderStyle: "dashed",
    borderColor: colors.gray300,
  },

  tagRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   2,
  },
  tagLeft: {
    flex: 1,
  },
  genesisTag: {
    alignSelf:         "flex-start",
    backgroundColor:   colors.gray100,
    borderRadius:      radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    borderWidth:       1,
    borderColor:       colors.gray300,
  },
  genesisTagText: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.extrabold,
    color:         colors.gray500,
    letterSpacing: 1,
  },
  studentTag: {
    alignSelf:         "flex-start",
    backgroundColor:   colors.primary,
    borderRadius:      radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
  },
  studentTagText: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.extrabold,
    color:         colors.onPrimary,
    letterSpacing: 1,
  },
  explorerHint: {
    fontSize: typography.size.xs,
    color:    colors.primary,
  },

  nameRow: {
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
    flexShrink:   0,
  },
  genesisDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    borderWidth:  1.5,
    borderColor:  colors.gray300,
    flexShrink:   0,
  },
  nodeName: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.bold,
    color:      colors.gray900,
    flexShrink: 1,
  },
  nodeAddrText: {
    fontFamily: "monospace",
    fontWeight: typography.weight.normal,
    fontSize:   typography.size.sm,
    color:      colors.gray500,
  },
  nodeBelt: {
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    marginLeft: spacing.sm + 10,
  },
  nodeDate: {
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    marginLeft: spacing.sm + 10,
  },

  // ── Connector ──
  connector: {
    alignItems:      "center",
    paddingLeft:     spacing.xl,
    gap:             2,
    paddingVertical: spacing.xs,
  },
  connectorLine: {
    width:           1,
    height:          6,
    backgroundColor: colors.gray300,
  },
  connectorLabel: {
    fontSize:  typography.size.xs,
    color:     colors.gray500,
    fontStyle: "italic",
  },
  connectorArrow: {
    fontSize: typography.size.xs,
    color:    colors.primary,
  },

  // ── Loading ──
  loadingNode: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color:    colors.gray500,
  },
});
