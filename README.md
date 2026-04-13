# BitBelt
Verifying your BJJ belt and lineage on the blockchain

## Overview

BitBelt is a decentralized verification platform for Brazilian Jiu-Jitsu. It uses **Soulbound Tokens (SBTs)** on the **Base blockchain** to create an immutable, verifiable lineage of promotions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo) |
| Styling | Tailwind CSS via NativeWind |
| Blockchain | Thirdweb SDK v5 (Account Abstraction) |
| Network | Base Mainnet / Base Sepolia (Testnet) |
| Auth | Social Login (Google/Email) with gasless transactions |

## Features

- 🥋 **On-Chain Belt Records** — Every promotion is minted as a Soulbound Token (non-transferable)
- 🌳 **BJJ Lineage Tracking** — Follow the verifiable chain of instructors
- ⛽ **Gasless Transactions** — Sponsored via Thirdweb Account Abstraction
- 🔐 **Social Login** — Google/Email authentication via Thirdweb in-app wallets
- 📱 **Mobile-First** — React Native with Expo for iOS and Android

## Project Structure

```
BitBelt/
├── app/
│   ├── _layout.tsx              # Root layout with ThirdwebProvider
│   ├── index.tsx                # Entry redirect (auth or app)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx            # Social login screen
│   └── (app)/
│       ├── _layout.tsx          # Tab navigation
│       ├── index.tsx            # Dashboard / belt history
│       ├── promotion-screen.tsx # Issue belt promotions (SBT mint)
│       └── lineage-screen.tsx   # BJJ lineage tree viewer
├── components/
│   ├── BeltCard.tsx             # Belt display card
│   ├── PromotionCard.tsx        # Compact promotion record
│   └── LineageTree.tsx          # Lineage visualization
├── constants/
│   ├── belts.ts                 # Belt color/degree constants
│   └── contracts.ts             # Contract addresses & config
├── hooks/
│   └── useSBT.ts                # Thirdweb SBT interaction hook
├── tailwind.config.js           # NativeWind Tailwind config
├── babel.config.js              # Babel config with NativeWind
└── .env.example                 # Environment variables template
```

## File Naming Conventions

- **Components:** PascalCase (e.g., `BeltCard.tsx`, `LineageTree.tsx`)
- **Screens:** kebab-case (e.g., `promotion-screen.tsx`, `lineage-screen.tsx`)
- **Navigation:** Expo Router file-based routing

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Thirdweb](https://thirdweb.com/dashboard) account and Client ID

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/koface2/BitBelt.git
   cd BitBelt
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Thirdweb Client ID and contract addresses
   ```

3. **Start the app:**
   ```bash
   npm start          # Expo Go (scan QR code)
   npm run android    # Android emulator
   npm run ios        # iOS simulator (macOS only)
   npm run web        # Web browser
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_THIRDWEB_CLIENT_ID` | Thirdweb Client ID from dashboard |
| `EXPO_PUBLIC_NETWORK` | `mainnet` for Base, anything else for Base Sepolia |
| `EXPO_PUBLIC_ACCOUNT_FACTORY_ADDRESS` | Smart account factory for Account Abstraction |

## Smart Contract

The `BitBeltSBT` contract (deploy separately) must implement:

```solidity
function mintPromotion(
    address recipient,
    string memory beltColor,
    uint8 degree,
    string memory instructor,
    string memory gym,
    string memory metadataUri
) external returns (uint256 tokenId);

function getTokenData(uint256 tokenId) external view returns (
    string memory beltColor,
    uint8 degree,
    string memory instructor,
    string memory gym,
    uint256 promotedAt,
    string memory metadataUri
);
```

Tokens are soulbound — transfer functions are disabled (ERC-5192).

## Belt System

| Belt | Color |
|------|-------|
| White | `#FFFFFF` |
| Blue | `#1D4ED8` |
| Purple | `#7C3AED` |
| Brown | `#92400E` |
| Black | `#1F2937` |

Each belt can have 0–4 degree stripes.

## License

MIT

