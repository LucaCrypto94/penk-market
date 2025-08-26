const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting USDC deployment to Sepolia...");
  
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
  
  console.log("\n📦 Deploying USDC contract...");
  
  try {
    const USDC = await hre.ethers.getContractFactory("USDC");
    const usdc = await USDC.deploy();
    
    console.log("⏳ Waiting for deployment confirmation...");
    await usdc.waitForDeployment();
    
    const contractAddress = await usdc.getAddress();
    
    console.log("\n🎉 USDC Contract Deployed Successfully!");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 Sepolia Explorer:", `https://sepolia.etherscan.io/address/${contractAddress}`);
    
    // Verify contract details
    console.log("\n📋 Contract Details:");
    console.log("   Name:", await usdc.name());
    console.log("   Symbol:", await usdc.symbol());
    console.log("   Decimals:", await usdc.decimals());
    console.log("   Total Supply:", hre.ethers.formatUnits(await usdc.totalSupply(), 6), "USDC");
    console.log("   Owner:", await usdc.owner());
    
    // Check deployer's USDC balance
    const deployerBalance = await usdc.balanceOf(deployer.address);
    console.log("   Deployer USDC Balance:", hre.ethers.formatUnits(deployerBalance, 6), "USDC");
    
    console.log("\n✅ Deployment completed successfully!");
    console.log("💡 You can now interact with your contract on Sepolia");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment script failed:", error);
    process.exit(1);
  }); 