import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { baseSepolia, base } from "thirdweb/chains";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { THIRDWEB_CLIENT_ID, ACTIVE_NETWORK, ACCOUNT_FACTORY_ADDRESS } from "@/constants/contracts";

const client = createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID });

const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "email", "passkey"],
    },
    smartAccount: {
      chain: ACTIVE_NETWORK.CHAIN_ID === 8453 ? base : baseSepolia,
      sponsorGas: true,
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
];

export default function LoginScreen() {
  return (
    <LinearGradient
      colors={["#020617", "#0f172a", "#1e1b4b"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Logo / Brand */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🥋</Text>
            </View>
            <Text style={styles.appName}>BitBelt</Text>
            <Text style={styles.tagline}>Your BJJ journey on the blockchain</Text>
          </View>

          {/* Belt visual */}
          <View style={styles.beltPreview}>
            {(["white", "blue", "purple", "brown", "black"] as const).map(
              (color) => {
                const hexColors: Record<string, string> = {
                  white: "#FFFFFF",
                  blue: "#1D4ED8",
                  purple: "#7C3AED",
                  brown: "#92400E",
                  black: "#1F2937",
                };
                return (
                  <View
                    key={color}
                    style={[
                      styles.beltSlice,
                      { backgroundColor: hexColors[color] },
                    ]}
                  />
                );
              }
            )}
          </View>

          {/* Features */}
          <View style={styles.features}>
            <FeatureItem emoji="🔗" text="Immutable on-chain belt records" />
            <FeatureItem emoji="🌳" text="Verified BJJ lineage tracking" />
            <FeatureItem emoji="⛽" text="Gasless transactions (sponsored)" />
            <FeatureItem emoji="🔒" text="Soulbound — non-transferable tokens" />
          </View>

          {/* Connect Button */}
          <View style={styles.connectContainer}>
            <ConnectButton
              client={client}
              wallets={wallets}
              theme="dark"
              connectButton={{
                label: "Sign In to BitBelt",
                style: styles.connectButton,
              }}
              connectModal={{
                title: "BitBelt",
                titleIcon: "🥋",
              }}
            />
          </View>

          <Text style={styles.disclaimer}>
            Powered by Base blockchain · Thirdweb Account Abstraction
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FeatureItem({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  logoContainer: {
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 40,
    fontWeight: "800",
    color: "#F1F5F9",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
  },
  beltPreview: {
    flexDirection: "row",
    height: 20,
    width: "80%",
    borderRadius: 10,
    overflow: "hidden",
    gap: 2,
  },
  beltSlice: {
    flex: 1,
  },
  features: {
    width: "100%",
    gap: 10,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureEmoji: {
    fontSize: 18,
    width: 28,
  },
  featureText: {
    fontSize: 14,
    color: "#CBD5E1",
    flex: 1,
  },
  connectContainer: {
    width: "100%",
    alignItems: "center",
  },
  connectButton: {
    width: "100%",
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  disclaimer: {
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
  },
});
