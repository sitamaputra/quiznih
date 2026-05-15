// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy}    from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {QuizEscrow}      from "../src/QuizEscrow.sol";

/// @notice Deploys QuizEscrow behind an ERC1967 UUPS proxy.
///
/// Usage:
///   # Testnet (Alfajores)
///   forge script script/Deploy.s.sol --rpc-url alfajores --broadcast --verify
///
///   # Mainnet
///   forge script script/Deploy.s.sol --rpc-url celo --broadcast --verify
///
/// Set DEPLOYER_PRIVATE_KEY in .env before running.
contract Deploy is Script {
    function run() external returns (address proxy) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        console.log("Deploying QuizEscrow (UUPS)...");
        console.log("  Deployer :", deployer);
        console.log("  Chain ID :", block.chainid);

        vm.startBroadcast(deployerKey);

        // 1. Deploy implementation (constructor disables initializers)
        QuizEscrow impl = new QuizEscrow();

        // 2. Encode initialize() call
        bytes memory initData = abi.encodeWithSelector(
            QuizEscrow.initialize.selector,
            deployer
        );

        // 3. Deploy proxy — calls initialize() atomically
        proxy = address(new ERC1967Proxy(address(impl), initData));

        vm.stopBroadcast();

        console.log("Implementation :", address(impl));
        console.log("Proxy (use this):", proxy);
        console.log("Update NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS in the frontend .env.local with the proxy address");
    }
}
