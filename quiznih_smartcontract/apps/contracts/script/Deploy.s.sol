// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy}    from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {QuizEscrow}      from "../src/QuizEscrow.sol";
import {SpinWheel}       from "../src/SpinWheel.sol";

/// @notice Deploys QuizEscrow dan SpinWheel masing-masing di balik ERC1967 UUPS proxy.
///
/// Usage:
///   # Testnet (Alfajores)
///   forge script script/Deploy.s.sol --rpc-url alfajores --broadcast --verify
///
///   # Celo Sepolia
///   forge script script/Deploy.s.sol --rpc-url celo-sepolia --broadcast --verify
///
///   # Mainnet
///   forge script script/Deploy.s.sol --rpc-url celo --broadcast --verify
///
/// Set di .env sebelum menjalankan:
///   DEPLOYER_PRIVATE_KEY   = private key deployer (tanpa 0x)
///   TRUSTED_SIGNER_ADDRESS = address backend wallet yang sign klaim pemenang
///   CELOSCAN_API_KEY       = (opsional) untuk verifikasi kontrak
contract Deploy is Script {
    function run() external returns (address quizProxy, address spinProxy) {
        uint256 deployerKey  = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer     = vm.addr(deployerKey);
        address trustedSigner = vm.envAddress("TRUSTED_SIGNER_ADDRESS");

        console.log("=== Quiznih Deploy ===");
        console.log("Deployer      :", deployer);
        console.log("TrustedSigner :", trustedSigner);
        console.log("Chain ID      :", block.chainid);

        vm.startBroadcast(deployerKey);

        // ─── QuizEscrow ─────────────────────────────────────────

        console.log("\n--- Deploying QuizEscrow ---");

        QuizEscrow quizImpl = new QuizEscrow();

        bytes memory quizInit = abi.encodeWithSelector(
            QuizEscrow.initialize.selector,
            deployer,
            trustedSigner
        );

        quizProxy = address(new ERC1967Proxy(address(quizImpl), quizInit));

        console.log("QuizEscrow impl  :", address(quizImpl));
        console.log("QuizEscrow proxy :", quizProxy);

        // ─── SpinWheel ───────────────────────────────────────────

        console.log("\n--- Deploying SpinWheel ---");

        SpinWheel spinImpl = new SpinWheel();

        bytes memory spinInit = abi.encodeWithSelector(
            SpinWheel.initialize.selector,
            deployer,
            trustedSigner
        );

        spinProxy = address(new ERC1967Proxy(address(spinImpl), spinInit));

        console.log("SpinWheel impl  :", address(spinImpl));
        console.log("SpinWheel proxy :", spinProxy);

        vm.stopBroadcast();

        console.log("\n=== Selesai. Update .env.local frontend: ===");
        console.log("NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS=", quizProxy);
        console.log("NEXT_PUBLIC_SPIN_WHEEL_ADDRESS= ", spinProxy);
    }
}
