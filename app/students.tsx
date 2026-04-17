/**
 * students.tsx — Student Registry Screen
 *
 * Lets instructors/admins manage the local student roster.
 * Each student has a name + wallet address. Test accounts can be created
 * with randomly generated addresses for trying out the promotion flow.
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
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Theme } from "@/constants/Theme";
import { useStudents, generateRandomAddress } from "@/hooks/useStudents";
import type { Student } from "@/hooks/useStudents";
import StudentHoverCard from "@/components/StudentHoverCard";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ── StudentHoverRow sub-component ─────────────────────────────────────────────
// Extracted so each row has its own hover state and the StudentHoverCard
// (which has useReadContract hooks) only mounts per-row.

interface RowProps {
  student:  Student;
  copied:   string | null;
  onPress:  () => void;
  onDelete: () => void;
  onCopy:   (addr: string) => void;
}

function StudentHoverRow({ student, copied, onPress, onDelete, onCopy }: RowProps) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  return (
    <View
      style={[styles.hoverWrapper, hovered && styles.hoverWrapperActive]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* ── Tappable row ── */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${student.name}'s profile`}
        style={({ pressed }) => [
          styles.studentRow,
          pressed && styles.studentRowPressed,
          hovered && styles.studentRowHovered,
        ]}
      >
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, hovered && styles.studentNameHovered]}>
            {student.name}
          </Text>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onCopy(student.address); }}
            accessibilityLabel="Copy address"
          >
            <Text style={styles.studentAddress}>
              {copied === student.address ? "Copied!" : short(student.address)}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.rowChevron}>›</Text>

        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
          hitSlop={touchTarget.minHitSlop}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${student.name}`}
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && styles.deleteBtnPressed,
          ]}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </Pressable>
      </Pressable>

      {/* ── Hover card — only mounts on web when hovered ── */}
      {hovered && (
        <StudentHoverCard
          student={student}
          onViewProfile={() => {
            setHovered(false);
            router.push(`/student-profile/${student.id}`);
          }}
        />
      )}
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr.trim());
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StudentsScreen() {
  const router = useRouter();
  const { students, addStudent, removeStudent } = useStudents();

  // ── Add form state ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [useRandom, setUseRandom] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const nameTouched = name.length > 0;
  const addressTouched = address.length > 0;
  const addressValid = useRandom || isValidAddress(address);
  const canAdd = name.trim().length >= 2 && addressValid;

  const handleAdd = () => {
    const addr = useRandom ? generateRandomAddress() : (address.trim() as `0x${string}`);
    addStudent(name.trim(), addr);
    setName("");
    setAddress("");
    setUseRandom(true);
  };

  const handleDelete = (student: Student) => {
    if (Platform.OS === "web") {
      if (window.confirm(`Remove "${student.name}" from the registry?`)) {
        removeStudent(student.id);
      }
      return;
    }
    Alert.alert(
      "Remove Student",
      `Remove "${student.name}" from the registry? This does not burn any on-chain tokens.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeStudent(student.id) },
      ]
    );
  };

  const handleCopy = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(addr);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.screenTitle}>Students</Text>
            <Text style={styles.screenSubtitle}>REGISTRY</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            hitSlop={touchTarget.minHitSlop}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        </View>

        {/* ── Add student form ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ADD STUDENT</Text>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={[
                styles.input,
                nameTouched && name.trim().length < 2 && styles.inputError,
                nameTouched && name.trim().length >= 2 && styles.inputValid,
              ]}
              placeholder="e.g. John Silva"
              placeholderTextColor={colors.gray500}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              accessibilityLabel="Student name"
            />
          </View>

          {/* Wallet toggle */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Wallet Address</Text>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setUseRandom(true)}
                style={[styles.toggleBtn, useRandom && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, useRandom && styles.toggleTextActive]}>
                  🎲 Generate Random
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setUseRandom(false)}
                style={[styles.toggleBtn, !useRandom && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, !useRandom && styles.toggleTextActive]}>
                  ✏️ Enter Manually
                </Text>
              </Pressable>
            </View>

            {useRandom ? (
              <View style={styles.randomNote}>
                <Text style={styles.randomNoteText}>
                  A random test wallet address will be generated automatically. Useful for testing the promotion flow without a real wallet.
                </Text>
              </View>
            ) : (
              <TextInput
                style={[
                  styles.input,
                  styles.monoInput,
                  addressTouched && !addressValid && styles.inputError,
                  addressTouched && addressValid && styles.inputValid,
                ]}
                placeholder="0x..."
                placeholderTextColor={colors.gray500}
                value={address}
                onChangeText={setAddress}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                accessibilityLabel="Wallet address"
              />
            )}
          </View>

          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            style={({ pressed }) => [
              styles.addButton,
              !canAdd && styles.addButtonDisabled,
              pressed && canAdd && styles.addButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add student"
          >
            <Text style={[styles.addButtonText, !canAdd && styles.addButtonTextDisabled]}>
              Add Student
            </Text>
          </Pressable>
        </View>

        {/* ── Student list ────────────────────────────────────────────────── */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionLabel}>ROSTER</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{students.length}</Text>
            </View>
          </View>

          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyGlyph}>🥋</Text>
              <Text style={styles.emptyTitle}>No students yet</Text>
              <Text style={styles.emptyDesc}>
                Add students above to use the name search in the Promote screen.
              </Text>
            </View>
          ) : (
            [...students]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((student) => (
                <StudentHoverRow
                  key={student.id}
                  student={student}
                  copied={copied}
                  onPress={() => router.push(`/student-profile/${student.id}`)}
                  onDelete={() => handleDelete(student)}
                  onCopy={handleCopy}
                />
              ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
    paddingBottom: spacing["5xl"],
    gap: spacing["2xl"],
  },

  // ── Header ──
  header: { flexDirection: "row", alignItems: "center", gap: spacing.base },
  headerText: { flex: 1, gap: 2 },
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
  backButton: {
    width: 44, height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.gray300,
    alignItems: "center", justifyContent: "center",
  },
  backButtonPressed: { backgroundColor: colors.surfaceAlt },
  backIcon: { fontSize: typography.size.lg, color: colors.gray900 },

  // ── Card ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    gap: spacing.lg,
    ...shadow.sm,
  },
  cardTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // ── Fields ──
  field: { gap: spacing.xs },
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray700,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    paddingHorizontal: spacing.md,
    fontSize: typography.size.base,
    color: colors.gray900,
    backgroundColor: colors.background,
  },
  monoInput: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: typography.size.sm,
  },
  inputError: { borderColor: colors.error },
  inputValid: { borderColor: colors.success },

  // ── Toggle ──
  toggleRow: { flexDirection: "row", gap: spacing.sm },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  toggleBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  toggleText: {
    fontSize: typography.size.sm,
    color: colors.gray700,
    fontWeight: typography.weight.medium,
  },
  toggleTextActive: { color: colors.primary, fontWeight: typography.weight.semibold },

  randomNote: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  randomNoteText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    lineHeight: 18,
  },

  // ── Add button ──
  addButton: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  addButtonDisabled: { backgroundColor: colors.gray300 },
  addButtonPressed: { backgroundColor: colors.primaryDark },
  addButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onPrimary,
  },
  addButtonTextDisabled: { color: colors.gray500 },

  // ── List ──
  listSection: { gap: spacing.md },
  listHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  countBadge: {
    minWidth: 22, height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.onPrimary,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing["4xl"],
    gap: spacing.sm,
  },
  emptyGlyph: { fontSize: 40 },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray700,
  },
  emptyDesc: {
    fontSize: typography.size.sm,
    color: colors.gray500,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },

  // ── Hover wrapper (positions hover card above the row) ──
  hoverWrapper: {
    position: "relative",
    zIndex:   1,
  },
  hoverWrapperActive: {
    zIndex: 1000,
  },

  // ── Student row ──
  studentRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.md,
    backgroundColor: colors.surface,
    borderRadius:  radius.lg,
    padding:       spacing.md,
    ...shadow.sm,
  },
  studentRowHovered: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  studentRowPressed: {
    backgroundColor: colors.primaryMuted,
  },
  rowChevron: {
    fontSize:   20,
    color:      colors.gray500,
    fontWeight: typography.weight.bold,
    marginRight: -spacing.xs,
  },
  studentNameHovered: {
    color: colors.primary,
  },
  studentAvatar: {
    width: 40, height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center", justifyContent: "center",
  },
  studentAvatarText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  studentInfo: { flex: 1, gap: 2 },
  studentName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.gray900,
  },
  studentAddress: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  deleteBtn: {
    width: 32, height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.errorLight,
    alignItems: "center", justifyContent: "center",
  },
  deleteBtnPressed: { backgroundColor: colors.error },
  deleteBtnText: { fontSize: typography.size.sm, color: colors.error },
});
