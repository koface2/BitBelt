# GitHub Copilot Instructions for BitBelt

## Project Summary

**BitBelt** is a decentralized verification platform for Brazilian Jiu-Jitsu (BJJ).
It issues **Soulbound Tokens (SBTs)** on the **Base blockchain** to create an immutable,
verifiable lineage of belt promotions — from instructor to student, all on-chain.

### Tech Stack
| Layer | Choice |
|-------|--------|
| Frontend | React Native (Expo) |
| Styling | Tailwind CSS via NativeWind |
| Blockchain SDK | Thirdweb SDK v5 |
| Network | Base Mainnet / Base Sepolia (Testnet) |
| Auth / Wallets | Social Login (Google / Email) — Account Abstraction (ERC-4337) |
| Gasless Transactions | Sponsored via Thirdweb Paymaster |

### File & Naming Conventions
- **Components:** PascalCase — e.g. `BeltCard.tsx`, `LineageNode.tsx`
- **Screens:** kebab-case — e.g. `promotion-screen.tsx`
- **Navigation:** Expo Router (file-based routing)
- **Hooks:** camelCase prefixed with `use` — e.g. `useBitBelt.ts`

---

## Copilot Behaviour Rules

### 1. Always Use Base Network Configurations
Whenever suggesting or generating **any** blockchain / network configuration, chain
references, RPC URLs, or contract deployment scripts, **always default to Base**:

- **Mainnet** — chain ID `8453`, RPC `https://mainnet.base.org`
- **Testnet** — Base Sepolia, chain ID `84532`, RPC `https://sepolia.base.org`

```ts
// ✅ Correct — always target Base
import { base, baseSepolia } from "thirdweb/chains";

const chain = process.env.NODE_ENV === "production" ? base : baseSepolia;
```

Never suggest Ethereum mainnet, Polygon, or any other chain unless the user
explicitly requests it.

### 2. Always Use Thirdweb Account Abstraction Hooks for Blockchain Features
Whenever the user asks about **wallet connection, signing transactions, reading
contract state, minting tokens, or any other blockchain interaction**, always use
**Thirdweb SDK v5 Account Abstraction hooks** — never raw `ethers.js` or `viem`
calls directly.

Preferred hooks and utilities:

```ts
// Wallet connection with AA smart account
import {
  useActiveAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useReadContract,
  useContractEvents,
} from "thirdweb/react";

import { inAppWallet, smartWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";

// Initialize client (uses THIRDWEB_CLIENT_ID from env)
const client = createThirdwebClient({
  clientId: process.env.THIRDWEB_CLIENT_ID!,
});

// Smart / gasless wallet setup
const wallet = smartWallet({
  chain,
  sponsorGas: true, // uses PAYMASTER_URL
});
```

- Always wrap the app in `<ThirdwebProvider>` at the root.
- Always use `useActiveAccount()` instead of manually tracking wallet state.
- Always use `useSendTransaction()` for mutations; never call contract methods directly.
- Always use `useReadContract()` for on-chain reads.

### 3. SBT / Lineage Contract Patterns
When generating contract interaction code for BitBelt SBTs or lineage reads,
follow this pattern:

```ts
import { getContract, prepareContractCall } from "thirdweb";
import { useSendTransaction, useReadContract } from "thirdweb/react";

const sbtContract = getContract({
  client,
  chain,
  address: process.env.SBT_CONTRACT_ADDRESS!,
});

// Minting (write)
const { mutate: sendTx } = useSendTransaction();
const mintTx = prepareContractCall({
  contract: sbtContract,
  method: "function mint(address to, uint256 beltRank)",
  params: [recipientAddress, beltRank],
});
sendTx(mintTx);

// Reading lineage (read)
const { data: lineage } = useReadContract({
  contract: sbtContract,
  method: "function getLineage(address student) view returns (address[])",
  params: [studentAddress],
});
```

### 4. Styling
- Use **NativeWind** (`className` prop) for all styling — never inline `StyleSheet.create`.
- Follow the "Grim-Cute" palette defined in `constants/Colors.ts`
  (deep purples, neon pinks, slate grays).

### 5. Environment Variables
Reference only the env vars defined in `.env.example`:
- `THIRDWEB_CLIENT_ID` — Thirdweb project client ID
- `PAYMASTER_URL` — ERC-4337 Paymaster URL for gasless transactions on Base
