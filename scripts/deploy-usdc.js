const hre = require("hardhat");

async function main() {
  console.log("Deploying USDC contract...");
  
  const USDC = await hre.ethers.getContractFactory("USDC");
  const usdc = await USDC.deploy();
  
  await usdc.waitForDeployment();

  console.log("USDC deployed to:", usdc.address);
  console.log("Token name:", await usdc.name());
  console.log("Token symbol:", await usdc.symbol());
  console.log("Total supply:", (await usdc.totalSupply()).toString());
  console.log("Decimals:", await usdc.decimals());
  
  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer USDC balance:", (await usdc.balanceOf(deployer.address)).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 