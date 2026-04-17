/**
 * promote.tsx — Promotion Form Screen
 *
 * Allows an instructor with INSTRUCTOR_ROLE to mint a belt SBT to a student.
 * Supports grandfathered promotions via a date picker (past dates accepted
 * by the contract's officialTimestamp parameter).
 */

import React, { useState, useRef } from "react";
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
import DateStepPicker from "@/components/DateStepPicker";
import { useRouter } from "expo-router";
import { useActiveAccount, useDisconnect, useSendTransaction } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { Theme } from "@/constants/Theme";
import { chain, sbtContract, wallet } from "@/constants/BitBelt";
import { useStudents } from "@/hooks/useStudents";
import type { Student } from "@/hooks/useStudents";

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
  const { search } = useStudents();

  const handleSignOut = () => {
    disconnect(wallet);
    router.replace("/(tabs)");
  };

  // ── Form state ──────────────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBelt, setSelectedBelt] = useState<BeltColor>("Blue");
  const [promotionDate, setPromotionDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const today = new Date();

  const studentAddress = selectedStudent?.address ?? "";

  // ── Student search handlers ──────────────────────────────────────────────────
  const handleNameChange = (text: string) => {
    setNameQuery(text);
    setSelectedStudent(null);
    const results = search(text);
    setSuggestions(results);
    setShowSuggestions(results.length > 0 && text.length > 0);
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setNameQuery(student.name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // ── Address validation ───────────────────────────────────────────────────────
  const addressValid = isValidAddress(studentAddress);

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
            <Pressable
              onPress={() => router.back()}
              hitSlop={touchTarget.minHitSlop}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <Text style={styles.iconButtonText}>←</Text>
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.screenTitle}>Issue Certificate</Text>
              <Text style={styles.screenSubtitle}>BELT PROMOTION</Text>
            </View>
            <Pressable
              onPress={handleSignOut}
              hitSlop={touchTarget.minHitSlop}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
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

          {/* ── Student Search ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECIPIENT</Text>

            {/* Name search input */}
            <View style={[styles.inputContainer, selectedStudent && styles.inputContainerValid]}>
              <TextInput
                style={styles.input}
                placeholder="Search student name…"
                placeholderTextColor={colors.gray500}
                value={nameQuery}
                onChangeText={handleNameChange}
                autoCorrect={false}
                autoCapitalize="words"
                accessibilityLabel="Student name search"
                returnKeyType="search"
              />
              {selectedStudent && (
                <View style={[styles.validationDot, styles.validationDotOk]} />
              )}
            </View>

            {/* Autocomplete dropdown */}
            {showSuggestions && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => handleSelectStudent(s)}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      pressed && styles.suggestionRowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${s.name}`}
                  >
                    <View style={styles.suggestionAvatar}>
                      <Text style={styles.suggestionAvatarText}>
                        {s.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.suggestionMeta}>
                      <Text style={styles.suggestionName}>{s.name}</Text>
                      <Text style={styles.suggestionAddress}>
                        {s.address.slice(0, 8)}…{s.address.slice(-6)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* No results hint */}
            {nameQuery.length > 0 && suggestions.length === 0 && !selectedStudent && (
              <Text style={styles.fieldError}>
                No students found — add them in the Students registry first.
              </Text>
            )}

            {/* Resolved wallet address chip */}
            {selectedStudent && (
              <View style={styles.resolvedAddress}>
                <Text style={styles.resolvedAddressLabel}>Wallet</Text>
                <Text style={styles.resolvedAddressValue} selectable numberOfLines={1}>
                  {selectedStudent.address}
                </Text>
              </View>
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

            <DateStepPicker
              visible={showPicker}
              value={promotionDate}
              maximumDate={today}
              onConfirm={(d) => setPromotionDate(d)}
              onClose={() => setShowPicker(false)}
            />
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
                {selectedStudent ? selectedStudent.name : "—"}
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

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonPressed: {
    backgroundColor: colors.surfaceAlt,
  },

  iconButtonText: {
    fontSize: typography.size.lg,
    color: colors.gray900,
    fontWeight: typography.weight.bold,
  },

  signOutText: {
    fontSize: typography.size.xs,
    color: colors.gray700,
    fontWeight: typography.weight.semibold,
  },

  headerText: {
    flex: 1,
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

  // ── Student autocomplete ──
  suggestionsBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    overflow: "hidden",
    ...shadow.sm,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  suggestionRowPressed: {
    backgroundColor: colors.primaryMuted,
  },
  suggestionAvatar: {
    width: 36, height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center", justifyContent: "center",
  },
  suggestionAvatarText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  suggestionMeta: { flex: 1 },
  suggestionName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.gray900,
  },
  suggestionAddress: {
    fontSize: typography.size.xs,
    color: colors.gray500,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  resolvedAddress: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  resolvedAddressLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.success,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resolvedAddressValue: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.gray700,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
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
