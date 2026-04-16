/**
 * promote.tsx — Promotion Form Screen
 *
 * Allows an instructor with INSTRUCTOR_ROLE to mint a belt SBT to a student.
 * Supports grandfathered promotions via a date picker (past dates accepted
 * by the contract's officialTimestamp parameter).
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useActiveAccount, useDisconnect, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { Theme } from "@/constants/Theme";
import { chain, sbtContract, wallet } from "@/constants/BitBelt";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ── Belt options ─────────────────────────────────────────────────────────────
type BeltColor = "White" | "Blue" | "Purple" | "Brown" | "Black";

const BELTS: { label: BeltColor; bg: string; fg: string; border: string }[] = [
  { label: "White",  bg: colors.belt.white,  fg: colors.onBelt.white,  border: colors.gray300 },
  { label: "Blue",   bg: colors.belt.blue,   fg: colors.onBelt.blue,   border: colors.belt.blue },
  { label: "Purple", bg: colors.belt.purple, fg: colors.onBelt.purple, border: colors.belt.purple },
  { label: "Brown",  bg: colors.belt.brown,  fg: colors.onBelt.brown,  border: colors.belt.brown },
  { label: "Black",  bg: colors.belt.black,  fg: colors.onBelt.black,  border: colors.belt.black },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr.trim());
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PromoteScreen() {
  const router = useRouter();
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();
  const { disconnect } = useDisconnect();

  const handleSignOut = () => {
    disconnect(wallet);
    router.replace("/(tabs)");
  };

  // ── Form state ──────────────────────────────────────────────────────────────
  const [studentAddress, setStudentAddress] = useState("");
  const [selectedBelt, setSelectedBelt] = useState<BeltColor>("Blue");
  const [promotionDate, setPromotionDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // ── Address validation ───────────────────────────────────────────────────────
  const addressTouched = studentAddress.length > 0;
  const addressValid = isValidAddress(studentAddress);

  // ── Date picker handler ──────────────────────────────────────────────────────
  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (date) setPromotionDate(date);
  };

  // ── Mint handler ─────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!account) {
      Alert.alert("Not Signed In", "Please sign in first.");
      return;
    }
    if (!addressValid) {
      Alert.alert("Invalid Address", "Please enter a valid recipient address.");
      return;
    }

    // Convert Date → unix timestamp (seconds). Contract rejects future dates.
    const officialTimestamp = BigInt(Math.floor(promotionDate.getTime() / 1000));

    const tx = prepareContractCall({
      contract: sbtContract,
      method:
        "function mintBelt(address student, string color, uint256 officialTimestamp) external returns (uint256 tokenId)",
      params: [studentAddress.trim() as `0x${string}`, selectedBelt, officialTimestamp],
    });

    sendTx(tx, {
      onSuccess: (result) => {
        Alert.alert(
          "Belt Minted!",
          `${selectedBelt} belt issued to ${studentAddress.trim().slice(0, 6)}…${studentAddress.trim().slice(-4)}.\n\nTx: ${result.transactionHash.slice(0, 12)}…`,
          [{ text: "Done", onPress: () => router.back() }]
        );
      },
      onError: (err) => {
        Alert.alert("Transaction Failed", err.message ?? "Unknown error.");
      },
    });
  };

  // ── Selected belt meta ───────────────────────────────────────────────────────
  const belt = BELTS.find((b) => b.label === selectedBelt)!;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.screenTitle}>Issue Certificate</Text>
              <Text style={styles.screenSubtitle}>BELT PROMOTION</Text>
            </View>
            <Pressable
              onPress={handleSignOut}
              hitSlop={touchTarget.minHitSlop}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Text style={styles.backIcon}>Sign Out</Text>
            </Pressable>
          </View>

          {/* ── Instructor badge ── */}
          {account && (
            <View style={styles.instructorBadge}>
              <View style={styles.instructorDot} />
              <Text style={styles.instructorBadgeText}>
                Certifying as {account.address.slice(0, 6)}…{account.address.slice(-4)}
              </Text>
            </View>
          )}

          {/* ── Student Wallet ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECIPIENT</Text>
            <View
              style={[
                styles.inputContainer,
                addressTouched && !addressValid && styles.inputContainerError,
                addressTouched && addressValid && styles.inputContainerValid,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="0x..."
                placeholderTextColor={colors.gray500}
                value={studentAddress}
                onChangeText={setStudentAddress}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                accessibilityLabel="Student wallet address"
                returnKeyType="done"
              />
              {addressTouched && (
                <View style={[styles.validationDot, addressValid ? styles.validationDotOk : styles.validationDotError]} />
              )}
            </View>
            {addressTouched && !addressValid && (
              <Text style={styles.fieldError}>Enter a valid recipient address</Text>
            )}
          </View>

          {/* ── Belt Selector ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BELT RANK</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.beltRow}
            >
              {BELTS.map((b) => {
                const isActive = selectedBelt === b.label;
                return (
                  <Pressable
                    key={b.label}
                    onPress={() => setSelectedBelt(b.label)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isActive }}
                    accessibilityLabel={`${b.label} belt`}
                    style={({ pressed }) => [
                      styles.beltChip,
                      { backgroundColor: b.bg, borderColor: b.border },
                      isActive && styles.beltChipActive,
                      isActive && { borderColor: b.border },
                      pressed && styles.beltChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.beltChipText,
                        { color: b.fg },
                        b.label === "White" && { color: colors.gray900 },
                      ]}
                    >
                      {b.label}
                    </Text>
                    {isActive && (
                      <View style={[styles.beltCheckmark, { backgroundColor: b.label === "White" ? colors.gray700 : b.fg }]}>
                        <Text style={[styles.beltCheckmarkText, b.label === "White" ? { color: colors.white } : {}]}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Belt preview strip */}
            <View style={[styles.beltPreview, { backgroundColor: belt.bg, borderColor: belt.border }]}>
              <Text style={[styles.beltPreviewText, { color: belt.fg }, selectedBelt === "White" && { color: colors.gray700 }]}>
                {selectedBelt} Belt
              </Text>
            </View>
          </View>

          {/* ── Promotion Date ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PROMOTION DATE</Text>
            <Text style={styles.fieldHint}>Past dates allowed for grandfathered promotions</Text>

            <Pressable
              onPress={() => setShowPicker(true)}
              style={({ pressed }) => [styles.dateButton, pressed && styles.dateButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Promotion date: ${formatDate(promotionDate)}`}
            >
              <View style={styles.dateButtonContent}>
                <Text style={styles.dateIcon}>📅</Text>
                <View style={styles.dateTextGroup}>
                  <Text style={styles.dateValue}>{formatDate(promotionDate)}</Text>
                  <Text style={styles.dateSub}>Tap to change</Text>
                </View>
              </View>
              <View style={styles.dateChevron}>
                <Text style={styles.dateChevronText}>›</Text>
              </View>
            </Pressable>

            {/* iOS inline picker */}
            {showPicker && Platform.OS === "ios" && (
              <View style={styles.pickerCard}>
                <DateTimePicker
                  value={promotionDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                  textColor={colors.gray900}
                />
                <Pressable
                  style={styles.pickerDoneButton}
                  onPress={() => setShowPicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm date"
                >
                  <Text style={styles.pickerDoneText}>Confirm Date</Text>
                </Pressable>
              </View>
            )}

            {/* Android picker (modal-style) */}
            {showPicker && Platform.OS === "android" && (
              <DateTimePicker
                value={promotionDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            {/* Web fallback */}
            {showPicker && Platform.OS === "web" && (
              <View style={styles.pickerCard}>
                <input
                  type="date"
                  value={promotionDate.toISOString().split("T")[0]}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    if (e.target.value) setPromotionDate(new Date(e.target.value + "T12:00:00"));
                    setShowPicker(false);
                  }}
                  style={{
                    fontSize: 16,
                    padding: 12,
                    borderRadius: radius.md,
                    border: `1px solid ${colors.gray300}`,
                    color: colors.gray900,
                    backgroundColor: colors.background,
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </View>
            )}
          </View>

          {/* ── Summary card ── */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>CERTIFICATE SUMMARY</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Belt</Text>
              <View style={[styles.summaryBeltBadge, { backgroundColor: belt.bg, borderColor: belt.border }]}>
                <Text style={[styles.summaryBeltText, { color: belt.fg }, selectedBelt === "White" && { color: colors.gray700 }]}>
                  {selectedBelt}
                </Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{formatDate(promotionDate)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Student</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {addressValid
                  ? `${studentAddress.trim().slice(0, 6)}…${studentAddress.trim().slice(-4)}`
                  : "—"}
              </Text>
            </View>
          </View>

          {/* ── Action button ── */}
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              (!addressValid || isPending) && styles.confirmButtonDisabled,
              pressed && addressValid && !isPending && styles.confirmButtonPressed,
            ]}
            onPress={handleConfirm}
            disabled={!addressValid || isPending}
            accessibilityRole="button"
            accessibilityLabel="Issue Certificate"
            hitSlop={touchTarget.minHitSlop}
          >
            {isPending ? (
              <View style={styles.confirmButtonInner}>
                <ActivityIndicator color={colors.onPrimary} size="small" />
                <Text style={styles.confirmButtonText}>Issuing Certificate…</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>Issue Certificate</Text>
            )}
          </Pressable>

          <Text style={styles.gasNote}>Free to issue · Certificates secured by blockchain</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: colors.background },

  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

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
    gap: spacing.base,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonPressed: {
    backgroundColor: colors.surfaceAlt,
  },

  backIcon: {
    fontSize: typography.size.lg,
    color: colors.gray900,
    fontWeight: typography.weight.bold,
  },

  headerText: {
    gap: 2,
  },

  screenTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.extrabold,
    color: colors.gray900,
    letterSpacing: -0.5,
  },

  screenSubtitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // ── Instructor badge ──
  instructorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },

  instructorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  instructorBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
    letterSpacing: 0.3,
  },

  // ── Section wrapper ──
  section: {
    gap: spacing.sm,
  },

  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  fieldHint: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    marginTop: -spacing.xs,
  },

  fieldError: {
    fontSize: typography.size.xs,
    color: colors.error,
    fontWeight: typography.weight.medium,
  },

  // ── Text input ──
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    paddingHorizontal: spacing.base,
    minHeight: 56,
    ...shadow.sm,
  },

  inputContainerError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },

  inputContainerValid: {
    borderColor: colors.primary,
  },

  input: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.gray900,
    paddingVertical: spacing.md,
    fontVariant: ["tabular-nums"],
  },

  validationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.sm,
  },

  validationDotOk: { backgroundColor: colors.success },
  validationDotError: { backgroundColor: colors.error },

  // ── Belt selector ──
  beltRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },

  beltChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 2,
    paddingHorizontal: spacing.base,
    minHeight: 48,
    minWidth: 80,
    justifyContent: "center",
    ...shadow.sm,
  },

  beltChipActive: {
    borderWidth: 2.5,
    ...shadow.md,
  },

  beltChipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },

  beltChipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.3,
  },

  beltCheckmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  },

  beltCheckmarkText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },

  // Belt preview strip
  beltPreview: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    alignItems: "center",
    marginTop: spacing.xs,
  },

  beltPreviewText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Date picker ──
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    paddingHorizontal: spacing.base,
    minHeight: 64,
    ...shadow.sm,
  },

  dateButtonPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },

  dateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  dateIcon: {
    fontSize: 22,
  },

  dateTextGroup: {
    gap: 2,
  },

  dateValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.gray900,
  },

  dateSub: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    fontWeight: typography.weight.regular,
  },

  dateChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  dateChevronText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    lineHeight: 22,
  },

  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gray300,
    overflow: "hidden",
    ...shadow.md,
  },

  pickerDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    alignItems: "center",
    margin: spacing.base,
    borderRadius: radius.lg,
    minHeight: 48,
    justifyContent: "center",
  },

  pickerDoneText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.onPrimary,
  },

  // ── Summary card ──
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gray300,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    gap: spacing.base,
    ...shadow.sm,
  },

  summaryTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: colors.gray300,
  },

  summaryLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.gray500,
  },

  summaryValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray900,
    fontVariant: ["tabular-nums"],
    maxWidth: "60%",
  },

  summaryBeltBadge: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },

  summaryBeltText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.3,
  },

  // ── Confirm button ──
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.primary,
  },

  confirmButtonDisabled: {
    backgroundColor: colors.gray300,
    ...shadow.sm,
  },

  confirmButtonPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },

  confirmButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  confirmButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },

  gasNote: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
