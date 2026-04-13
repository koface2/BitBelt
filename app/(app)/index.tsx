import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import BeltCard from "@/components/BeltCard";
import { useSBT, type SBTToken } from "@/hooks/useSBT";
import { BELT_COLORS, type BeltColor } from "@/constants/belts";
import { THIRDWEB_CLIENT_ID } from "@/constants/contracts";

const client = createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID });

export default function DashboardScreen() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { fetchTokens, loading, error } = useSBT();
  const [tokens, setTokens] = useState<SBTToken[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTokens = async () => {
    if (!account?.address) return;
    const result = await fetchTokens(account.address);
    setTokens(result);
  };

  useEffect(() => {
    loadTokens();
  }, [account?.address]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTokens();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    if (wallet) {
      disconnect(wallet);
    }
  };

  // Determine current belt from latest token
  const latestToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
  const currentBelt = latestToken?.beltColor as BeltColor | undefined;
  const belt = currentBelt ? BELT_COLORS[currentBelt] : null;

  const shortAddress = account?.address
    ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : "";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.address}>{shortAddress}</Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#F59E0B"
            />
          }
        >
          {/* Current Belt Status */}
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Current Belt</Text>
            {belt ? (
              <View style={styles.beltStatus}>
                <View
                  style={[
                    styles.beltIndicator,
                    {
                      backgroundColor:
                        currentBelt === "white"
                          ? "#94A3B8"
                          : BELT_COLORS[currentBelt!].hex,
                    },
                  ]}
                />
                <Text style={styles.beltName}>
                  {belt.label} Belt
                  {latestToken?.degree
                    ? ` — ${latestToken.degree}° Degree`
                    : ""}
                </Text>
              </View>
            ) : (
              <Text style={styles.noBelt}>No belt tokens found</Text>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard label="Promotions" value={tokens.length.toString()} />
            <StatCard
              label="Network"
              value={
                process.env.EXPO_PUBLIC_NETWORK === "mainnet"
                  ? "Base"
                  : "Base Sepolia"
              }
            />
            <StatCard label="Gasless" value="✓ Active" />
          </View>

          {/* Belt History */}
          <Text style={styles.sectionTitle}>Belt History</Text>

          {loading && !refreshing ? (
            <ActivityIndicator
              color="#F59E0B"
              style={styles.loader}
            />
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={loadTokens}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : tokens.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🥋</Text>
              <Text style={styles.emptyTitle}>No Promotions Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your belt promotions will appear here once your instructor
                mints your first SBT.
              </Text>
            </View>
          ) : (
            tokens.map((token) => (
              <BeltCard
                key={token.tokenId}
                beltColor={token.beltColor as BeltColor}
                degree={token.degree}
                holderName={shortAddress}
                instructor={token.instructorName}
                gym={token.gym}
                promotedAt={token.promotedAt}
                tokenId={token.tokenId}
                verified
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  greeting: {
    fontSize: 12,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  address: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F1F5F9",
    fontFamily: "monospace",
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1E293B",
    borderRadius: 8,
  },
  signOutText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  statusLabel: {
    fontSize: 12,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  beltStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  beltIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  beltName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  noBelt: {
    color: "#64748B",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F59E0B",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F1F5F9",
    marginBottom: 8,
  },
  loader: {
    marginTop: 40,
  },
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
