const hre = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting L1 TokenEscrow deployment to Sepolia...");
    
    // Check if we have the required environment variables
    if (!process.env.SEPOLIA_RPC_URL) {
        throw new Error("❌ SEPOLIA_RPC_URL not found in environment variables");
    }
    
    if (!process.env.PRIVATE_KEY) {
        throw new Error("❌ PRIVATE_KEY not found in environment variables");
    }
    
    console.log("✅ Environment variables loaded");
    console.log("📡 Network: Sepolia Testnet");
    console.log("🔗 RPC URL:", process.env.SEPOLIA_RPC_URL);
    
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer address:", deployer.address);
    
    // Check deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");
    
    const minBalance = hre.ethers.parseEther("0.01");
    if (balance < minBalance) {
        throw new Error("❌ Insufficient balance. Need at least 0.01 ETH for deployment");
    }
    
    // Get addresses from environment variables
    const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;
    const pepuAddress = process.env.NEXT_PUBLIC_PEPU_ADDRESS;
    
    // Validate token addresses
    if (!usdcAddress) {
        throw new Error("❌ NEXT_PUBLIC_USDC_ADDRESS not found in environment variables");
    }
    if (!pepuAddress) {
        throw new Error("❌ NEXT_PUBLIC_PEPU_ADDRESS not found in environment variables");
    }
    
    console.log("\n📋 Contract Addresses:");
    console.log("   USDC Address:", usdcAddress);
    console.log("   PEPU Address:", pepuAddress);
    
    // Set the specific verifier address
    const verifierAddress = "0x73aF5be3DB46Ce3b7c50Fd833B9C60180f339449";
    console.log("   Verifier Address:", verifierAddress);
    
    console.log("\n📦 Deploying L1 TokenEscrow contract...");
    
    try {
        // Get the contract factory for the TokenEscrow contract
        const TokenEscrow = await hre.ethers.getContractFactory("TokenEscrow");
        const tokenEscrow = await TokenEscrow.deploy(
            usdcAddress,
            pepuAddress,
            verifierAddress
        );
        
        console.log("⏳ Waiting for deployment confirmation...");
        await tokenEscrow.waitForDeployment();
        
        const contractAddress = await tokenEscrow.getAddress();
        
        console.log("\n🎉 TokenEscrow Contract Deployed Successfully!");
        console.log("📍 Contract Address:", contractAddress);
        console.log("🔗 Sepolia Explorer:", `https://sepolia.etherscan.io/address/${contractAddress}`);
        
        // Verify deployment by checking the stored addresses
        console.log("\n📋 Contract Details:");
        const storedUSDC = await tokenEscrow.USDC_ADDRESS();
        const storedPEPU = await tokenEscrow.PEPU_ADDRESS();
        const storedVerifier = await tokenEscrow.VERIFIER_ADDRESS();
        const owner = await tokenEscrow.owner();
        
        console.log("   Stored USDC Address:", storedUSDC);
        console.log("   Stored PEPU Address:", storedPEPU);
        console.log("   Stored Verifier Address:", storedVerifier);
        console.log("   Contract Owner:", owner);
        
        // Verify addresses match
        if (storedUSDC.toLowerCase() === usdcAddress.toLowerCase() &&
            storedPEPU.toLowerCase() === pepuAddress.toLowerCase() &&
            storedVerifier.toLowerCase() === verifierAddress.toLowerCase()) {
            console.log("✅ All addresses verified successfully!");
        } else {
            console.log("❌ Address verification failed!");
        }
        
        // Save deployment info to a file
        const deploymentInfo = {
            contractAddress: contractAddress,
            deployer: deployer.address,
            usdcAddress: usdcAddress,
            pepuAddress: pepuAddress,
            verifierAddress: verifierAddress,
            network: "sepolia",
            deployedAt: new Date().toISOString()
        };
        
        const fs = require("fs");
        fs.writeFileSync(
            "deployment-info.json",
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log("\n📄 Deployment info saved to deployment-info.json");
        
        // Display contract interaction examples
        console.log("\n📖 Contract Interaction Examples:");
        console.log("// Buy with ETH");
        console.log(`await contract.buy("my order", { value: hre.ethers.parseEther("0.1") });`);
        console.log("\n// Buy with USDC (approve first)");
        console.log(`await usdcContract.approve("${contractAddress}", amount);`);
        console.log(`await contract.buyWithUSDC("my order", amount);`);
        console.log("\n// Buy with PEPU (approve first)");
        console.log(`await pepuContract.approve("${contractAddress}", amount);`);
        console.log(`await contract.buyWithPEPU("my order", amount);`);
        
        console.log("\n✅ Deployment completed successfully!");
        console.log("💡 You can now interact with your TokenEscrow contract on Sepolia");
        
        return tokenEscrow;
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        throw error;
    }
}

// Error handling
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n💥 Deployment script failed:", error);
        process.exit(1);
    });