import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useActiveAccount, useConnect, useDisconnect, useReadContract } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { Theme } from "@/constants/Theme";
import { client, chain, sbtContract, INSTRUCTOR_ROLE } from "@/constants/BitBelt";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ── Wallet factory (module-level — safe to reuse across renders) ────────────
// inAppWallet with smartAccount enables gasless ERC-4337 transactions via
// Thirdweb Paymaster on Base Sepolia. The app user never sees gas.
const wallet = inAppWallet({
  smartAccount: {
    chain,
    sponsorGas: true,
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const account = useActiveAccount();
  const { connect, isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  // Email auth state
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");

  // ── On-chain instructor role check ───────────────────────────────────────
  const { data: isInstructor } = useReadContract({
    contract: sbtContract,
    method: "function hasRole(bytes32 role, address account) view returns (bool)",
    params: [INSTRUCTOR_ROLE, account?.address ?? "0x0000000000000000000000000000000000000000"],
    queryOptions: { enabled: !!account },
  });

  // ── Connect handlers ─────────────────────────────────────────────────────
  const connectGoogle = () => {
    connect(async () => {
      await wallet.connect({ client, strategy: "google" });
      return wallet;
    });
  };

  const connectEmail = () => {
    if (!email.trim()) return;
    connect(async () => {
      await wallet.connect({ client, strategy: "email", email: email.trim() });
      return wallet;
    });
  };

  const handleDisconnect = () => {
    disconnect(wallet);
    setShowEmailInput(false);
    setEmail("");
  };

  // ── Derived display values ────────────────────────────────────────────────
  const shortAddress = account
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>

          {/* ── Brand header ── */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoInitials}>BB</Text>
            </View>
            <View>
              <Text style={styles.appName}>BitBelt</Text>
              <Text style={styles.appSubtitle}>BJJ Verification Protocol</Text>
            </View>
          </View>

          {/* ── Status card (Fintech-style data card) ── */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>NETWORK</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>Base Sepolia</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>WALLET</Text>
              {account ? (
                <Text style={styles.statusValue} numberOfLines={1}>
                  {shortAddress}
                </Text>
              ) : (
                <Text style={styles.statusValueMuted}>Not connected</Text>
              )}
            </View>

            {account && (
              <>
                <View style={styles.divider} />
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>ROLE</Text>
                  <View style={[styles.roleBadge, isInstructor ? styles.roleBadgeInstructor : styles.roleBadgeStudent]}>
                    <Text style={[styles.roleBadgeText, isInstructor ? styles.roleBadgeTextInstructor : styles.roleBadgeTextStudent]}>
                      {isInstructor === undefined ? "Checking…" : isInstructor ? "Instructor" : "Student"}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* ── Feature pillars (2 × 2 grid, Fintech data tiles) ── */}
          <View style={styles.featureGrid}>
            <FeatureTile value="ERC-721" label="Soulbound Token" />
            <FeatureTile value="ERC-4337" label="Gasless Txns" />
            <FeatureTile value="On-Chain" label="Belt Lineage" />
            <FeatureTile value="Base" label="L2 Network" />
          </View>

          {/* ── Auth / action section ── */}
          <View style={styles.ctaSection}>
            {!account ? (
              // ── Not connected ──────────────────────────────────
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                    isConnecting && styles.primaryButtonLoading,
                  ]}
                  onPress={connectGoogle}
                  disabled={isConnecting}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Google"
                  hitSlop={touchTarget.minHitSlop}
                >
                  {isConnecting && !showEmailInput ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue with Google</Text>
                  )}
                </Pressable>

                {!showEmailInput ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setShowEmailInput(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with email"
                    hitSlop={touchTarget.minHitSlop}
                  >
                    <Text style={styles.secondaryButtonText}>Continue with Email</Text>
                  </Pressable>
                ) : (
                  <View style={styles.emailInputRow}>
                    <TextInput
                      style={styles.emailInput}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.gray500}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      accessibilityLabel="Email address"
                      returnKeyType="go"
                      onSubmitEditing={connectEmail}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.emailSubmitButton,
                        pressed && styles.primaryButtonPressed,
                        (isConnecting || !email.trim()) && styles.primaryButtonLoading,
                      ]}
                      onPress={connectEmail}
                      disabled={isConnecting || !email.trim()}
                      accessibilityRole="button"
                      accessibilityLabel="Sign in"
                    >
                      {isConnecting ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Go</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                <Text style={styles.legalNote}>
                  Gasless · Powered by Thirdweb AA · Base
                </Text>
              </>
            ) : (
              // ── Connected ─────────────────────────────────────
              <>
                {isInstructor && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.primaryButtonInstructor,
                      pressed && styles.primaryButtonPressed,
                    ]}
                    onPress={() => router.push("/modal")}
                    accessibilityRole="button"
                    accessibilityLabel="Proceed to BitBelt Dashboard"
                    hitSlop={touchTarget.minHitSlop}
                  >
                    <Text style={styles.primaryButtonText}>
                      Proceed to BitBelt Dashboard
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleDisconnect}
                  accessibilityRole="button"
                  accessibilityLabel="Disconnect wallet"
                  hitSlop={touchTarget.minHitSlop}
                >
                  <Text style={styles.secondaryButtonText}>Disconnect</Text>
                </Pressable>
              </>
            )}
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Feature tile (Fintech data card) ────────────────────────────────────────
function FeatureTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },

  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["3xl"],
    paddingBottom: spacing["3xl"],
    gap: spacing["2xl"],
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },

  logoMark: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.primary,
  },

  logoInitials: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.extrabold,
    color: colors.onPrimary,
    letterSpacing: 1,
  },

  appName: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.extrabold,
    color: colors.gray900,
    letterSpacing: -0.5,
  },

  appSubtitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.gray500,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Status card (Fintech data card) ──
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gray300,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    gap: spacing.base,
    ...shadow.sm,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  statusValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray900,
    fontVariant: ["tabular-nums"],
  },

  statusValueMuted: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
    color: colors.gray500,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  statusBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.success,
  },

  roleBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },

  roleBadgeInstructor: {
    backgroundColor: colors.primaryMuted,
  },

  roleBadgeStudent: {
    backgroundColor: colors.surfaceAlt,
  },

  roleBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  roleBadgeTextInstructor: {
    color: colors.primary,
  },

  roleBadgeTextStudent: {
    color: colors.gray700,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray300,
  },

  // ── Feature 2×2 grid ──
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  tile: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray300,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },

  tileValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.3,
  },

  tileLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── CTA section ──
  ctaSection: {
    gap: spacing.sm,
    marginTop: "auto",
  },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: touchTarget.minSize + 8,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.primary,
  },

  primaryButtonInstructor: {
    backgroundColor: colors.primaryDark,
  },

  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  primaryButtonLoading: {
    opacity: 0.6,
  },

  primaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onPrimary,
    letterSpacing: 0.2,
  },

  secondaryButton: {
    borderRadius: radius.lg,
    height: touchTarget.minSize + 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.background,
  },

  secondaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.gray700,
  },

  emailInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  emailInput: {
    flex: 1,
    height: touchTarget.minSize + 8,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: spacing.base,
    fontSize: typography.size.base,
    color: colors.gray900,
    backgroundColor: colors.surface,
  },

  emailSubmitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    width: touchTarget.minSize + 8,
    height: touchTarget.minSize + 8,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.primary,
  },

  legalNote: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    textAlign: "center",
    paddingTop: spacing.xs,
  },
});

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
