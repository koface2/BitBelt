// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {BitBeltSBT} from "../contracts/BitBeltSBT.sol";

/**
 * @title  DeployBitBelt
 * @notice Foundry broadcast script — deploys BitBeltSBT to Base Sepolia (testnet)
 *         or Base Mainnet, driven by environment variables.
 *
 * ── Quick start (Base Sepolia testnet) ───────────────────────────────────────
 *
 *   1. Copy .env.example → .env and fill in the values.
 *   2. Fund the deployer wallet with testnet ETH from
 *      https://www.alchemy.com/faucets/base-sepolia
 *   3. Run:
 *
 *      source .env
 *      forge script script/Deploy.s.sol:DeployBitBelt \
 *        --rpc-url base_sepolia \
 *        --broadcast \
 *        --verify \
 *        -vvvv
 *
 * ── Mainnet deploy ───────────────────────────────────────────────────────────
 *
 *      forge script script/Deploy.s.sol:DeployBitBelt \
 *        --rpc-url base_mainnet \
 *        --broadcast \
 *        --verify \
 *        -vvvv
 *
 *   The --verify flag submits the source to Basescan automatically using the
 *   BASESCAN_API_KEY from your .env.
 * ─────────────────────────────────────────────────────────────────────────────
 */
contract DeployBitBelt is Script {
    function run() external {
        // The address that will receive DEFAULT_ADMIN_ROLE and INSTRUCTOR_ROLE.
        // In production, replace with a multisig wallet address (e.g. Safe).
        address admin = vm.envAddress("DEPLOYER_ADDRESS");

        console2.log("============================================================");
        console2.log(" BitBelt SBT - Deployment Script");
        console2.log("============================================================");
        console2.log("  Chain ID      :", block.chainid);
        console2.log("  Admin address :", admin);
        console2.log("  Block number  :", block.number);
        console2.log("");

        // Sanity check: Base Sepolia = 84532, Base Mainnet = 8453
        require(
            block.chainid == 84532 || block.chainid == 8453,
            "Deploy: wrong network - target Base Sepolia (84532) or Base Mainnet (8453)"
        );

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        BitBeltSBT sbt = new BitBeltSBT(admin);

        vm.stopBroadcast();

        console2.log("  BitBeltSBT deployed at :", address(sbt));
        console2.log("");
        console2.log("  Next steps:");
        console2.log("  1. Copy the contract address above into your .env as SBT_CONTRACT_ADDRESS.");
        console2.log("  2. Grant INSTRUCTOR_ROLE to verified instructor wallets:");
        console2.log("       cast send <CONTRACT> 'grantRole(bytes32,address)'");
        console2.log("         $(cast keccak 'INSTRUCTOR_ROLE') <INSTRUCTOR_WALLET>");
        console2.log("         --rpc-url base_sepolia --private-key $PRIVATE_KEY");
        console2.log("  3. Test a mint:");
        console2.log("       cast send <CONTRACT> 'mintBelt(address,string,uint256)'");
        console2.log("         <STUDENT_WALLET> Blue 0");
        console2.log("         --rpc-url base_sepolia --private-key $PRIVATE_KEY");
        console2.log("============================================================");
    }
}
