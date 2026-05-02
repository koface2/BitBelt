import React from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Theme } from "@/constants/Theme";

const { colors, spacing, typography, radius } = Theme;

const INFO_ITEMS = [
  { label: "Platform", value: "Base Sepolia (testnet)" },
  { label: "Auth", value: "Email / Google via Thirdweb" },
  { label: "Gas", value: "Sponsored (Account Abstraction)" },
  { label: "Tokens", value: "Soulbound (non-transferable)" },
];

export default function AboutModal() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <Text style={styles.title}>BitBelt</Text>
      <Text style={styles.subtitle}>Decentralised BJJ Belt Registry</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>How it works</Text>
        <Text style={styles.body}>
          Each belt promotion is minted as a Soulbound Token (SBT) on the Base
          blockchain, permanently recording the student, instructor, belt rank,
          and promotion date. SBTs cannot be transferred — your lineage is yours
          forever.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Network details</Text>
        {INFO_ITEMS.map(({ label, value }) => (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))}
      </View>

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingTop: spacing["3xl"],
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.gray500,
    marginBottom: spacing["2xl"],
  },
  section: {
    marginBottom: spacing["2xl"],
  },
  sectionHeading: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: typography.size.base,
    color: colors.gray700,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray300,
  },
  infoLabel: {
    fontSize: typography.size.base,
    color: colors.gray500,
  },
  infoValue: {
    fontSize: typography.size.base,
    color: colors.gray900,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: spacing.md,
  },
});
