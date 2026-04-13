import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BELT_COLORS, type BeltColor } from "@/constants/belts";
import type { SBTToken } from "@/hooks/useSBT";

interface PromotionCardProps {
  token: SBTToken;
  holderName?: string;
  onPress?: () => void;
}

export default function PromotionCard({
  token,
  holderName,
  onPress,
}: PromotionCardProps) {
  const belt = BELT_COLORS[token.beltColor as BeltColor] ?? BELT_COLORS.white;
  const promotionDate = new Date(token.promotedAt * 1000).toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );

  const beltDotColors: Record<BeltColor, string> = {
    white: "#FFFFFF",
    blue: "#1D4ED8",
    purple: "#7C3AED",
    brown: "#92400E",
    black: "#1F2937",
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.colorAccent,
          { backgroundColor: beltDotColors[token.beltColor as BeltColor] ?? "#999" },
        ]}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.beltText}>
            {belt.label} Belt{token.degree > 0 ? ` ${token.degree}°` : ""}
          </Text>
          <Text style={styles.tokenId}>#{token.tokenId}</Text>
        </View>

        {holderName ? (
          <Text style={styles.holderName}>{holderName}</Text>
        ) : null}

        <View style={styles.bottomRow}>
          <Text style={styles.meta}>{token.instructorName}</Text>
          <Text style={styles.date}>{promotionDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  colorAccent: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  beltText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  tokenId: {
    fontSize: 12,
    color: "#F59E0B",
    fontFamily: "monospace",
  },
  holderName: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  meta: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: "#64748B",
  },
});
