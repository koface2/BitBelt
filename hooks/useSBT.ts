import { useState, useCallback } from "react";
import {
  getContract,
  prepareContractCall,
  sendTransaction,
  readContract,
} from "thirdweb";
import { base, baseSepolia } from "thirdweb/chains";
import { useActiveAccount } from "thirdweb/react";
import {
  ACTIVE_NETWORK,
  THIRDWEB_CLIENT_ID,
  isContractConfigured,
} from "@/constants/contracts";
import { createThirdwebClient } from "thirdweb";
import type { BeltColor, BeltDegree } from "@/constants/belts";

const client = createThirdwebClient({ clientId: THIRDWEB_CLIENT_ID });

const chain = ACTIVE_NETWORK.CHAIN_ID === 8453 ? base : baseSepolia;

export interface SBTToken {
  tokenId: string;
  beltColor: BeltColor;
  degree: BeltDegree;
  /** Human-readable instructor name */
  instructorName: string;
  /** Instructor's wallet address — used for lineage traversal */
  instructorAddress: string;
  gym: string;
  promotedAt: number;
  metadataUri: string;
}

export function useSBT() {
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contract = getContract({
    client,
    chain,
    address: ACTIVE_NETWORK.SBT_CONTRACT,
  });

  /**
   * Fetch all SBT tokens owned by an address (or the active wallet).
   * Returns an empty array if the contract is not yet configured.
   */
  const fetchTokens = useCallback(
    async (address?: string): Promise<SBTToken[]> => {
      const owner = address ?? account?.address;
      if (!owner) return [];

      if (!isContractConfigured(ACTIVE_NETWORK.SBT_CONTRACT)) {
        setError("SBT contract address is not configured.");
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const balance = await readContract({
          contract,
          method:
            "function balanceOf(address owner) view returns (uint256)",
          params: [owner],
        });

        const tokens: SBTToken[] = [];
        const count = Number(balance);

        for (let i = 0; i < count; i++) {
          const tokenId = await readContract({
            contract,
            method:
              "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
            params: [owner, BigInt(i)],
          });

          // Contract returns: beltColor, degree, instructorName, instructorAddress, gym, promotedAt, metadataUri
          const tokenData = await readContract({
            contract,
            method:
              "function getTokenData(uint256 tokenId) view returns (string beltColor, uint8 degree, string instructorName, address instructorAddress, string gym, uint256 promotedAt, string metadataUri)",
            params: [tokenId],
          });

          tokens.push({
            tokenId: tokenId.toString(),
            beltColor: tokenData[0] as BeltColor,
            degree: tokenData[1] as BeltDegree,
            instructorName: tokenData[2],
            instructorAddress: tokenData[3],
            gym: tokenData[4],
            promotedAt: Number(tokenData[5]),
            metadataUri: tokenData[6],
          });
        }

        return tokens;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch tokens";
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [account, contract]
  );

  /**
   * Mint a new SBT promotion token (instructor-initiated).
   * Returns the transaction hash, or null on failure.
   * No-ops if the contract address is not configured.
   */
  const mintPromotion = useCallback(
    async (params: {
      recipient: string;
      beltColor: BeltColor;
      degree: BeltDegree;
      instructorName: string;
      instructorAddress: string;
      gym: string;
      metadataUri: string;
    }): Promise<string | null> => {
      if (!account) {
        setError("No wallet connected");
        return null;
      }

      if (!isContractConfigured(ACTIVE_NETWORK.SBT_CONTRACT)) {
        setError("SBT contract address is not configured.");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const transaction = prepareContractCall({
          contract,
          method:
            "function mintPromotion(address recipient, string beltColor, uint8 degree, string instructorName, address instructorAddress, string gym, string metadataUri) returns (uint256)",
          params: [
            params.recipient,
            params.beltColor,
            params.degree,
            params.instructorName,
            params.instructorAddress,
            params.gym,
            params.metadataUri,
          ],
        });

        const result = await sendTransaction({
          transaction,
          account,
        });

        return result.transactionHash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to mint promotion";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [account, contract]
  );

  /**
   * Fetch the lineage (chain of instructors) for an address.
   * Traversal uses `instructorAddress` — the on-chain wallet address of the instructor,
   * which is distinct from `instructorName` (the human-readable display name).
   */
  const fetchLineage = useCallback(
    async (address?: string): Promise<SBTToken[][]> => {
      const startAddress = address ?? account?.address;
      if (!startAddress) return [];

      setLoading(true);
      setError(null);

      try {
        const lineage: SBTToken[][] = [];
        let currentAddress: string = startAddress;
        const visited = new Set<string>();

        while (currentAddress && !visited.has(currentAddress.toLowerCase())) {
          visited.add(currentAddress.toLowerCase());
          const tokens = await fetchTokens(currentAddress);
          if (tokens.length > 0) {
            lineage.push(tokens);
            // Follow the instructor wallet address chain
            const latestToken = tokens[tokens.length - 1];
            const nextAddress = latestToken.instructorAddress;
            // Stop if next address is zero or identical to current
            if (
              !nextAddress ||
              !isContractConfigured(nextAddress) ||
              nextAddress.toLowerCase() === currentAddress.toLowerCase()
            ) {
              break;
            }
            currentAddress = nextAddress;
          } else {
            break;
          }
        }

        return lineage;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch lineage";
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [account, fetchTokens]
  );

  return {
    loading,
    error,
    fetchTokens,
    mintPromotion,
    fetchLineage,
  };
}

