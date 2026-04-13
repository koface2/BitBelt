// BitBelt SBT Contract Addresses
// Deployed on Base Mainnet and Base Sepolia (Testnet)

export const CONTRACTS = {
  // Base Mainnet (Chain ID: 8453)
  mainnet: {
    SBT_CONTRACT: "0x0000000000000000000000000000000000000000", // Replace with deployed contract address
    CHAIN_ID: 8453,
  },
  // Base Sepolia Testnet (Chain ID: 84532)
  testnet: {
    SBT_CONTRACT: "0x0000000000000000000000000000000000000000", // Replace with deployed contract address
    CHAIN_ID: 84532,
  },
} as const;

// Default to testnet for development
export const ACTIVE_NETWORK =
  process.env.EXPO_PUBLIC_NETWORK === "mainnet"
    ? CONTRACTS.mainnet
    : CONTRACTS.testnet;

// Thirdweb Client ID (set in .env)
export const THIRDWEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID ?? "";

// Thirdweb Account Abstraction
export const ACCOUNT_FACTORY_ADDRESS =
  process.env.EXPO_PUBLIC_ACCOUNT_FACTORY_ADDRESS ??
  "0x9aBE1F3A19f79BA9B7a1e8fDC5B9A3D4e6F7C8B2"; // Replace with deployed factory address
