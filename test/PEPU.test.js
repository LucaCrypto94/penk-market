const { expect } = require("chai");

describe("PEPU", function () {
  let pepu;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const PEPU = await ethers.getContractFactory("PEPU");
    pepu = await PEPU.deploy();
    await pepu.waitForDeployment();
  });

  it("Should have correct name and symbol", async function () {
    expect(await pepu.name()).to.equal("PEPU Token");
    expect(await pepu.symbol()).to.equal("PEPU");
  });

  it("Should have 18 decimals", async function () {
    expect(await pepu.decimals()).to.equal(18);
  });

  it("Should mint 1,000,000 PEPU to owner", async function () {
    const totalSupply = await pepu.totalSupply();
    const expectedSupply = ethers.parseUnits("1000000", 18); // 1000000 * 10^18
    expect(totalSupply).to.equal(expectedSupply);
    
    const ownerBalance = await pepu.balanceOf(owner.address);
    expect(ownerBalance).to.equal(expectedSupply);
  });

  it("Should allow owner to mint tokens", async function () {
    const mintAmount = ethers.parseUnits("100000", 18); // 100,000 PEPU
    await pepu.mint(addr1.address, mintAmount);
    
    const addr1Balance = await pepu.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(mintAmount);
  });

  it("Should not allow non-owner to mint tokens", async function () {
    const mintAmount = ethers.parseUnits("100000", 18);
    
    await expect(
      pepu.connect(addr1).mint(addr2.address, mintAmount)
    ).to.be.revertedWithCustomError(pepu, "OwnableUnauthorizedAccount");
  });

  it("Should allow users to burn their own tokens", async function () {
    // First mint some tokens to addr1
    const mintAmount = ethers.parseUnits("100000", 18);
    await pepu.mint(addr1.address, mintAmount);
    
    // Then burn half of them
    const burnAmount = ethers.parseUnits("50000", 18);
    await pepu.connect(addr1).burn(burnAmount);
    
    const remainingBalance = await pepu.balanceOf(addr1.address);
    expect(remainingBalance).to.equal(ethers.parseUnits("50000", 18));
  });

  it("Should allow transfers between users", async function () {
    const transferAmount = ethers.parseUnits("100000", 18);
    await pepu.transfer(addr1.address, transferAmount);
    
    const addr1Balance = await pepu.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
    
    const ownerBalance = await pepu.balanceOf(owner.address);
    const expectedOwnerBalance = ethers.parseUnits("900000", 18); // 1000000 - 100000
    expect(ownerBalance).to.equal(expectedOwnerBalance);
  });
}); 