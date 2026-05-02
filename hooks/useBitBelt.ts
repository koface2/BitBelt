/**
 * useBitBelt — convenience re-export of the core BitBelt SDK atoms.
 *
 * Use this hook in screens that need the client, chain, contract, or wallet
 * without importing each constant individually.
 */

import { client, chain, sbtContract, wallet, INSTRUCTOR_ROLE, DEFAULT_ADMIN_ROLE } from "@/constants/BitBelt";

export function useBitBelt() {
  return { client, chain, sbtContract, wallet, INSTRUCTOR_ROLE, DEFAULT_ADMIN_ROLE };
}
