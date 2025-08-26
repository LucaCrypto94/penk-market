const { expect } = require("chai");

describe("USDC", function () {
  let usdc;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const USDC = await ethers.getContractFactory("USDC");
    usdc = await USDC.deploy();
    await usdc.waitForDeployment();
  });

  it("Should have correct name and symbol", async function () {
    expect(await usdc.name()).to.equal("USD Coin");
    expect(await usdc.symbol()).to.equal("USDC");
  });

  it("Should have 6 decimals", async function () {
    expect(await usdc.decimals()).to.equal(6);
  });

  it("Should mint 1000 USDC to owner", async function () {
    const totalSupply = await usdc.totalSupply();
    const expectedSupply = ethers.parseUnits("1000", 6); // 1000 * 10^6
    expect(totalSupply).to.equal(expectedSupply);
    
    const ownerBalance = await usdc.balanceOf(owner.address);
    expect(ownerBalance).to.equal(expectedSupply);
  });

  it("Should allow owner to mint tokens", async function () {
    const mintAmount = ethers.parseUnits("100", 6); // 100 USDC
    await usdc.mint(addr1.address, mintAmount);
    
    const addr1Balance = await usdc.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(mintAmount);
  });

  it("Should not allow non-owner to mint tokens", async function () {
    const mintAmount = ethers.parseUnits("100", 6);
    
    await expect(
      usdc.connect(addr1).mint(addr2.address, mintAmount)
    ).to.be.revertedWithCustomError(usdc, "OwnableUnauthorizedAccount");
  });

  it("Should allow users to burn their own tokens", async function () {
    // First mint some tokens to addr1
    const mintAmount = ethers.parseUnits("100", 6);
    await usdc.mint(addr1.address, mintAmount);
    
    // Then burn half of them
    const burnAmount = ethers.parseUnits("50", 6);
    await usdc.connect(addr1).burn(burnAmount);
    
    const remainingBalance = await usdc.balanceOf(addr1.address);
    expect(remainingBalance).to.equal(ethers.parseUnits("50", 6));
  });

  it("Should allow transfers between users", async function () {
    const transferAmount = ethers.parseUnits("100", 6);
    await usdc.transfer(addr1.address, transferAmount);
    
    const addr1Balance = await usdc.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(transferAmount);
    
    const ownerBalance = await usdc.balanceOf(owner.address);
    const expectedOwnerBalance = ethers.parseUnits("900", 6); // 1000 - 100
    expect(ownerBalance).to.equal(expectedOwnerBalance);
  });
}); 