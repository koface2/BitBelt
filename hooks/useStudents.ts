/**
 * useStudents — Student registry persisted via AsyncStorage (native) or
 * localStorage (web), namespaced per connected wallet address.
 *
 * Storage key format: "bitbelt_students:<walletAddress>"
 * Falls back to "bitbelt_students:guest" when no wallet is connected.
 *
 * All hook instances sharing the same walletAddress stay in sync via a
 * module-level pub/sub channel keyed by walletAddress.
 *
 * Recovery: recoverFromChain() reads past BeltMinted events from the on-chain
 * contract and imports any student addresses not already in the local roster.
 * Useful when localStorage is wiped (e.g. ngrok URL change in dev).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getContractEvents, prepareEvent } from "thirdweb";
import { sbtContract } from "@/constants/BitBelt";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  address: `0x${string}`;
  createdAt: number; // unix ms
}

// ── On-chain recovery constants ───────────────────────────────────────────────

/** Block where BitBeltSBT was deployed on Base Sepolia — avoids scanning from 0. */
const DEPLOY_BLOCK = 40468032n;

/** Prepared event definition for BeltMinted — used for chain recovery. */
const beltMintedEvent = prepareEvent({
  signature:
    "event BeltMinted(uint256 indexed tokenId, address indexed student, address indexed instructorAddress, string beltColor, uint256 promotionDate, string studentName, string instructorName)",
});

// ── Storage key ───────────────────────────────────────────────────────────────

function storageKey(walletAddress: string): string {
  return `bitbelt_students:${walletAddress.toLowerCase()}`;
}

// ── Cross-platform load / save ────────────────────────────────────────────────

/** Legacy key used before per-wallet namespacing was added. */
const LEGACY_STORAGE_KEY = "bitbelt_students";

async function loadAsync(walletAddress: string): Promise<Student[]> {
  const key = storageKey(walletAddress);
  // Never migrate legacy data into the anonymous "guest" namespace —
  // doing so would delete the legacy key before the real wallet address is
  // known, making the data unreachable once AutoConnect fires.
  const isGuest = walletAddress === "guest";

  try {
    // ── 1. Try the wallet-scoped key first ──────────────────────────────
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Student[];
    } else {
      const raw = await AsyncStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Student[];
    }

    if (isGuest) return [];

    // ── 2. One-time migration from the old flat legacy key ──────────────
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const oldRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (oldRaw) {
        localStorage.setItem(key, oldRaw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        localStorage.removeItem(storageKey("guest")); // clean up if guest got there first
        return JSON.parse(oldRaw) as Student[];
      }
      // ── 3. Recovery: guest may have claimed the legacy data before wallet 
      //    was known. Reclaim it under the real wallet address.
      const guestRaw = localStorage.getItem(storageKey("guest"));
      if (guestRaw) {
        localStorage.setItem(key, guestRaw);
        localStorage.removeItem(storageKey("guest"));
        return JSON.parse(guestRaw) as Student[];
      }
    } else {
      const oldRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (oldRaw) {
        await AsyncStorage.setItem(key, oldRaw);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
        await AsyncStorage.removeItem(storageKey("guest"));
        return JSON.parse(oldRaw) as Student[];
      }
      // ── 3. Recovery: guest may have claimed the legacy data first.
      const guestRaw = await AsyncStorage.getItem(storageKey("guest"));
      if (guestRaw) {
        await AsyncStorage.setItem(key, guestRaw);
        await AsyncStorage.removeItem(storageKey("guest"));
        return JSON.parse(guestRaw) as Student[];
      }
    }

    return [];
  } catch {
    return [];
  }
}

async function saveAsync(walletAddress: string, students: Student[]): Promise<void> {
  try {
    const json = JSON.stringify(students);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(storageKey(walletAddress), json);
    } else {
      await AsyncStorage.setItem(storageKey(walletAddress), json);
    }
  } catch {
    // ignore write errors
  }
  // Notify all subscribed hook instances for this wallet
  _listeners.get(walletAddress.toLowerCase())?.forEach((fn) => fn(students));
}

// ── Module-level pub/sub (per wallet) ────────────────────────────────────────

type Listener = (students: Student[]) => void;
const _listeners = new Map<string, Set<Listener>>();

