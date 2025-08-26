const { ethers, hre } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting PenkMarketL2 deployment...");
    
    // Get the contract factory
    const PenkMarketL2 = await ethers.getContractFactory("PenkMarketL2");
    
    // Validate environment variables
    if (!process.env.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY not found in .env file");
    }
    
    console.log("Environment variables loaded:");
    try {
        console.log("Network:", hre.network?.name || "Unknown");
    } catch (error) {
        console.log("Network: Unknown (network info not available)");
    }
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    // Check deployer balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "PEPU");
    
    // Use the same verifier address from the other contracts
    const verifierAddress = "0x73aF5be3DB46Ce3b7c50Fd833B9C60180f339449";
    console.log("Verifier Address:", verifierAddress);
    
    // Deploy the contract
    console.log("\n📦 Deploying PenkMarketL2 contract...");
    const penkMarketL2 = await PenkMarketL2.deploy(verifierAddress);
    
    // Wait for deployment to complete
    await penkMarketL2.waitForDeployment();
    
    console.log("\n🎉 PenkMarketL2 deployed successfully!");
    const deploymentTx = await penkMarketL2.deploymentTransaction();
    console.log("Contract Address:", await penkMarketL2.getAddress());
    console.log("Transaction Hash:", deploymentTx.hash);
    console.log("Gas Used:", deploymentTx.gasLimit.toString());
    
    // Verify deployment by checking the stored addresses
    console.log("\n🔍 Verifying deployment...");
    const storedVerifier = await penkMarketL2.VERIFIER_ADDRESS();
    const owner = await penkMarketL2.owner();
    const quoterAddress = await penkMarketL2.QUOTER_ADDRESS();
    const swapRouterAddress = await penkMarketL2.SWAP_ROUTER_ADDRESS();
    const wpepuAddress = await penkMarketL2.WPEPU_ADDRESS();
    
    console.log("Stored Verifier Address:", storedVerifier);
    console.log("Contract Owner:", owner);
    console.log("Quoter Address:", quoterAddress);
    console.log("Swap Router Address:", swapRouterAddress);
    console.log("WPEPU Address:", wpepuAddress);
    
    // Verify addresses match
    if (storedVerifier.toLowerCase() === verifierAddress.toLowerCase()) {
        console.log("✅ Verifier address verified successfully!");
    } else {
        console.log("❌ Verifier address verification failed!");
    }
    
    // Check contract balance (should be 0 initially)
    const contractBalance = await penkMarketL2.getContractBalance();
    console.log("Initial Contract PEPU Balance:", ethers.formatEther(contractBalance), "PEPU");
    
    // Save deployment info to a file
    const deploymentInfo = {
        contractName: "PenkMarketL2",
        contractAddress: await penkMarketL2.getAddress(),
        deploymentBlock: deploymentTx.blockNumber,
        deploymentTxHash: deploymentTx.hash,
        deployer: deployer.address,
        verifierAddress: verifierAddress,
        quoterAddress: quoterAddress,
        swapRouterAddress: swapRouterAddress,
        wpepuAddress: wpepuAddress,
        network: (() => {
            try {
                return hre.network?.name || "Unknown";
            } catch (error) {
                return "Unknown";
            }
        })(),
        deployedAt: new Date().toISOString()
    };
    
    const fs = require("fs");
    fs.writeFileSync(
        "penkmarket-deployment-info.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n📄 Deployment info saved to penkmarket-deployment-info.json");
    
    // Display contract interaction examples
    console.log("\n📖 Contract Interaction Examples:");
    console.log("// Deposit PEPU (anyone can call)");
    console.log(`await contract.deposit({ value: ethers.parseEther("100") });`);
    
    console.log("\n// Swap (only owner or verifier can call)");
    console.log(`await contract.swap(`);
    console.log(`    ethers.parseEther("50"),              // Amount of PEPU to swap`);
    console.log(`    "0x82144C93bd531E46F31033FE22D1055Af17A514c", // Target token address`);
    console.log(`    "0x...userAddress"                          // User who gets tokens`);
    console.log(`);`);
    
    console.log("\n// Withdraw PEPU (only owner or verifier can call)");
    console.log(`await contract.withdraw(ethers.parseEther("25"));`);
    
    console.log("\n// Get quote (view function)");
    console.log(`const [amountOut, fee] = await contract.getQuote(`);
    console.log(`    ethers.parseEther("10"),              // PEPU amount`);
    console.log(`    "0x82144C93bd531E46F31033FE22D1055Af17A514c"  // Target token`);
    console.log(`);`);
    
    console.log("\n🏪 PenkMarketL2 Contract Features:");
    console.log("✅ Native PEPU deposits (anyone)");
    console.log("✅ Swap function (owner/verifier only)");
    console.log("✅ PEPU withdrawals (owner/verifier only)");
    console.log("✅ Multi fee tier liquidity detection");
    console.log("✅ Slippage protection (0.5% default)");
    console.log("✅ Emergency pause functionality");
    console.log("✅ Event emission for all swaps");
    
    console.log("\n⚡ Integrated DEX Addresses:");
    console.log(`📊 Quoter: ${quoterAddress}`);
    console.log(`🔄 SwapRouter: ${swapRouterAddress}`);
    console.log(`💰 WPEPU: ${wpepuAddress}`);
    
    return penkMarketL2;
}

// Error handling
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });