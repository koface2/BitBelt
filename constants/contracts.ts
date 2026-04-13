// BitBelt SBT Contract Addresses
// Deployed on Base Mainnet and Base Sepolia (Testnet)

export const CONTRACTS = {
  // Base Mainnet (Chain ID: 8453)
  mainnet: {
    SBT_CONTRACT: process.env.EXPO_PUBLIC_SBT_CONTRACT_MAINNET ?? "",
    CHAIN_ID: 8453,
  },
  // Base Sepolia Testnet (Chain ID: 84532)
  testnet: {
    SBT_CONTRACT: process.env.EXPO_PUBLIC_SBT_CONTRACT_TESTNET ?? "",
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
  process.env.EXPO_PUBLIC_ACCOUNT_FACTORY_ADDRESS ?? "";

/**
 * Returns true if the contract address is set and non-zero.
 * Used to guard blockchain interactions before contracts are deployed.
 */
export function isContractConfigured(address: string): boolean {
  return (
    address.length > 0 &&
    address !== "0x0000000000000000000000000000000000000000"
  );
}

