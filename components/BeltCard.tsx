import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BELT_COLORS, type BeltColor, type BeltDegree } from "@/constants/belts";

interface BeltCardProps {
  beltColor: BeltColor;
  degree: BeltDegree;
  holderName: string;
  instructor: string;
  gym?: string;
  promotedAt: number;
  tokenId?: string;
  verified?: boolean;
}

function DegreeStripe({ count }: { count: number }) {
  return (
    <View style={styles.stripeContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.stripe} />
      ))}
    </View>
  );
}

export default function BeltCard({
  beltColor,
  degree,
  holderName,
  instructor,
  gym,
  promotedAt,
  tokenId,
  verified = false,
}: BeltCardProps) {
  const belt = BELT_COLORS[beltColor];
  const promotionDate = new Date(promotedAt * 1000).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  // Gradient colors per belt
  const gradientColors: Record<BeltColor, [string, string]> = {
    white: ["#FFFFFF", "#E5E7EB"],
    blue: ["#1D4ED8", "#1E40AF"],
    purple: ["#7C3AED", "#6D28D9"],
    brown: ["#92400E", "#78350F"],
    black: ["#1F2937", "#111827"],
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradientColors[beltColor]}
        style={styles.beltBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <DegreeStripe count={degree} />
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.holderName}>{holderName}</Text>
            <Text style={styles.beltLabel}>
              {belt.label} Belt{degree > 0 ? ` — ${degree}° Degree` : ""}
            </Text>
          </View>
          {verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ On-Chain</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Instructor</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {instructor}
          </Text>
        </View>

        {gym ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gym</Text>
            <Text style={styles.detailValue}>{gym}</Text>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Promoted</Text>
          <Text style={styles.detailValue}>{promotionDate}</Text>
        </View>

        {tokenId ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Token ID</Text>
            <Text style={[styles.detailValue, styles.tokenId]}>
              #{tokenId}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  beltBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  stripeContainer: {
    flexDirection: "row",
    gap: 4,
  },
  stripe: {
    width: 12,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 2,
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  holderName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  beltLabel: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: "#065F46",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedText: {
    color: "#6EE7B7",
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 0.4,
  },
  detailValue: {
    fontSize: 14,
    color: "#CBD5E1",
    flex: 0.6,
    textAlign: "right",
  },
  tokenId: {
    color: "#F59E0B",
    fontFamily: "monospace",
  },
});
