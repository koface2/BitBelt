import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { BELT_COLORS, type BeltColor } from "@/constants/belts";
import type { SBTToken } from "@/hooks/useSBT";

interface LineageNode {
  address: string;
  name?: string;
  tokens: SBTToken[];
}

interface LineageTreeProps {
  nodes: LineageNode[];
}

function NodeCard({ node, depth }: { node: LineageNode; depth: number }) {
  const latestToken = node.tokens[node.tokens.length - 1];
  const belt = latestToken
    ? (BELT_COLORS[latestToken.beltColor as BeltColor] ?? BELT_COLORS.white)
    : BELT_COLORS.white;

  const beltHex: Record<BeltColor, string> = {
    white: "#FFFFFF",
    blue: "#1D4ED8",
    purple: "#7C3AED",
    brown: "#92400E",
    black: "#1F2937",
  };

  return (
    <View style={[styles.nodeWrapper, { marginLeft: depth * 20 }]}>
      {depth > 0 && <View style={styles.connector} />}
      <View style={styles.node}>
        <View
          style={[
            styles.beltDot,
            {
              backgroundColor: latestToken
                ? (beltHex[latestToken.beltColor as BeltColor] ?? "#999")
                : "#999",
              borderColor:
                latestToken?.beltColor === "white" ? "#CBD5E1" : "transparent",
            },
          ]}
        />
        <View style={styles.nodeInfo}>
          <Text style={styles.nodeName} numberOfLines={1}>
            {node.name ??
              `${node.address.slice(0, 6)}...${node.address.slice(-4)}`}
          </Text>
          {latestToken ? (
            <Text style={styles.nodeBelt}>
              {belt.label} Belt{" "}
              {latestToken.degree > 0 ? `${latestToken.degree}°` : ""}
            </Text>
          ) : null}
        </View>
        {latestToken ? (
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenBadgeText}>#{latestToken.tokenId}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function LineageTree({ nodes }: LineageTreeProps) {
  if (nodes.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No lineage data found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>BJJ Lineage</Text>
      {nodes.map((node, index) => (
        <NodeCard key={node.address} node={node} depth={index} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F1F5F9",
    marginBottom: 16,
  },
  nodeWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  connector: {
    position: "absolute",
    left: -10,
    top: -8,
    width: 2,
    height: 24,
    backgroundColor: "#475569",
  },
  node: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  beltDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  nodeInfo: {
    flex: 1,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  nodeBelt: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 1,
  },
  tokenBadge: {
    backgroundColor: "#0F172A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tokenBadgeText: {
    fontSize: 11,
    color: "#F59E0B",
    fontFamily: "monospace",
  },
  empty: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 14,
  },
});
