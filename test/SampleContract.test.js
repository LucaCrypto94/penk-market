const { expect } = require("chai");

describe("SampleContract", function () {
  let sampleContract;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    
    const SampleContract = await ethers.getContractFactory("SampleContract");
    sampleContract = await SampleContract.deploy("Hello World");
    await sampleContract.waitForDeployment();
  });

  it("Should set the correct message", async function () {
    expect(await sampleContract.getMessage()).to.equal("Hello World");
  });

  it("Should update message correctly", async function () {
    await sampleContract.setMessage("New Message");
    expect(await sampleContract.getMessage()).to.equal("New Message");
  });
}); 