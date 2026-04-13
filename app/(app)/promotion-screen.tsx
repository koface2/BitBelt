import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useActiveAccount } from "thirdweb/react";
import { useSBT } from "@/hooks/useSBT";
import { BELT_COLORS, type BeltColor, type BeltDegree } from "@/constants/belts";

const BELT_OPTIONS: BeltColor[] = ["white", "blue", "purple", "brown", "black"];
const DEGREE_OPTIONS: BeltDegree[] = [0, 1, 2, 3, 4];

export default function PromotionScreen() {
  const account = useActiveAccount();
  const { mintPromotion, loading, error } = useSBT();

  const [recipientAddress, setRecipientAddress] = useState("");
  const [selectedBelt, setSelectedBelt] = useState<BeltColor>("blue");
  const [selectedDegree, setSelectedDegree] = useState<BeltDegree>(0);
  const [instructorName, setInstructorName] = useState("");
  const [gymName, setGymName] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  const isInstructor = Boolean(account);

  const handleMint = async () => {
    if (!recipientAddress.trim()) {
      Alert.alert("Missing Field", "Please enter the recipient's wallet address.");
      return;
    }
    if (!instructorName.trim()) {
      Alert.alert("Missing Field", "Please enter the instructor name.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress.trim())) {
      Alert.alert("Invalid Address", "Please enter a valid Ethereum address.");
      return;
    }

    const hash = await mintPromotion({
      recipient: recipientAddress.trim(),
      beltColor: selectedBelt,
      degree: selectedDegree,
      instructor: instructorName.trim(),
      gym: gymName.trim(),
      metadataUri: metadataUri.trim() || `ipfs://bitbelt/${selectedBelt}/${selectedDegree}`,
    });

    if (hash) {
      setTxHash(hash);
      Alert.alert(
        "Promotion Minted! 🥋",
        `SBT minted successfully on Base.\n\nTx: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
        [{ text: "OK", onPress: () => resetForm() }]
      );
    }
  };

  const resetForm = () => {
    setRecipientAddress("");
    setSelectedBelt("blue");
    setSelectedDegree(0);
    setInstructorName("");
    setGymName("");
    setMetadataUri("");
    setTxHash(null);
  };

  const beltHex: Record<BeltColor, string> = {
    white: "#E2E8F0",
    blue: "#1D4ED8",
    purple: "#7C3AED",
    brown: "#92400E",
    black: "#1F2937",
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Issue Promotion</Text>
            <Text style={styles.headerSubtitle}>
              Mint a Soulbound Token for a student's belt promotion
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Belt Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Belt Color</Text>
              <View style={styles.beltSelector}>
                {BELT_OPTIONS.map((belt) => (
                  <TouchableOpacity
                    key={belt}
                    style={[
                      styles.beltOption,
                      { backgroundColor: beltHex[belt] },
                      selectedBelt === belt && styles.beltOptionSelected,
                    ]}
                    onPress={() => setSelectedBelt(belt)}
                  >
                    <Text
                      style={[
                        styles.beltOptionText,
                        belt === "white" && styles.beltOptionTextDark,
                      ]}
                    >
                      {BELT_COLORS[belt].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Degree Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Degree / Stripes</Text>
              <View style={styles.degreeSelector}>
                {DEGREE_OPTIONS.map((deg) => (
                  <TouchableOpacity
                    key={deg}
                    style={[
                      styles.degreeOption,
                      selectedDegree === deg && styles.degreeOptionSelected,
                    ]}
                    onPress={() => setSelectedDegree(deg)}
                  >
                    <Text
                      style={[
                        styles.degreeOptionText,
                        selectedDegree === deg && styles.degreeOptionTextSelected,
                      ]}
                    >
                      {deg === 0 ? "0°" : `${deg}°`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recipient */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Student Wallet Address *</Text>
              <TextInput
                style={styles.input}
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                placeholder="0x..."
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Instructor */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Instructor Name *</Text>
              <TextInput
                style={styles.input}
                value={instructorName}
                onChangeText={setInstructorName}
                placeholder="e.g. Rickson Gracie"
                placeholderTextColor="#475569"
              />
            </View>

            {/* Gym */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Gym / Academy</Text>
              <TextInput
                style={styles.input}
                value={gymName}
                onChangeText={setGymName}
                placeholder="e.g. Gracie Academy"
                placeholderTextColor="#475569"
              />
            </View>

            {/* Metadata URI */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Metadata URI (IPFS)</Text>
              <TextInput
                style={styles.input}
                value={metadataUri}
                onChangeText={setMetadataUri}
                placeholder="ipfs://... (optional)"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Preview */}
            {recipientAddress.trim() && instructorName.trim() ? (
              <View style={styles.preview}>
                <Text style={styles.previewTitle}>Preview</Text>
                <View style={styles.previewContent}>
                  <View
                    style={[
                      styles.previewBelt,
                      { backgroundColor: beltHex[selectedBelt] },
                    ]}
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewBeltText}>
                      {BELT_COLORS[selectedBelt].label} Belt
                      {selectedDegree > 0 ? ` — ${selectedDegree}° Degree` : ""}
                    </Text>
                    <Text style={styles.previewMeta}>
                      by {instructorName}
                      {gymName ? ` · ${gymName}` : ""}
                    </Text>
                    <Text style={styles.previewAddress} numberOfLines={1}>
                      → {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-6)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Mint Button */}
            <TouchableOpacity
              style={[
                styles.mintButton,
                (!isInstructor || loading) && styles.mintButtonDisabled,
              ]}
              onPress={handleMint}
              disabled={!isInstructor || loading}
            >
              {loading ? (
                <ActivityIndicator color="#020617" />
              ) : (
                <Text style={styles.mintButtonText}>
                  🏅 Mint Promotion SBT
                </Text>
              )}
            </TouchableOpacity>

            {!isInstructor && (
              <Text style={styles.connectHint}>
                Connect your wallet to issue promotions
              </Text>
            )}

            <Text style={styles.disclaimer}>
              ⚠️ Soulbound Tokens are permanent and non-transferable. Verify
              all details before minting.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
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
    gap: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: "600",
  },
  beltSelector: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  beltOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  beltOptionSelected: {
    borderColor: "#F59E0B",
  },
  beltOptionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  beltOptionTextDark: {
    color: "#1F2937",
  },
  degreeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  degreeOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  degreeOptionSelected: {
    borderColor: "#F59E0B",
    backgroundColor: "#292524",
  },
  degreeOptionText: {
    color: "#64748B",
    fontWeight: "600",
  },
  degreeOptionTextSelected: {
    color: "#F59E0B",
  },
  input: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F1F5F9",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  preview: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  previewTitle: {
    fontSize: 11,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    fontWeight: "600",
  },
  previewContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  previewBelt: {
    width: 8,
    height: 60,
    borderRadius: 4,
  },
  previewInfo: {
    flex: 1,
    gap: 4,
  },
  previewBeltText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  previewMeta: {
    fontSize: 13,
    color: "#94A3B8",
  },
  previewAddress: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: "monospace",
  },
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
  },
  mintButton: {
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  mintButtonDisabled: {
    backgroundColor: "#374151",
  },
  mintButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#020617",
  },
  connectHint: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
  },
  disclaimer: {
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
  },
});
