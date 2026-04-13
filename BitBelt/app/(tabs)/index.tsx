import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Theme } from "@/constants/Theme";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

/**
 * HomeScreen — BitBelt entry point.
 *
 * Presents branding, a brief value proposition, and a sleek
 * "Connect Wallet" CTA wired to Thirdweb SDK v5.
 *
 * Accessibility (Priority 1): status-bar contrast, semantic roles.
 * Touch Targets (Priority 2): all interactive elements ≥ 44 × 44 px.
 */
export default function HomeScreen() {
  const [connecting, setConnecting] = useState(false);

  // TODO: Replace with useConnect() from thirdweb/react once ThirdwebProvider
  // is wired up in app/_layout.tsx.
  const handleConnectWallet = async () => {
    setConnecting(true);
    // Placeholder: integrate Thirdweb inAppWallet + smartWallet here.
    setTimeout(() => setConnecting(false), 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.container}>

        {/* ── Brand lockup ── */}
        <View style={styles.brandSection}>
          <View style={styles.logoMark}>
            <Text style={styles.logoGlyph}>🥋</Text>
          </View>
          <Text style={styles.appName}>BitBelt</Text>
          <Text style={styles.tagline}>
            Blockchain BJJ Belt Verification
          </Text>
        </View>

        {/* ── Value-prop cards ── */}
        <View style={styles.featureGrid}>
          <FeaturePill icon="🔗" label="On-Chain Lineage" />
          <FeaturePill icon="⛽" label="Gasless Promotions" />
          <FeaturePill icon="🏅" label="Soulbound Tokens" />
          <FeaturePill icon="🔐" label="Base Network" />
        </View>

        {/* ── Connect Wallet CTA ── */}
        <View style={styles.ctaSection}>
          <Pressable
            style={({ pressed }) => [
              styles.connectButton,
              pressed && styles.connectButtonPressed,
              connecting && styles.connectButtonLoading,
            ]}
            onPress={handleConnectWallet}
            disabled={connecting}
            accessibilityRole="button"
            accessibilityLabel="Connect your wallet to BitBelt"
            hitSlop={touchTarget.minHitSlop}
          >
            <Text style={styles.connectButtonText}>
              {connecting ? "Connecting…" : "Connect Wallet"}
            </Text>
          </Pressable>

          <Text style={styles.legalNote}>
            Powered by Thirdweb · Account Abstraction · Base
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

// ── Small internal helper component ────────────────────────────────────────
function FeaturePill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing["2xl"],
    justifyContent: "space-between",
    paddingTop: spacing["4xl"],
    paddingBottom: spacing["3xl"],
  },

  // Brand lockup
  brandSection: {
    alignItems: "center",
    gap: spacing.md,
  },

  logoMark: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    ...shadow.md,
  },

  logoGlyph: {
    fontSize: 40,
  },

  appName: {
    fontSize: typography.size["2xl"],
    fontWeight: typography.weight.extrabold,
    color: colors.primary,
    letterSpacing: -1,
  },

  tagline: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.regular,
    color: colors.gray500,
    textAlign: "center",
    lineHeight: typography.size.base * typography.lineHeight.normal,
  },

  // Feature pills grid
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    gap: spacing.xs,
  },

  pillIcon: {
    fontSize: typography.size.sm,
  },

  pillLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.gray700,
  },

  // CTA section
  ctaSection: {
    alignItems: "center",
    gap: spacing.base,
  },

  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: touchTarget.minSize + 8,   // 52 px — comfortably above 44 minimum
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.primary,
  },

  connectButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },

  connectButtonLoading: {
    backgroundColor: colors.primaryLight,
  },

  connectButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },

  legalNote: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    textAlign: "center",
  },
});
