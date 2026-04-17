/**
 * DateStepPicker — Three-step date selection modal.
 *
 * Step 1: Year    (1960 → current year, most-recent first)
 * Step 2: Month   (grid of 12 months)
 * Step 3: Day     (grid sized to the actual days in that month/year)
 *
 * No text input is exposed: the user always taps to select.
 * Respects an optional maximumDate so future dates cannot be chosen.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableWithoutFeedback,
} from "react-native";
import { Theme } from "@/constants/Theme";

const { colors, spacing, typography, radius, shadow, touchTarget } = Theme;

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1960;

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

type Step = "year" | "month" | "day";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DateStepPickerProps {
  visible: boolean;
  value: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DateStepPicker({
  visible,
  value,
  maximumDate,
  onConfirm,
  onClose,
}: DateStepPickerProps) {
  const [step, setStep]   = useState<Step>("year");
  const [year, setYear]   = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay]     = useState(value.getDate());

  // Reset internal state whenever the modal re-opens
  useEffect(() => {
    if (visible) {
      setStep("year");
      setYear(value.getFullYear());
      setMonth(value.getMonth());
      setDay(value.getDate());
    }
  }, [visible]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const maxYear  = maximumDate ? maximumDate.getFullYear()  : CURRENT_YEAR;
  const maxMonth = maximumDate ? maximumDate.getMonth()      : 11;
  const maxDay   = maximumDate ? maximumDate.getDate()       : 31;

  const isMonthDisabled = (m: number) => {
    if (year < maxYear) return false;
    if (year > maxYear) return true;
    return m > maxMonth;
  };

  const isDayDisabled = (d: number) => {
    if (year < maxYear) return false;
    if (year > maxYear) return true;
    if (month < maxMonth) return false;
    if (month > maxMonth) return true;
    return d > maxDay;
  };

  const totalDays = daysInMonth(year, month);

  // ── Step handlers ────────────────────────────────────────────────────────────

  const handleYearSelect = (y: number) => {
    setYear(y);
    // If previously chosen month is now invalid, reset it
    if (y === maxYear && month > maxMonth) setMonth(maxMonth);
    setStep("month");
  };

  const handleMonthSelect = (m: number) => {
    setMonth(m);
    // Clamp day if needed
    const maxDayForMonth = daysInMonth(year, m);
    if (day > maxDayForMonth) setDay(maxDayForMonth);
    setStep("day");
  };

  const handleDaySelect = (d: number) => {
    setDay(d);
    onConfirm(new Date(year, month, d));
    onClose();
  };

  const handleBack = () => {
    if (step === "month") setStep("year");
    if (step === "day")   setStep("month");
  };

  // ── Breadcrumb label ─────────────────────────────────────────────────────────

  const breadcrumb =
    step === "year"  ? "SELECT YEAR" :
    step === "month" ? `${year} — SELECT MONTH` :
    `${MONTHS[month]} ${year} — SELECT DAY`;

  // ── Year list ─────────────────────────────────────────────────────────────────

  const years: number[] = [];
  for (let y = maxYear; y >= MIN_YEAR; y--) years.push(y);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* ── Title bar ── */}
        <View style={styles.titleBar}>
          {step !== "year" ? (
            <Pressable
              onPress={handleBack}
              hitSlop={touchTarget.minHitSlop}
              style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text style={styles.navBtnText}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.navBtnPlaceholder} />
          )}

          <Text style={styles.breadcrumb}>{breadcrumb}</Text>

          <Pressable
            onPress={onClose}
            hitSlop={touchTarget.minHitSlop}
            style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.navBtnText}>✕</Text>
          </Pressable>
        </View>

        {/* ── Step: Year ── */}
        {step === "year" && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.yearList}
            showsVerticalScrollIndicator={false}
          >
            {years.map((y) => {
              const isSelected = y === year;
              return (
                <Pressable
                  key={y}
                  onPress={() => handleYearSelect(y)}
                  style={({ pressed }) => [
                    styles.yearRow,
                    isSelected && styles.yearRowSelected,
                    pressed && !isSelected && styles.yearRowHover,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Year ${y}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.yearText, isSelected && styles.yearTextSelected]}>
                    {y}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* ── Step: Month ── */}
        {step === "month" && (
          <View style={styles.grid}>
            {MONTHS.map((name, m) => {
              const disabled  = isMonthDisabled(m);
              const isSelected = m === month;
              return (
                <Pressable
                  key={m}
                  onPress={() => !disabled && handleMonthSelect(m)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.gridCell,
                    isSelected && styles.gridCellSelected,
                    disabled   && styles.gridCellDisabled,
                    pressed && !disabled && !isSelected && styles.gridCellHover,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={name}
                  accessibilityState={{ selected: isSelected, disabled }}
                >
                  <Text
                    style={[
                      styles.gridCellText,
                      isSelected && styles.gridCellTextSelected,
                      disabled   && styles.gridCellTextDisabled,
                    ]}
                  >
                    {name.slice(0, 3)}
                  </Text>
                  {isSelected && (
                    <Text style={styles.gridCellSub}>{year}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Step: Day ── */}
        {step === "day" && (
          <View style={styles.grid}>
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
              const disabled  = isDayDisabled(d);
              const isSelected = d === day;
              return (
                <Pressable
                  key={d}
                  onPress={() => !disabled && handleDaySelect(d)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.dayCell,
                    isSelected && styles.gridCellSelected,
                    disabled   && styles.gridCellDisabled,
                    pressed && !disabled && !isSelected && styles.gridCellHover,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${d}`}
                  accessibilityState={{ selected: isSelected, disabled }}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isSelected && styles.gridCellTextSelected,
                      disabled   && styles.gridCellTextDisabled,
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  sheet: {
    backgroundColor:  colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "75%",
    paddingBottom: spacing["3xl"],
    ...shadow.lg,
  },

  titleBar: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },

  breadcrumb: {
    flex: 1,
    textAlign:    "center",
    fontSize:     typography.size.xs,
    fontWeight:   typography.weight.bold,
    color:        colors.gray500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  navBtn: {
    width:  36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems:     "center",
    justifyContent: "center",
  },
  navBtnPressed: { backgroundColor: colors.surfaceAlt },
  navBtnText: {
    fontSize:   typography.size.base,
    color:      colors.gray700,
    fontWeight: typography.weight.semibold,
  },
  navBtnPlaceholder: { width: 36 },

  // ── Year list
  scroll: { maxHeight: 320 },
  yearList: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },

  yearRow: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius:   radius.md,
    marginBottom:   2,
  },
  yearRowSelected: {
    backgroundColor: colors.primaryMuted,
  },
  yearRowHover: { backgroundColor: colors.surface },
  yearText: {
    fontSize:   typography.size.md,
    color:      colors.gray700,
    fontWeight: typography.weight.medium,
  },
  yearTextSelected: {
    color:      colors.primary,
    fontWeight: typography.weight.bold,
  },
  checkmark: {
    fontSize: typography.size.base,
    color:    colors.primary,
  },

  // ── Month / Day grid
  grid: {
    flexDirection:  "row",
    flexWrap:       "wrap",
    padding:        spacing.base,
    gap:            spacing.sm,
  },

  gridCell: {
    width:           "30%",
    flexGrow:        1,
    paddingVertical: spacing.md,
    alignItems:      "center",
    justifyContent:  "center",
    borderRadius:    radius.lg,
    borderWidth:     1.5,
    borderColor:     colors.gray300,
    backgroundColor: colors.background,
    gap:             2,
  },
  gridCellSelected: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  gridCellDisabled: {
    backgroundColor: colors.gray100,
    borderColor:     colors.gray100,
    opacity:         0.4,
  },
  gridCellHover: { backgroundColor: colors.surface },
  gridCellText: {
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
    color:      colors.gray700,
  },
  gridCellTextSelected: { color: colors.onPrimary },
  gridCellTextDisabled: { color: colors.gray500 },
  gridCellSub: {
    fontSize: typography.size.xs,
    color:    colors.onPrimary,
    opacity:  0.8,
  },

  // ── Day grid (smaller cells)
  dayCell: {
    width:           "13%",
    flexGrow:        1,
    paddingVertical: spacing.md,
    alignItems:      "center",
    justifyContent:  "center",
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.gray300,
    backgroundColor: colors.background,
  },
  dayCellText: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.semibold,
    color:      colors.gray700,
  },
});
