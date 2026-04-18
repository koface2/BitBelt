/**
 * useStudents — Student registry persisted via AsyncStorage (native) or
 * localStorage (web), namespaced per connected wallet address.
 *
 * Storage key format: "bitbelt_students:<walletAddress>"
 * Falls back to "bitbelt_students:guest" when no wallet is connected.
 *
 * All hook instances sharing the same walletAddress stay in sync via a
 * module-level pub/sub channel keyed by walletAddress.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  address: `0x${string}`;
  createdAt: number; // unix ms
}

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

  // Reload from storage whenever walletAddress changes
  useEffect(() => {
    walletRef.current = walletAddress;
    setIsLoading(true);
    loadAsync(walletAddress).then((loaded) => {
      setStudents(loaded);
      setIsLoading(false);
    });
    const unsub = subscribe(walletAddress, setStudents);
    return unsub;
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

  return { students, isLoading, addStudent, removeStudent, search };
}
