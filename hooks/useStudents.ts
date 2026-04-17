/**
 * useStudents — Student registry backed by localStorage (web) or in-memory (native).
 *
 * Students are stored as JSON at localStorage key "bitbelt_students".
 * The hook re-renders all consumers whenever the list changes.
 */

import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  address: `0x${string}`;
  createdAt: number; // unix ms
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY = "bitbelt_students";

function load(): Student[] {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Student[]) : [];
    }
  } catch {
    // ignore
  }
  return _memCache;
}

function save(students: Student[]): void {
  _memCache = students;
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    }
  } catch {
    // ignore
  }
  // Notify all subscribed hooks
  _listeners.forEach((fn) => fn(students));
}

// Module-level in-memory cache + pub/sub so all hook instances stay in sync
let _memCache: Student[] = load();
type Listener = (students: Student[]) => void;
const _listeners = new Set<Listener>();

// ── Random wallet generator ────────────────────────────────────────────────────

export function generateRandomAddress(): `0x${string}` {
  const bytes = new Uint8Array(20);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // fallback for environments without Web Crypto
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

export function useStudents() {
  const [students, setStudents] = useState<Student[]>(() => load());

  useEffect(() => {
    // Subscribe to external mutations (other hook instances)
    _listeners.add(setStudents);
    return () => { _listeners.delete(setStudents); };
  }, []);

  const addStudent = useCallback(
    (name: string, address?: `0x${string}`): Student => {
      const student: Student = {
        id: randomId(),
        name: name.trim(),
        address: address ?? generateRandomAddress(),
        createdAt: Date.now(),
      };
      save([...load(), student]);
      return student;
    },
    []
  );

  const removeStudent = useCallback((id: string) => {
    save(load().filter((s) => s.id !== id));
  }, []);

  const search = useCallback(
    (query: string): Student[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase();
      return students.filter((s) => s.name.toLowerCase().includes(q));
    },
    [students]
  );

  return { students, addStudent, removeStudent, search };
}
