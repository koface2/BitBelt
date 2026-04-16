import React, { useState, useEffect } from "react";
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
import { preAuthenticate } from "thirdweb/wallets";
import { Theme } from "@/constants/Theme";
import { client, chain, sbtContract, INSTRUCTOR_ROLE, wallet } from "@/constants/BitBelt";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ── Screen ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const account = useActiveAccount();
  const { connect, isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();

  // Email auth state
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // ── Redirect to main app once connected ──────────────────────────────────
  // useEffect handles the async case (AutoConnect reconnecting on load).
  useEffect(() => {
    if (account) {
      router.replace("/dashboard");
    }
  }, [account]);

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

  const connectEmail = async () => {
    if (!otpSent) {
      // Step 1: send verification code
      if (!email.trim()) return;
      setIsSendingOtp(true);
      try {
        await preAuthenticate({ client, strategy: "email", email: email.trim() });
        setOtpSent(true);
      } finally {
        setIsSendingOtp(false);
      }
    } else {
      // Step 2: connect with the code
      if (!otp.trim()) return;
      connect(async () => {
        await wallet.connect({ client, strategy: "email", email: email.trim(), verificationCode: otp.trim() });
        return wallet;
      });
    }
  };

  const handleDisconnect = () => {
    disconnect(wallet);
    setShowEmailInput(false);
    setEmail("");
    setOtpSent(false);
    setOtp("");
  };

  // ── Derived display values ────────────────────────────────────────────────
  const shortAddress = account
    ? `${account.address.slice(0, 6)}…${account.address.slice(-4)}`
    : null;

  // All hooks are above — safe to early-return now.
  // Show a blank screen while useEffect redirect fires to avoid login flash.
  if (account) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} />;
  }

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
              <Text style={styles.appSubtitle}>BJJ Certificate & Lineage Registry</Text>
            </View>
          </View>

          {/* ── Status card (Fintech-style data card) ── */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>SERVICE</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>Verified & Secure</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>ACCOUNT</Text>
              {account ? (
                <Text style={styles.statusValue} numberOfLines={1}>
                  {shortAddress}
                </Text>
              ) : (
                <Text style={styles.statusValueMuted}>Not signed in</Text>
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
            <FeatureTile value="Certified" label="Belt Records" />
            <FeatureTile value="Free" label="No Fees Ever" />
            <FeatureTile value="Permanent" label="Belt Lineage" />
            <FeatureTile value="Verified" label="Tamper-Proof" />
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
                ) : !otpSent ? (
                  // Step 1 — enter email
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
                        (isSendingOtp || !email.trim()) && styles.primaryButtonLoading,
                      ]}
                      onPress={connectEmail}
                      disabled={isSendingOtp || !email.trim()}
                      accessibilityRole="button"
                      accessibilityLabel="Send code"
                    >
                      {isSendingOtp ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>→</Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  // Step 2 — enter OTP
                  <View style={styles.emailInputRow}>
                    <TextInput
                      style={styles.emailInput}
                      placeholder="6-digit code"
                      placeholderTextColor={colors.gray500}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      accessibilityLabel="Verification code"
                      returnKeyType="go"
                      onSubmitEditing={connectEmail}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        styles.emailSubmitButton,
                        pressed && styles.primaryButtonPressed,
                        (isConnecting || !otp.trim()) && styles.primaryButtonLoading,
                      ]}
                      onPress={connectEmail}
                      disabled={isConnecting || !otp.trim()}
                      accessibilityRole="button"
                      accessibilityLabel="Verify code"
                    >
                      {isConnecting ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Go</Text>
                      )}
                    </Pressable>
                  </View>
                )}

                {connectError ? (
                  <Text style={styles.errorNote}>
                    {connectError.message ?? "Connection failed. Check your network and try again."}
                  </Text>
                ) : (
                  <Text style={styles.legalNote}>
                    Free to use · Certificates secured by blockchain
                  </Text>
                )}
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
                    accessibilityLabel="Go to My Certificates"
                    hitSlop={touchTarget.minHitSlop}
                  >
                    <Text style={styles.primaryButtonText}>
                      View My Certificates
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleDisconnect}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out"
                  hitSlop={touchTarget.minHitSlop}
                >
                  <Text style={styles.secondaryButtonText}>Sign Out</Text>
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

  errorNote: {
    fontSize: typography.size.xs,
    color: colors.error,
    textAlign: "center",
    paddingTop: spacing.xs,
  },
});
