/**
 * issue-certification.tsx — Issue Official Belt Certification Screen
 *
 * Allows an instructor with INSTRUCTOR_ROLE to issue a belt rank SBT to a
 * student. The "Grandfather" logic converts the selected Effective Date into
 * a Unix timestamp so past-dated promotions are accepted by the contract.
 *
 * Features
 * ────────
 *  • Student wallet address input with live validation
 *  • Belt rank dropdown (White → Black)
 *  • Effective Date picker — past dates allowed for grandfathered promotions
 *  • Co-Promoter toggle — reveals an instructor-name text field
 *  • Gasless execution via Thirdweb Account Abstraction (sponsorGas: true)
 *  • Inline success state with high-resolution checkmark + Block Explorer link
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
  Linking,
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import {
  useActiveAccount,
  useDisconnect,
  useSendTransaction,
} from "thirdweb/react";
import { prepareContractCall } from "thirdweb";

import { Theme } from "@/constants/Theme";
import { sbtContract, wallet } from "@/constants/BitBelt";
import { useStudents } from "@/hooks/useStudents";
import type { Student } from "@/hooks/useStudents";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ─── Constants ────────────────────────────────────────────────────────────────

const BASESCAN_TX_BASE = "https://sepolia.basescan.org/tx/";

type BeltColor = "White" | "Blue" | "Purple" | "Brown" | "Black";

const BELTS: {
  label: BeltColor;
  bg: string;
  fg: string;
  border: string;
}[] = [
  { label: "White",  bg: colors.belt.white,  fg: colors.onBelt.white,  border: colors.gray300 },
  { label: "Blue",   bg: colors.belt.blue,   fg: colors.onBelt.blue,   border: colors.belt.blue },
  { label: "Purple", bg: colors.belt.purple, fg: colors.onBelt.purple, border: colors.belt.purple },
  { label: "Brown",  bg: colors.belt.brown,  fg: colors.onBelt.brown,  border: colors.belt.brown },
  { label: "Black",  bg: colors.belt.black,  fg: colors.onBelt.black,  border: colors.belt.black },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function truncateTx(hash: string): string {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function IssueCertificationScreen() {
  const router = useRouter();
  const account = useActiveAccount();
  const { mutate: sendTx, isPending } = useSendTransaction();
  const { disconnect } = useDisconnect();

  const { search } = useStudents();

  // ── Form state
  // Student search
  const [selectedStudent,  setSelectedStudent]  = useState<Student | null>(null);
  const [nameQuery,        setNameQuery]         = useState("");
  const [suggestions,      setSuggestions]       = useState<Student[]>([]);
  const [showSuggestions,  setShowSuggestions]   = useState(false);

  // Promoter ("who gave the rank") — free text + autocomplete from registry
  const [promoterQuery,    setPromoterQuery]     = useState("");
  const [promoterSelected, setPromoterSelected] = useState<Student | null>(null);
  const [promoterSuggestions, setPromoterSuggestions] = useState<Student[]>([]);
  const [showPromoterSugg, setShowPromoterSugg] = useState(false);

  // "Certifying As" — admin override of on-chain instructorAddress (mintBeltAs)
  const [certifyingAs,        setCertifyingAs]        = useState<Student | null>(null);
  const [certifyingAsQuery,   setCertifyingAsQuery]   = useState("");
  const [certifyingAsSugg,    setCertifyingAsSugg]    = useState<Student[]>([]);
  const [showCertifyingAsSugg,setShowCertifyingAsSugg] = useState(false);

  const [selectedBelt, setSelectedBelt]     = useState<BeltColor>("Blue");
  const [effectiveDate, setEffectiveDate]   = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBeltMenu, setShowBeltMenu]     = useState(false);

  // Success
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // ── Derived
  const studentAddress = selectedStudent?.address ?? "";
  const addressValid   = isValidAddress(studentAddress);
  const belt           = BELTS.find((b) => b.label === selectedBelt)!;
  const canSubmit      = addressValid && !isPending;

  // ── Student search handlers
  const handleNameChange = (text: string) => {
    setNameQuery(text);
    setSelectedStudent(null);
    const results = search(text);
    setSuggestions(results);
    setShowSuggestions(results.length > 0 && text.length > 0);
  };
  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setNameQuery(s.name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // ── Promoter search handlers
  const handlePromoterChange = (text: string) => {
    setPromoterQuery(text);
    setPromoterSelected(null);
    const results = search(text);
    setPromoterSuggestions(results);
    setShowPromoterSugg(results.length > 0 && text.length > 0);
  };
  const handleSelectPromoter = (s: Student) => {
    setPromoterSelected(s);
    setPromoterQuery(s.name);
    setPromoterSuggestions([]);
    setShowPromoterSugg(false);
  };

  // ── "Certifying As" handlers
  const handleCertifyingAsChange = (text: string) => {
    setCertifyingAsQuery(text);
    setCertifyingAs(null);
    const results = search(text);
    setCertifyingAsSugg(results);
    setShowCertifyingAsSugg(results.length > 0 && text.length > 0);
  };
  const handleSelectCertifyingAs = (s: Student) => {
    setCertifyingAs(s);
    setCertifyingAsQuery(s.name);
    setCertifyingAsSugg([]);
    setShowCertifyingAsSugg(false);
  };
  const handleClearCertifyingAs = () => {
    setCertifyingAs(null);
    setCertifyingAsQuery("");
    setCertifyingAsSugg([]);
    setShowCertifyingAsSugg(false);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSignOut = () => {
    disconnect(wallet);
    router.replace("/(tabs)");
  };

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setEffectiveDate(date);
  };

  const handleIssue = () => {
    if (!account || !addressValid) return;
    setTxError(null);

    const officialTimestamp = BigInt(
      Math.floor(effectiveDate.getTime() / 1000)
    );

    // If admin has chosen to certify as a specific instructor, use mintBeltAs
    // so the on-chain instructorAddress reflects that wallet.
    const tx = certifyingAs
      ? prepareContractCall({
          contract: sbtContract,
          method:
            "function mintBeltAs(address student, string color, uint256 officialTimestamp, address instructor) external returns (uint256 tokenId)",
          params: [
            studentAddress as `0x${string}`,
            selectedBelt,
            officialTimestamp,
            certifyingAs.address,
          ],
        })
      : prepareContractCall({
          contract: sbtContract,
          method:
            "function mintBelt(address student, string color, uint256 officialTimestamp) external returns (uint256 tokenId)",
          params: [
            studentAddress as `0x${string}`,
            selectedBelt,
            officialTimestamp,
          ],
        });

    sendTx(tx, {
      onSuccess: (result) => {
        setTxHash(result.transactionHash);
      },
      onError: (err) => {
        setTxError(err.message ?? "Transaction failed. Please try again.");
      },
    });
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setNameQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setPromoterQuery("");
    setPromoterSelected(null);
    setPromoterSuggestions([]);
    setShowPromoterSugg(false);
    setCertifyingAs(null);
    setCertifyingAsQuery("");
    setCertifyingAsSugg([]);
    setShowCertifyingAsSugg(false);
    setSelectedBelt("Blue");
    setEffectiveDate(new Date());
    setTxHash(null);
    setTxError(null);
  };

  // ── Success state ──────────────────────────────────────────────────────────

  if (txHash) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ScrollView
          contentContainerStyle={styles.successContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* High-resolution checkmark */}
          <View style={styles.checkRing}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkGlyph}>✓</Text>
            </View>
          </View>

          <Text style={styles.successHeading}>Rank Officially Issued</Text>
          <Text style={styles.successBody}>
            The belt certification has been permanently recorded on
            Base Sepolia and cannot be altered or revoked.
          </Text>

          {/* Cert summary pill */}
          <View style={styles.certCard}>
            <View
              style={[
                styles.certBeltBadge,
                { backgroundColor: belt.bg, borderColor: belt.border },
              ]}
            >
              <Text
                style={[
                  styles.certBeltText,
                  { color: belt.fg },
                  selectedBelt === "White" && { color: colors.gray700 },
                ]}
              >
                {selectedBelt} Belt
              </Text>
            </View>
            <Text style={styles.certRecipient}>
              {selectedStudent ? selectedStudent.name : studentAddress.slice(0, 6) + "…" + studentAddress.slice(-4)}
            </Text>
            <Text style={styles.certDate}>{formatDate(effectiveDate)}</Text>
            {promoterQuery.length > 0 && (
              <Text style={styles.certCoPromoter}>
                Promoted by {promoterQuery}
              </Text>
            )}
            {certifyingAs && (
              <Text style={styles.certCoPromoter}>
                On-chain instructor: {certifyingAs.name}
              </Text>
            )}
          </View>

          {/* Transaction hash row */}
          <View style={styles.txRow}>
            <Text style={styles.txLabel}>Transaction</Text>
            <Text style={styles.txHash} numberOfLines={1}>
              {truncateTx(txHash)}
            </Text>
          </View>

          {/* Block explorer — subtle text button */}
          <Pressable
            onPress={() => Linking.openURL(`${BASESCAN_TX_BASE}${txHash}`)}
            accessibilityRole="link"
            accessibilityLabel="View transaction on BaseScan block explorer"
            style={({ pressed }) => [
              styles.explorerLink,
              pressed && styles.explorerLinkPressed,
            ]}
            hitSlop={touchTarget.minHitSlop}
          >
            <Text style={styles.explorerLinkText}>View on Block Explorer ↗</Text>
          </Pressable>

          {/* Issue another */}
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Issue another certification"
          >
            <Text style={styles.primaryBtnText}>Issue Another Certification</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

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

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={touchTarget.minHitSlop}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && styles.iconBtnPressed,
              ]}
            >
              <Text style={styles.iconBtnGlyph}>‹</Text>
            </Pressable>

            <View style={styles.headerLabels}>
              <Text style={styles.screenTitle}>Issue Official Rank</Text>
              <Text style={styles.screenSubtitle}>Belt Certification</Text>
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

          {/* ── Instructor badge ────────────────────────────────────────────── */}
          {account && (
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>
                Certifying as {certifyingAs ? certifyingAs.name : `${account.address.slice(0, 6)}…${account.address.slice(-4)}`}
              </Text>
            </View>
          )}

          {/* ── Card: Certifying As (admin override) ─────────────────── */}
          <View style={[styles.card, styles.adminCard]}>
            <View style={styles.adminCardHeader}>
              <Text style={styles.adminBadge}>⚙ ADMIN</Text>
              <Text style={styles.cardLabel}>Certifying As</Text>
            </View>
            <Text style={styles.cardHint}>
              Override the on-chain instructor address. Leave blank to use your own wallet.
            </Text>

            <View style={[styles.inputWrap, certifyingAs && styles.inputWrapValid]}>
              <TextInput
                style={styles.input}
                placeholder="Search instructor by name…"
                placeholderTextColor={colors.gray500}
                value={certifyingAsQuery}
                onChangeText={handleCertifyingAsChange}
                autoCorrect={false}
                autoCapitalize="words"
                accessibilityLabel="Certify as instructor"
                returnKeyType="search"
              />
              {certifyingAs && (
                <Pressable onPress={handleClearCertifyingAs} hitSlop={touchTarget.minHitSlop}>
                  <Text style={styles.clearBtn}>✕</Text>
                </Pressable>
              )}
            </View>

            {showCertifyingAsSugg && (
              <View style={styles.suggestionsBox}>
                {certifyingAsSugg.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => handleSelectCertifyingAs(s)}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      pressed && styles.suggestionRowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Certify as ${s.name}`}
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

            {certifyingAs && (
              <View style={styles.resolvedChip}>
                <Text style={styles.resolvedChipLabel}>Wallet</Text>
                <Text style={styles.resolvedChipValue} selectable numberOfLines={1}>
                  {certifyingAs.address}
                </Text>
              </View>
            )}
          </View>

          {/* ── Card: Student ─────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Student</Text>
            <Text style={styles.cardHint}>
              Search by name — add students in the Student Registry first
            </Text>

            <View style={[styles.inputWrap, selectedStudent && styles.inputWrapValid]}>
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
                <View style={[styles.validDot, styles.validDotOk]} />
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

            {/* No results */}
            {nameQuery.length > 0 && suggestions.length === 0 && !selectedStudent && (
              <Text style={styles.fieldError}>
                No students found — add them in the Student Registry first.
              </Text>
            )}

            {/* Resolved address chip */}
            {selectedStudent && (
              <View style={styles.resolvedChip}>
                <Text style={styles.resolvedChipLabel}>Wallet</Text>
                <Text style={styles.resolvedChipValue} selectable numberOfLines={1}>
                  {selectedStudent.address}
                </Text>
              </View>
            )}
          </View>

          {/* ── Card: Belt Rank ──────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Belt Rank</Text>
            <Text style={styles.cardHint}>
              Rank being officially certified and recorded on-chain
            </Text>

            {/* Dropdown trigger */}
            <Pressable
              onPress={() => setShowBeltMenu(true)}
              style={({ pressed }) => [
                styles.dropTrigger,
                pressed && styles.dropTriggerPressed,
              ]}
              accessibilityRole="combobox"
              accessibilityLabel={`Belt rank: ${selectedBelt}`}
            >
              <View style={styles.dropTriggerLeft}>
                <View
                  style={[
                    styles.beltSwatch,
                    { backgroundColor: belt.bg, borderColor: belt.border },
                  ]}
                />
                <Text style={styles.dropTriggerText}>{selectedBelt} Belt</Text>
              </View>
              <Text style={styles.dropChevron}>›</Text>
            </Pressable>

            {/* Belt rank modal */}
            <Modal
              visible={showBeltMenu}
              transparent
              animationType="fade"
              onRequestClose={() => setShowBeltMenu(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowBeltMenu(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={styles.dropMenu}>
                      <Text style={styles.dropMenuTitle}>Choose Belt Rank</Text>

                      {BELTS.map((b, i) => {
                        const isSelected = selectedBelt === b.label;
                        return (
                          <Pressable
                            key={b.label}
                            onPress={() => {
                              setSelectedBelt(b.label);
                              setShowBeltMenu(false);
                            }}
                            style={({ pressed }) => [
                              styles.dropOption,
                              i < BELTS.length - 1 && styles.dropOptionBorder,
                              isSelected && styles.dropOptionSelected,
                              pressed   && styles.dropOptionPressed,
                            ]}
                            accessibilityRole="menuitem"
                            accessibilityState={{ selected: isSelected }}
                            accessibilityLabel={`${b.label} belt`}
                          >
                            <View
                              style={[
                                styles.dropSwatch,
                                { backgroundColor: b.bg, borderColor: b.border },
                              ]}
                            />
                            <Text
                              style={[
                                styles.dropOptionText,
                                isSelected && styles.dropOptionTextSelected,
                              ]}
                            >
                              {b.label} Belt
                            </Text>
                            {isSelected && (
                              <Text style={styles.dropCheck}>✓</Text>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>

          {/* ── Card: Effective Date ─────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Effective Date</Text>
            <Text style={styles.cardHint}>
              Past dates accepted for grandfathered promotions
            </Text>

            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [
                styles.dateBtn,
                pressed && styles.dateBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Effective date: ${formatDate(effectiveDate)}`}
            >
              <View style={styles.dateBtnLeft}>
                <View style={styles.dateIconBox}>
                  <Text style={styles.dateIconGlyph}>📅</Text>
                </View>
                <View>
                  <Text style={styles.dateValue}>{formatDate(effectiveDate)}</Text>
                  <Text style={styles.dateSub}>Tap to change</Text>
                </View>
              </View>
              <Text style={styles.dateChevron}>›</Text>
            </Pressable>

            {/* iOS inline spinner */}
            {showDatePicker && Platform.OS === "ios" && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={effectiveDate}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                  textColor={colors.gray900}
                />
                <Pressable
                  style={styles.pickerConfirm}
                  onPress={() => setShowDatePicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm date selection"
                >
                  <Text style={styles.pickerConfirmText}>Confirm</Text>
                </Pressable>
              </View>
            )}

            {/* Android modal picker */}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={effectiveDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}

            {/* Web native date input */}
            {showDatePicker && Platform.OS === "web" && (
              <View style={styles.pickerWrap}>
                <input
                  type="date"
                  value={effectiveDate.toISOString().split("T")[0]}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    if (e.target.value)
                      setEffectiveDate(new Date(e.target.value + "T12:00:00"));
                    setShowDatePicker(false);
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

          {/* ── Card: Promoted By ────────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Promoted By</Text>
            <Text style={styles.cardHint}>
              Search a student name or type any instructor name — for display purposes
            </Text>

            <View style={[styles.inputWrap, promoterSelected && styles.inputWrapValid]}>
              <TextInput
                style={styles.input}
                placeholder="Search or type instructor name…"
                placeholderTextColor={colors.gray500}
                value={promoterQuery}
                onChangeText={handlePromoterChange}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                accessibilityLabel="Promoter name"
              />
              {promoterSelected && (
                <View style={[styles.validDot, styles.validDotOk]} />
              )}
            </View>

            {/* Autocomplete dropdown */}
            {showPromoterSugg && (
              <View style={styles.suggestionsBox}>
                {promoterSuggestions.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => handleSelectPromoter(s)}
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
          </View>

          {/* ── Card: Summary ────────────────────────────────────────────── */}
          <View style={[styles.card, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>Certification Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Rank</Text>
              <View
                style={[
                  styles.summaryBeltBadge,
                  { backgroundColor: belt.bg, borderColor: belt.border },
                ]}
              >
                <Text
                  style={[
                    styles.summaryBeltText,
                    { color: belt.fg },
                    selectedBelt === "White" && { color: colors.gray700 },
                  ]}
                >
                  {selectedBelt}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Effective Date</Text>
              <Text style={styles.summaryVal}>{formatDate(effectiveDate)}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Recipient</Text>
              <Text style={styles.summaryVal} numberOfLines={1}>
                {selectedStudent ? selectedStudent.name : "—"}
              </Text>
            </View>

            {promoterQuery.length > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Promoted By</Text>
                  <Text style={styles.summaryVal}>{promoterQuery}</Text>
                </View>
              </>
            )}

            {certifyingAs && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>On-Chain Instructor</Text>
                  <Text style={[styles.summaryVal, styles.summaryValAdmin]} numberOfLines={1}>
                    {certifyingAs.name}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {txError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{txError}</Text>
            </View>
          )}

          {/* ── Primary CTA ──────────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              !canSubmit && styles.primaryBtnDisabled,
              pressed && canSubmit && styles.primaryBtnPressed,
            ]}
            onPress={handleIssue}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Issue Official Rank"
            hitSlop={touchTarget.minHitSlop}
          >
            {isPending ? (
              <View style={styles.btnLoader}>
                <ActivityIndicator color={colors.onPrimary} size="small" />
                <Text style={styles.primaryBtnText}>Recording on Chain…</Text>
              </View>
            ) : (
              <Text style={styles.primaryBtnText}>Issue Official Rank</Text>
            )}
          </Pressable>

          <Text style={styles.gasNote}>
            Free to issue · Secured by Base blockchain
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Layout
  flex:   { flex: 1 },
  scroll: { flex: 1, backgroundColor: colors.background },
  safe:   { flex: 1, backgroundColor: colors.background },

  content: {
    paddingHorizontal: spacing["2xl"],
    paddingTop:        spacing.xl,
    paddingBottom:     spacing["5xl"],
    gap:               spacing.xl,
  },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.base,
  },

  headerLabels: { flex: 1, gap: 2 },

  screenTitle: {
    fontSize:    typography.size.xl,
    fontWeight:  typography.weight.extrabold,
    color:       colors.gray900,
    letterSpacing: -0.5,
  },

  screenSubtitle: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  iconBtn: {
    width:           44,
    height:          44,
    borderRadius:    radius.md,
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.gray300,
    alignItems:      "center",
    justifyContent:  "center",
  },
  iconBtnPressed: { backgroundColor: colors.surfaceAlt },
  iconBtnGlyph:   {
    fontSize:  typography.size.xl,
    color:     colors.gray700,
    fontWeight: typography.weight.bold,
    lineHeight: 28,
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

  // ── Instructor badge
  badge: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing.xs,
    backgroundColor:   colors.primaryMuted,
    borderRadius:      radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.xs,
    alignSelf:         "flex-start",
  },
  badgeDot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.primary,
    letterSpacing: 0.3,
  },

  // ── Section card  (SaaS: white surface, subtle border + shadow)
  card: {
    backgroundColor: colors.background,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.gray300,
    paddingVertical:   spacing.base,
    paddingHorizontal: spacing.base,
    gap:             spacing.sm,
    ...shadow.sm,
  },

  // Admin override card — amber tint border
  adminCard: {
    borderColor:     colors.warning,
    backgroundColor: colors.warningLight,
  },
  adminCardHeader: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  adminBadge: {
    fontSize:          typography.size.xs,
    fontWeight:        typography.weight.bold,
    color:             colors.warning,
    backgroundColor:   "#FEF3C7",
    borderRadius:      radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical:   2,
    letterSpacing:     0.5,
    overflow:          "hidden",
  },
  clearBtn: {
    fontSize:  typography.size.sm,
    color:     colors.gray500,
    paddingHorizontal: spacing.sm,
  },
  summaryValAdmin: {
    color:      colors.warning,
    fontWeight: typography.weight.semibold,
  },

  cardLabel: {
    fontSize:      typography.size.sm,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray900,
    letterSpacing: 0.2,
  },

  cardHint: {
    fontSize: typography.size.xs,
    color:    colors.gray500,
    marginTop: -spacing.xs,
  },

  cardRowBetween: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            spacing.sm,
  },

  // ── Text input
  inputWrap: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    borderWidth:     1.5,
    borderColor:     colors.gray300,
    paddingHorizontal: spacing.base,
    minHeight:       52,
  },
  inputWrapError: {
    borderColor:     colors.error,
    backgroundColor: colors.errorLight,
  },
  inputWrapValid: { borderColor: colors.primary },

  input: {
    flex:       1,
    fontSize:   typography.size.base,
    fontWeight: typography.weight.medium,
    color:      colors.gray900,
    paddingVertical: spacing.md,
  },

  validDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    marginLeft:   spacing.sm,
  },
  validDotOk:  { backgroundColor: colors.success },
  validDotErr: { backgroundColor: colors.error },

  fieldError: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.medium,
    color:      colors.error,
  },

  // ── Autocomplete dropdown
  suggestionsBox: {
    backgroundColor: colors.background,
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.gray300,
    overflow:        "hidden",
    ...shadow.sm,
  },
  suggestionRow: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             spacing.md,
    paddingVertical:  spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  suggestionRowPressed: { backgroundColor: colors.primaryMuted },
  suggestionAvatar: {
    width: 34, height: 34,
    borderRadius:    radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems:      "center",
    justifyContent:  "center",
  },
  suggestionAvatarText: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.bold,
    color:      colors.primary,
  },
  suggestionMeta: { flex: 1 },
  suggestionName: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
    color:      colors.gray900,
  },
  suggestionAddress: {
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  resolvedChip: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing.sm,
    backgroundColor:   colors.successLight,
    borderRadius:      radius.md,
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.md,
  },
  resolvedChipLabel: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.success,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resolvedChipValue: {
    flex:       1,
    fontSize:   typography.size.xs,
    color:      colors.gray700,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // ── Belt dropdown trigger
  dropTrigger: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    borderWidth:     1.5,
    borderColor:     colors.gray300,
    paddingHorizontal: spacing.base,
    minHeight:       52,
  },
  dropTriggerPressed: { backgroundColor: colors.surfaceAlt },
  dropTriggerLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  dropTriggerText: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
    color:      colors.gray900,
  },
  dropChevron: {
    fontSize:   typography.size.lg,
    color:      colors.gray500,
    lineHeight: 26,
  },

  beltSwatch: {
    width:        20,
    height:       20,
    borderRadius: radius.sm,
    borderWidth:  1.5,
  },

  // ── Belt dropdown modal
  modalOverlay: {
    flex:            1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent:  "center",
    alignItems:      "center",
    paddingHorizontal: spacing["2xl"],
  },

  dropMenu: {
    width:           "100%",
    backgroundColor: colors.background,
    borderRadius:    radius.xl,
    overflow:        "hidden",
    ...shadow.lg,
  },

  dropMenuTitle: {
    fontSize:          typography.size.xs,
    fontWeight:        typography.weight.semibold,
    color:             colors.gray500,
    letterSpacing:     0.8,
    textTransform:     "uppercase",
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.md,
    backgroundColor:   colors.surface,
  },

  dropOption: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.md,
    minHeight:         52,
  },
  dropOptionBorder:   { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  dropOptionSelected: { backgroundColor: colors.primaryMuted },
  dropOptionPressed:  { backgroundColor: colors.surfaceAlt },

  dropSwatch: {
    width:        20,
    height:       20,
    borderRadius: radius.sm,
    borderWidth:  1.5,
  },

  dropOptionText: {
    flex:       1,
    fontSize:   typography.size.base,
    fontWeight: typography.weight.medium,
    color:      colors.gray700,
  },
  dropOptionTextSelected: {
    color:      colors.primary,
    fontWeight: typography.weight.semibold,
  },
  dropCheck: {
    fontSize:   typography.size.base,
    color:      colors.primary,
    fontWeight: typography.weight.bold,
  },

  // ── Date button
  dateBtn: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    borderWidth:     1.5,
    borderColor:     colors.gray300,
    paddingHorizontal: spacing.base,
    minHeight:       60,
  },
  dateBtnPressed: { backgroundColor: colors.surfaceAlt },

  dateBtnLeft: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },

  dateIconBox: {
    width:           40,
    height:          40,
    borderRadius:    radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems:      "center",
    justifyContent:  "center",
  },
  dateIconGlyph: { fontSize: 20 },

  dateValue: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
    color:      colors.gray900,
  },
  dateSub: {
    fontSize: typography.size.xs,
    color:    colors.gray500,
    marginTop: 2,
  },
  dateChevron: {
    fontSize:   typography.size.lg,
    color:      colors.gray500,
    lineHeight: 26,
  },

  // ── Date picker card
  pickerWrap: {
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.gray300,
    overflow:        "hidden",
    backgroundColor: colors.surface,
    gap:             spacing.sm,
    padding:         spacing.sm,
  },

  pickerConfirm: {
    alignSelf:         "flex-end",
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.sm,
    backgroundColor:   colors.primary,
    borderRadius:      radius.full,
    minHeight:         36,
    justifyContent:    "center",
  },
  pickerConfirmText: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.semibold,
    color:      colors.onPrimary,
  },

  // ── Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor:     colors.gray300,
  },

  summaryTitle: {
    fontSize:      typography.size.xs,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom:  spacing.xs,
  },

  summaryRow: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "space-between",
    minHeight:      36,
    gap:            spacing.sm,
  },

  summaryKey: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.medium,
    color:      colors.gray500,
  },

  summaryVal: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.semibold,
    color:      colors.gray900,
    flexShrink: 1,
    textAlign:  "right",
  },

  summaryDivider: {
    height:          1,
    backgroundColor: colors.gray100,
  },

  summaryBeltBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   3,
    borderRadius:      radius.full,
    borderWidth:       1.5,
  },
  summaryBeltText: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.3,
  },

  // ── Error banner
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.error,
    padding:         spacing.md,
  },
  errorBannerText: {
    fontSize:   typography.size.sm,
    color:      colors.error,
    fontWeight: typography.weight.medium,
    lineHeight: typography.size.sm * 1.5,
  },

  // ── Primary button
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.xl,
    minHeight:       56,
    alignItems:      "center",
    justifyContent:  "center",
    ...shadow.primary,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.gray300,
    ...shadow.sm,
  },
  primaryBtnPressed: {
    backgroundColor: colors.primaryDark,
    transform:       [{ scale: 0.98 }],
  },
  primaryBtnText: {
    fontSize:      typography.size.base,
    fontWeight:    typography.weight.bold,
    color:         colors.onPrimary,
    letterSpacing: 0.2,
  },

  btnLoader: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },

  gasNote: {
    textAlign:  "center",
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    marginTop:  -spacing.sm,
  },

  // ── Success screen
  successContainer: {
    flexGrow:          1,
    alignItems:        "center",
    justifyContent:    "center",
    paddingHorizontal: spacing["2xl"],
    paddingVertical:   spacing["4xl"],
    gap:               spacing.xl,
  },

  checkRing: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: colors.successLight,
    alignItems:      "center",
    justifyContent:  "center",
  },
  checkCircle: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: colors.success,
    alignItems:      "center",
    justifyContent:  "center",
    ...shadow.md,
  },
  checkGlyph: {
    fontSize:   48,
    color:      "#FFFFFF",
    fontWeight: typography.weight.bold,
    lineHeight: 56,
    textAlign:  "center",
  },

  successHeading: {
    fontSize:      typography.size["2xl"],
    fontWeight:    typography.weight.extrabold,
    color:         colors.gray900,
    textAlign:     "center",
    letterSpacing: -0.5,
  },

  successBody: {
    fontSize:   typography.size.base,
    color:      colors.gray500,
    textAlign:  "center",
    lineHeight: typography.size.base * 1.6,
    maxWidth:   320,
  },

  certCard: {
    alignItems:      "center",
    gap:             spacing.sm,
    backgroundColor: colors.surface,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.gray300,
    paddingVertical:   spacing.lg,
    paddingHorizontal: spacing.xl,
    width:           "100%",
    ...shadow.sm,
  },

  certBeltBadge: {
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.xs,
    borderRadius:      radius.full,
    borderWidth:       2,
  },
  certBeltText: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.3,
  },

  certRecipient: {
    fontSize:      typography.size.base,
    fontWeight:    typography.weight.semibold,
    color:         colors.gray900,
    fontVariant:   ["tabular-nums"],
    letterSpacing: 0.3,
  },

  certDate: {
    fontSize: typography.size.sm,
    color:    colors.gray500,
  },

  certCoPromoter: {
    fontSize:   typography.size.xs,
    color:      colors.gray500,
    fontStyle:  "italic",
  },

  txRow: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             spacing.sm,
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.gray300,
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.sm,
    width:           "100%",
  },

  txLabel: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.semibold,
    color:      colors.gray500,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  txHash: {
    flex:        1,
    fontSize:    typography.size.sm,
    fontWeight:  typography.weight.medium,
    color:       colors.gray700,
    textAlign:   "right",
    fontVariant: ["tabular-nums"],
  },

  // Block Explorer — subtle text button
  explorerLink: {
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius:      radius.full,
    minHeight:         40,
    justifyContent:    "center",
  },
  explorerLinkPressed: { opacity: 0.6 },
  explorerLinkText: {
    fontSize:      typography.size.sm,
    fontWeight:    typography.weight.medium,
    color:         colors.primary,
    textDecorationLine: "underline",
    letterSpacing: 0.2,
  },
});
