import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useActiveAccount } from "thirdweb/react";
import LineageTree from "@/components/LineageTree";
import { useSBT, type SBTToken } from "@/hooks/useSBT";

interface LineageNode {
  address: string;
  name?: string;
  tokens: SBTToken[];
}

export default function LineageScreen() {
  const account = useActiveAccount();
  const { fetchLineage, loading, error } = useSBT();
  const [lineage, setLineage] = useState<LineageNode[]>([]);
  const [searchAddress, setSearchAddress] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadLineage = async (address?: string) => {
    const target = address ?? account?.address;
    if (!target) return;
    const result = await fetchLineage(target);
    const nodes: LineageNode[] = result.map((tokens, index) => ({
      // The first node is the searched address; subsequent nodes are instructor wallet addresses
      address:
        index === 0
          ? target
          : (tokens[0]?.instructorAddress ?? "unknown"),
      name:
        index > 0 && tokens[0]?.instructorName
          ? tokens[0].instructorName
          : undefined,
      tokens,
    }));
    setLineage(nodes);
  };

  useEffect(() => {
    loadLineage();
  }, [account?.address]);

  const handleSearch = () => {
    if (searchAddress.trim() && /^0x[a-fA-F0-9]{40}$/.test(searchAddress.trim())) {
      loadLineage(searchAddress.trim());
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLineage();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BJJ Lineage</Text>
          <Text style={styles.headerSubtitle}>
            Trace the verified chain of BJJ instructors
          </Text>
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
          {/* Search */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchAddress}
              onChangeText={setSearchAddress}
              placeholder="Search by wallet address (0x...)"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearch}
            >
              <Text style={styles.searchBtnText}>Search</Text>
            </TouchableOpacity>
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🌳 What is BJJ Lineage?</Text>
            <Text style={styles.infoText}>
              In Brazilian Jiu-Jitsu, lineage refers to the chain of instructors
              who taught a practitioner. BitBelt records each promotion as a
              Soulbound Token, creating an immutable, verifiable lineage on the
              Base blockchain.
            </Text>
          </View>

          {/* Loading */}
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#F59E0B" size="large" />
              <Text style={styles.loadingText}>Tracing lineage on-chain...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.treeContainer}>
              <LineageTree nodes={lineage} />
            </View>
          )}

          {/* Current user indicator */}
          {account?.address && (
            <View style={styles.currentUser}>
              <Text style={styles.currentUserLabel}>Viewing lineage for:</Text>
              <Text style={styles.currentUserAddress}>
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F1F5F9",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F1F5F9",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  searchBtn: {
    backgroundColor: "#F59E0B",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#020617",
    fontWeight: "700",
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    gap: 6,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  infoText: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 14,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
  },
  treeContainer: {
    minHeight: 200,
  },
  currentUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  currentUserLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  currentUserAddress: {
    fontSize: 12,
    color: "#F59E0B",
    fontFamily: "monospace",
  },
});
