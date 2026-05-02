// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BitBeltSBT} from "../contracts/BitBeltSBT.sol";

/**
 * @title  GrantRoles
 * @notice Grants DEFAULT_ADMIN_ROLE and INSTRUCTOR_ROLE to a target address.
 *         Run this with the deployer key once you know your Thirdweb social-login
 *         smart account address.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *
 *   1. Find your smart account address by signing into the app and copying the
 *      address shown on the dashboard (or from the Thirdweb dashboard).
 *
 *   2. Set it in your .env:
 *
 *        GRANT_TARGET=0xYourSmartAccountAddressHere
 *
 *   3. Run:
 *
 *        source .env
 *        forge script script/GrantRoles.s.sol:GrantRoles \
 *          --rpc-url base_sepolia \
 *          --broadcast \
 *          -vvvv
 *
 *   The DEPLOYER_ADDRESS private key must correspond to the current
 *   DEFAULT_ADMIN_ROLE holder (0x56edD8E0b4eA14ca259f313291B9468553e2Ae94).
 * ─────────────────────────────────────────────────────────────────────────────
 */
contract GrantRoles is Script {
    // Deployed contract address on Base Sepolia
    address constant SBT_CONTRACT = 0x64208D7A2BAF2BeC10cd08386C9A579Eb8f8a872;

    bytes32 constant DEFAULT_ADMIN_ROLE = bytes32(0);
    bytes32 constant INSTRUCTOR_ROLE    = keccak256("INSTRUCTOR_ROLE");

    function run() external {
        address target = vm.envAddress("GRANT_TARGET");
        require(target != address(0), "GrantRoles: GRANT_TARGET not set");

        BitBeltSBT sbt = BitBeltSBT(SBT_CONTRACT);

        console2.log("============================================================");
        console2.log(" BitBelt SBT - Grant Roles");
        console2.log("============================================================");
        console2.log("  Contract      :", SBT_CONTRACT);
        console2.log("  Target        :", target);
        console2.log("");

        vm.startBroadcast();

        if (!sbt.hasRole(DEFAULT_ADMIN_ROLE, target)) {
            sbt.grantRole(DEFAULT_ADMIN_ROLE, target);
            console2.log("  [+] Granted DEFAULT_ADMIN_ROLE");
        } else {
            console2.log("  [=] DEFAULT_ADMIN_ROLE already held");
        }

        if (!sbt.hasRole(INSTRUCTOR_ROLE, target)) {
            sbt.grantRole(INSTRUCTOR_ROLE, target);
            console2.log("  [+] Granted INSTRUCTOR_ROLE");
        } else {
            console2.log("  [=] INSTRUCTOR_ROLE already held");
        }

        vm.stopBroadcast();

        console2.log("");
        console2.log("  Done. Target now has full admin + instructor access.");
        console2.log("============================================================");
    }
}