function subscribe(walletAddress: string, fn: Listener): () => void {
  const key = walletAddress.toLowerCase();
  if (!_listeners.has(key)) _listeners.set(key, new Set());
  _listeners.get(key)!.add(fn);
  return () => _listeners.get(key)?.delete(fn);
}

// ── Random wallet generator ────────────────────────────────────────────────────

export function generateRandomAddress(): `0x${string}` {
  const bytes = new Uint8Array(20);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

// ── Random ID ─────────────────────────────────────────────────────────────────

function randomId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * @param walletAddress - The instructor's connected wallet address.
 *   Pass `account?.address` from `useActiveAccount()`. Defaults to "guest"
 *   so the hook is safe to use before a wallet is connected.
 */
export function useStudents(walletAddress: string = "guest") {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const walletRef = useRef(walletAddress);

  // Reload from storage whenever walletAddress changes; auto-recover from
  // chain on first login if the local roster is empty.
  useEffect(() => {
    walletRef.current = walletAddress;
    setIsLoading(true);
    loadAsync(walletAddress).then(async (loaded) => {
      setStudents(loaded);
      // If the wallet is real and the local cache is empty, pull from chain
      // automatically so data survives device switches / cache wipes.
      if (loaded.length === 0 && walletAddress !== "guest") {
        try {
          await recoverFromChain();
          const recovered = await loadAsync(walletAddress);
          setStudents(recovered);
        } catch {
          // chain unavailable — user can retry manually
        }
      }
      setIsLoading(false);
    });
    const unsub = subscribe(walletAddress, setStudents);
    return unsub;
    // recoverFromChain is stable (useCallback with no deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const addStudent = useCallback(
    async (name: string, address?: `0x${string}`): Promise<Student> => {
      const student: Student = {
        id: randomId(),
        name: name.trim(),
        address: address ?? generateRandomAddress(),
        createdAt: Date.now(),
      };
      const current = await loadAsync(walletRef.current);
      await saveAsync(walletRef.current, [...current, student]);
      return student;
    },
    []
  );

  const removeStudent = useCallback(async (id: string) => {
    const current = await loadAsync(walletRef.current);
    await saveAsync(walletRef.current, current.filter((s) => s.id !== id));
  }, []);

  const search = useCallback(
    (query: string): Student[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase();
      return students.filter((s) => s.name.toLowerCase().includes(q));
    },
    [students]
  );

  /**
   * Queries past BeltMinted events from the contract, filtered to this
   * instructor's address, and imports any student addresses not already in the
   * local roster.  Names default to a shortened address ("0xAbCd…1234") and
   * can be edited afterward.
   *
   * @returns number of new students imported
   */
  const recoverFromChain = useCallback(async (): Promise<number> => {
    const addr = walletRef.current;
    if (!addr || addr === "guest") return 0;

    const events = await getContractEvents({
      contract: sbtContract,
      events: [beltMintedEvent],
      fromBlock: DEPLOY_BLOCK,
    });

    const current = await loadAsync(addr);
    const existingAddresses = new Set(current.map((s) => s.address.toLowerCase()));

    const toAdd: Student[] = [];
    const seen = new Set<string>();

    for (const ev of events) {
      const studentAddr = ev.args.instructorAddress
        ? (ev.args as { student: `0x${string}`; instructorAddress: `0x${string}`; promotionDate: bigint }).student
        : null;
      const instructorAddr = (ev.args as { instructorAddress: `0x${string}` }).instructorAddress;

      if (!studentAddr) continue;
      if (instructorAddr?.toLowerCase() !== addr.toLowerCase()) continue;
      if (existingAddresses.has(studentAddr.toLowerCase())) continue;
      if (seen.has(studentAddr.toLowerCase())) continue;

      seen.add(studentAddr.toLowerCase());
      const args = ev.args as {
        promotionDate: bigint;
        studentName?: string;
      };
      const ts = Number(args.promotionDate ?? 0n) * 1000;
      const displayName =
        args.studentName?.trim() ||
        `${studentAddr.slice(0, 6)}…${studentAddr.slice(-4)}`;
      toAdd.push({
        id: randomId(),
        name: displayName,
        address: studentAddr,
        createdAt: ts > 0 ? ts : Date.now(),
      });
    }

    if (toAdd.length > 0) {
      await saveAsync(addr, [...current, ...toAdd]);
    }
    return toAdd.length;
  }, []);

  return { students, isLoading, addStudent, removeStudent, search, recoverFromChain };
}
