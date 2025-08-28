const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying PenkMarketL1 contract...");

  // Get the contract factory
  const PenkMarketL1 = await ethers.getContractFactory("PenkMarketL1");

  // Contract addresses from environment variables
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
  const PEPU_ADDRESS = process.env.NEXT_PUBLIC_PEPU_ADDRESS;
  const VERIFIER_ADDRESS = "0x73aF5be3DB46Ce3b7c50Fd833B9C60180f339449";

  // Validate addresses
  if (!USDC_ADDRESS || !PEPU_ADDRESS) {
    throw new Error("❌ Missing USDC or PEPU address in environment variables");
  }

  console.log("📋 Deployment Parameters:");
  console.log("   USDC Address:", USDC_ADDRESS);
  console.log("   PEPU Address:", PEPU_ADDRESS);
  console.log("   Verifier Address:", VERIFIER_ADDRESS);

  // Deploy the contract
  const penkMarketL1 = await PenkMarketL1.deploy(
    USDC_ADDRESS,
    PEPU_ADDRESS,
    VERIFIER_ADDRESS
  );

  await penkMarketL1.waitForDeployment();
  const deployedAddress = await penkMarketL1.getAddress();

  console.log("✅ PenkMarketL1 deployed successfully!");
  console.log("   Contract Address:", deployedAddress);
  console.log("   Owner:", await penkMarketL1.owner());
  console.log("   Verifier:", await penkMarketL1.VERIFIER_ADDRESS());
  console.log("   PenkBonus (default):", (await penkMarketL1.penkBonusBasisPoints()).toString(), "basis points (2%)");

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const usdcAddress = await penkMarketL1.USDC_ADDRESS();
  const pepuAddress = await penkMarketL1.PEPU_ADDRESS();
  const verifierAddress = await penkMarketL1.VERIFIER_ADDRESS();

  if (usdcAddress === USDC_ADDRESS && 
      pepuAddress === PEPU_ADDRESS && 
      verifierAddress === VERIFIER_ADDRESS) {
    console.log("✅ Contract verification successful!");
  } else {
    console.log("❌ Contract verification failed!");
    console.log("   Expected USDC:", USDC_ADDRESS, "Got:", usdcAddress);
    console.log("   Expected PEPU:", PEPU_ADDRESS, "Got:", pepuAddress);
    console.log("   Expected Verifier:", VERIFIER_ADDRESS, "Got:", verifierAddress);
  }

  console.log("\n📝 Deployment Summary:");
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Block Number:", await ethers.provider.getBlockNumber());
  console.log("   Gas Used:", (await penkMarketL1.deploymentTransaction()).gasLimit.toString());

  return deployedAddress;
}

main()
  .then((address) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("   Contract deployed at:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }); 