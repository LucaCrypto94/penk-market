const hre = require("hardhat");

async function main() {
  const SampleContract = await hre.ethers.getContractFactory("SampleContract");
  const sampleContract = await SampleContract.deploy("Hello from Penk Market!");
  
  await sampleContract.waitForDeployment();

  console.log("SampleContract deployed to:", sampleContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 