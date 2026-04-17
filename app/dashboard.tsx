/**
 * dashboard.tsx — Post-login home screen for BitBelt.
 *
 * Displays the authenticated user's identity and provides navigation tiles
 * for every major feature in the app. "Coming soon" tiles are shown for
 * features not yet built so the full product footprint is clear.
 */

import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useActiveAccount, useDisconnect, useReadContract } from "thirdweb/react";

import { Theme } from "@/constants/Theme";
import { client, chain, sbtContract, INSTRUCTOR_ROLE, DEFAULT_ADMIN_ROLE, wallet } from "@/constants/BitBelt";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavTile {
  id: string;
  icon: string;
  title: string;
  description: string;
  route?: string;      // undefined = coming soon
  primaryAction?: boolean;
  instructorOnly?: boolean;
}

// ─── Navigation tiles ─────────────────────────────────────────────────────────

const TILES: NavTile[] = [
  {
    id: "issue",
    icon: "🥋",
    title: "Issue Official Rank",
    description: "Certify a student's belt promotion on-chain with a Soulbound Token.",
    route: "/issue-certification",
    primaryAction: true,
    instructorOnly: true,
  },
  {
    id: "promote",
    icon: "📋",
    title: "Promote a Student",
    description: "Open the promotion form to record a grandfathered or live ceremony.",
    route: "/promote",
    instructorOnly: true,
  },
  {
    id: "students",
    icon: "👥",
    title: "Manage Students",
    description: "Add students to the registry and generate test accounts for the promotion flow.",
    route: "/students",
    instructorOnly: true,
  },
  {
    id: "my-certs",
    icon: "🏅",
    title: "My Certificates",
    description: "View all belt SBTs issued to your wallet and share your lineage.",
    route: undefined, // coming soon
  },
  {
    id: "verify",
    icon: "🔍",
    title: "Verify a Certificate",
    description: "Check the authenticity of any belt certification by token ID or wallet.",
    route: undefined, // coming soon
  },
  {
    id: "lineage",
    icon: "🌳",
    title: "View Lineage",
    description: "Explore the full instructor-to-student promotion tree on the blockchain.",
    route: undefined, // coming soon
  },
  {
    id: "profile",
    icon: "👤",
    title: "My Profile",
    description: "Manage your instructor details, school name, and public display settings.",
    route: undefined, // coming soon
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router  = useRouter();
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();

  // Print full smart account address for admin copy-paste
  React.useEffect(() => {
    if (account?.address) {
      // eslint-disable-next-line no-console
      console.log("[BitBelt] Smart account address:", account.address);
    }
  }, [account?.address]);

  // On-chain instructor role check
  const { data: isInstructor } = useReadContract({
    contract: sbtContract,
    method: "function hasRole(bytes32 role, address account) view returns (bool)",
    params: [
      INSTRUCTOR_ROLE,
      (account?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    ],
    queryOptions: { enabled: !!account },
  });

  // On-chain admin role check (DEFAULT_ADMIN_ROLE = bytes32(0))
  const { data: isAdmin } = useReadContract({
    contract: sbtContract,
    method: "function hasRole(bytes32 role, address account) view returns (bool)",
    params: [
      DEFAULT_ADMIN_ROLE,
      (account?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    ],
    queryOptions: { enabled: !!account },
  });

  const hasInstructorAccess = isAdmin || isInstructor;

  const handleSignOut = () => {
    disconnect(wallet);
    router.replace("/(tabs)");
  };

  const handleTilePress = (tile: NavTile) => {
    if (tile.route) {
      router.push(tile.route as any);
    }
  };

  const shortAddress = account
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : "";

  // Full address for display
  const fullAddress = account?.address ?? "";

  // Copy to clipboard handler
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    if (!fullAddress) return;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      setCopied(false);
    }
  };

  // Split tiles: instructor-only vs public
  const instructorTiles = TILES.filter((t) => t.instructorOnly);
  const generalTiles    = TILES.filter((t) => !t.instructorOnly);

  // All hooks are above this line — safe to early-return now.
  if (!account) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <Text style={styles.brandMark}>BitBelt</Text>
            <Text style={styles.brandSub}>BJJ Certification</Text>
          </View>

          <Pressable
            onPress={handleSignOut}
            hitSlop={touchTarget.minHitSlop}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && styles.signOutBtnPressed,
            ]}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        {/* ── Identity card ─────────────────────────────────────────────── */}
        <View style={styles.identityCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarGlyph}>👤</Text>
            </View>
          </View>

          <View style={styles.identityInfo}>
            {/* Full address with copy button */}
            <View className="flex-row items-center space-x-2 mb-1">
              <Text
                selectable
                className="font-mono text-xs text-gray-700 dark:text-gray-200"
                style={{ maxWidth: 220 }}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {fullAddress}
              </Text>
              {fullAddress ? (
                <Pressable
                  onPress={handleCopy}
                  className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                  style={{ minWidth: 36 }}
                  accessibilityLabel="Copy address"
                  accessibilityRole="button"
                >
                  <Text className="text-xs text-gray-800 dark:text-gray-100">
                    {copied ? "Copied!" : "Copy"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {/* Short address below for visual continuity */}
            <Text style={styles.identityAddress}>{shortAddress}</Text>
            <View style={styles.rolePill}>
              {isAdmin ? (
                <>
                  <View style={styles.roleDot} />
                  <Text style={styles.rolePillText}>Admin</Text>
                </>
              ) : isInstructor ? (
                <>
                  <View style={styles.roleDot} />
                  <Text style={styles.rolePillText}>Instructor</Text>
                </>
              ) : (
                <>
                  <View style={[styles.roleDot, styles.roleDotStudent]} />
                  <Text style={[styles.rolePillText, styles.rolePillTextStudent]}>
                    Student
                  </Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.networkBadge}>
            <View style={styles.networkDot} />
            <Text style={styles.networkText}>Base Sepolia</Text>
          </View>
        </View>

        {/* ── Instructor / Admin actions ─────────────────────────────────── */}
        {hasInstructorAccess && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {isAdmin ? "Admin & Instructor Tools" : "Instructor Tools"}
            </Text>

            {instructorTiles.map((tile) => (
              <NavTileCard
                key={tile.id}
                tile={tile}
                onPress={() => handleTilePress(tile)}
              />
            ))}
          </View>
        )}

        {/* ── General actions ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>My Certifications</Text>

          {generalTiles.map((tile) => (
            <NavTileCard
              key={tile.id}
              tile={tile}
              onPress={() => handleTilePress(tile)}
            />
          ))}
        </View>

        <Text style={styles.footer}>
          Certificates secured by Base blockchain · Gasless for all users
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── NavTileCard component ────────────────────────────────────────────────────

function NavTileCard({
  tile,
  onPress,
}: {
  tile: NavTile;
  onPress: () => void;
}) {
  const isComingSoon = !tile.route;

  return (
    <Pressable
      onPress={onPress}
      disabled={isComingSoon}
      accessibilityRole="button"
      accessibilityLabel={tile.title}
      accessibilityState={{ disabled: isComingSoon }}
      hitSlop={touchTarget.minHitSlop}
      style={({ pressed }) => [
        styles.tile,
        tile.primaryAction && styles.tilePrimary,
        isComingSoon        && styles.tileDisabled,
        pressed && !isComingSoon && (tile.primaryAction
          ? styles.tilePrimaryPressed
          : styles.tilePressed),
      ]}
    >
      {/* Left: icon box */}
      <View
        style={[
          styles.tileIconBox,
          tile.primaryAction && styles.tileIconBoxPrimary,
          isComingSoon        && styles.tileIconBoxDisabled,
        ]}
      >
        <Text style={styles.tileIcon}>{tile.icon}</Text>
      </View>

      {/* Centre: text */}
      <View style={styles.tileMeta}>
        <Text
          style={[
            styles.tileTitle,
            tile.primaryAction && styles.tileTitlePrimary,
            isComingSoon        && styles.tileTitleDisabled,
          ]}
        >
          {tile.title}
        </Text>
        <Text
          style={[
            styles.tileDesc,
            isComingSoon && styles.tileDescDisabled,
          ]}
          numberOfLines={2}
        >
          {tile.description}
        </Text>
      </View>

      {/* Right: arrow or "Soon" badge */}
      {isComingSoon ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonBadgeText}>Soon</Text>
        </View>
      ) : (
        <Text
          style={[
            styles.tileChevron,
            tile.primaryAction && styles.tileChevronPrimary,
          ]}
        >
          ›
        </Text>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },

  content: {
    paddingHorizontal: spacing["2xl"],
    paddingTop:        spacing.xl,
    paddingBottom:     spacing["5xl"],
    gap:               spacing.xl,
  },

  // ── Top bar
  topBar: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
  },

  brand: { gap: 2 },

  brandMark: {
    fontSize:      typography.size.xl,
    fontWeight:    typography.weight.extrabold,
    color:         colors.gray900,
    letterSpacing: -0.5,
  },

  brandSub: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  signOutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.xs + 2,
    borderRadius:      radius.full,
    borderWidth:       1,
    borderColor:       colors.gray300,
    backgroundColor:   colors.surface,
    minHeight:         36,
    justifyContent:    "center",
  },
  signOutBtnPressed: { backgroundColor: colors.surfaceAlt },
  signOutText: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.medium,
    color:      colors.gray700,
  },

  // ── Identity card
  identityCard: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   colors.surface,
    borderRadius:      radius.xl,
    borderWidth:       1,
    borderColor:       colors.gray300,
    paddingVertical:   spacing.base,
    paddingHorizontal: spacing.base,
    gap:               spacing.md,
    ...shadow.sm,
  },

  avatarRing: {
    width:           52,
    height:          52,
    borderRadius:    26,
    borderWidth:     2,
    borderColor:     colors.primary,
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: colors.primaryMuted,
  },

  avatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.primaryMuted,
    alignItems:      "center",
    justifyContent:  "center",
  },

  avatarGlyph: { fontSize: 22 },

  identityInfo: { flex: 1, gap: 4 },

  identityAddress: {
    fontSize:    typography.size.base,
    fontWeight:  typography.weight.bold,
    color:       colors.gray900,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.3,
  },

  rolePill: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing.xs,
    alignSelf:         "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    borderRadius:      radius.full,
    backgroundColor:   colors.primaryMuted,
  },

  roleDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: colors.primary,
  },
  roleDotStudent: { backgroundColor: colors.success },

  rolePillText: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.semibold,
    color:      colors.primary,
    letterSpacing: 0.3,
  },
  rolePillTextStudent: { color: colors.success },

  networkBadge: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               4,
    paddingHorizontal: spacing.sm,
    paddingVertical:   4,
    borderRadius:      radius.full,
    backgroundColor:   colors.gray100,
    alignSelf:         "flex-start",
  },

  networkDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: colors.success,
  },

  networkText: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.medium,
    color:      colors.gray700,
    letterSpacing: 0.3,
  },

  // ── Section
  section: { gap: spacing.sm },

  sectionLabel: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom:  spacing.xs,
  },

  // ── Navigation tile
  tile: {
    flexDirection:     "row",
    alignItems:        "center",
    backgroundColor:   colors.background,
    borderRadius:      radius.xl,
    borderWidth:       1,
    borderColor:       colors.gray300,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.base,
    gap:               spacing.md,
    minHeight:         72,
    ...shadow.sm,
  },

  tilePrimary: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
    ...shadow.primary,
  },

  tileDisabled: {
    backgroundColor: colors.surface,
    borderColor:     colors.gray300,
    opacity:         0.7,
  },

  tilePressed: {
    backgroundColor: colors.surfaceAlt,
    transform:       [{ scale: 0.98 }],
  },

  tilePrimaryPressed: {
    backgroundColor: colors.primaryDark,
    transform:       [{ scale: 0.98 }],
  },

  tileIconBox: {
    width:           48,
    height:          48,
    borderRadius:    radius.lg,
    backgroundColor: colors.primaryMuted,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
  },

  tileIconBoxPrimary: { backgroundColor: "rgba(255,255,255,0.20)" },
  tileIconBoxDisabled: { backgroundColor: colors.gray100 },

  tileIcon: { fontSize: 24 },

  tileMeta: { flex: 1, gap: 3 },

  tileTitle: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.bold,
    color:      colors.gray900,
    lineHeight: typography.size.base * 1.3,
  },

  tileTitlePrimary:  { color: colors.onPrimary },
  tileTitleDisabled: { color: colors.gray500 },

  tileDesc: {
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    lineHeight: typography.size.xs * 1.5,
  },

  tileDescDisabled: { color: colors.gray300 },

  tileChevron: {
    fontSize:   typography.size.lg + 4,
    color:      colors.gray500,
    lineHeight: 30,
    flexShrink: 0,
  },

  tileChevronPrimary: { color: "rgba(255,255,255,0.70)" },

  soonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   3,
    borderRadius:      radius.full,
    backgroundColor:   colors.gray100,
    borderWidth:       1,
    borderColor:       colors.gray300,
    flexShrink:        0,
  },

  soonBadgeText: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.semibold,
    color:      colors.gray500,
    letterSpacing: 0.3,
  },

  // ── Footer
  footer: {
    textAlign:  "center",
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    lineHeight: typography.size.xs * 1.6,
    marginTop:  spacing.sm,
  },
});
