const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Setup Dummy University & Student", function () {
  let universityRegistry;
  let owner, uniWallet;

  before(async function () {
    [owner, uniWallet] = await ethers.getSigners();

    // Deploy UniversityRegistry
    const UniversityRegistry = await ethers.getContractFactory("UniversityRegistry");
    universityRegistry = await UniversityRegistry.deploy(); // v6 no .deployed()
    
    // Add a dummy university using owner function
    await universityRegistry.addUniversity(uniWallet.address);
  });

  it("Should register a dummy university", async function () {
    const isVerified = await universityRegistry.isUniversityVerified(uniWallet.address);
    expect(isVerified).to.be.true;

    const uniData = await universityRegistry.getUniversity(uniWallet.address);
    expect(uniData.name).to.equal("Dummy University");
  });
});
