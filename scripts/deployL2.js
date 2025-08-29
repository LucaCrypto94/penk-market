const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying PenkMarketL2 contract...");

  // Verifier address (same as L1 deployment)
  const VERIFIER_ADDRESS = "0x73aF5be3DB46Ce3b7c50Fd833B9C60180f339449";

  console.log("📍 Verifier Address:", VERIFIER_ADDRESS);
  console.log("");

  // Get the contract factory
  const PenkMarketL2 = await ethers.getContractFactory("PenkMarketL2");

  // Deploy the contract
  console.log("📦 Deploying contract...");
  const penkMarketL2 = await PenkMarketL2.deploy(VERIFIER_ADDRESS);

  // Wait for deployment
  await penkMarketL2.waitForDeployment();

  const contractAddress = await penkMarketL2.getAddress();

  console.log("✅ PenkMarketL2 deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("📍 Verifier Address:", VERIFIER_ADDRESS);
  console.log("");

  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const deployedCode = await ethers.provider.getCode(contractAddress);
  if (deployedCode === "0x") {
    console.log("❌ Contract deployment failed - no code at address");
    return;
  }
  console.log("✅ Contract code verified at address");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    contractName: "PenkMarketL2",
    contractAddress: contractAddress,
    verifierAddress: VERIFIER_ADDRESS,
    network: "PEPU V2 Mainnet",
    rpcUrl: "https://rpc-pepu-v2-mainnet-0.t.conduit.xyz",
    deployer: (await ethers.getSigners())[0].address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: [VERIFIER_ADDRESS]
  };

  console.log("📋 Deployment Information:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");

  console.log("🎉 L2 deployment complete! Update your .env file with:");
  console.log(`NEXT_PUBLIC_L2_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("Next steps:");
  console.log("1. Fund the L2 contract with PEPU for user distributions");
  console.log("2. Test the swap function with the verifier key");
  console.log("3. Update the initiator with the new contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }); 