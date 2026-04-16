/**
 * BitBelt — Thirdweb v5 SDK constants.
 *
 * Single source of truth for the client, target chain, and deployed contract.
 * Import from here in every screen/hook that touches the blockchain.
 */

import { createThirdwebClient, getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";

// ── Client ────────────────────────────────────────────────────────────────
// EXPO_PUBLIC_ prefix required for Expo to expose the var to the JS bundle.
export const client = createThirdwebClient({
  clientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID ?? "",
});

// ── Chain ─────────────────────────────────────────────────────────────────
// Swap `baseSepolia` → `base` (chain ID 8453) for mainnet.
export const chain = baseSepolia;

// ── Contract ──────────────────────────────────────────────────────────────
export const SBT_CONTRACT_ADDRESS =
  "0x28a5b84D8EcDdC3D9d750C78662dE3d82111Fca4" as const;

export const sbtContract = getContract({
  client,
  chain,
  address: SBT_CONTRACT_ADDRESS,
});

// ── Role hashes ───────────────────────────────────────────────────────────
// keccak256("INSTRUCTOR_ROLE") — mirrors the constant in BitBeltSBT.sol.
// Verified from the deploy broadcast output.
export const INSTRUCTOR_ROLE =
  "0xae4a0595970935aa5495afbbb72e5f1f6ff1062766b4a3028c0c9b7d5cf7e345" as `0x${string}`;

// ── Shared wallet singleton ───────────────────────────────────────────────
// Module-level so the same instance is reused across screens and AutoConnect.
export const wallet = inAppWallet({
  smartAccount: {
    chain,
    sponsorGas: true,
  },
});
