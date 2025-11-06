const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Full Workflow: Resume + Employee + Endorsement + Skill Registries", function () {
  let universityRegistry, resumeRegistry;
  let owner, uniWallet, studentWallet;

  before(async function () {
    [owner, uniWallet, studentWallet] = await ethers.getSigners();

    // Deploy UniversityRegistry
    const UniversityRegistry = await ethers.getContractFactory("UniversityRegistry");
    universityRegistry = await UniversityRegistry.deploy();

    // Deploy ResumeRegistry with universityRegistry address
    const ResumeRegistry = await ethers.getContractFactory("ResumeRegistry");
    resumeRegistry = await ResumeRegistry.deploy(universityRegistry.target);

    // Add a dummy university
    await universityRegistry.addUniversity(uniWallet.address);

    // Add a student to UniversityRegistry
    await universityRegistry.connect(uniWallet).addStudent(
      "Alice",
      "alice@uni.edu",
      "BSc Computer Science",
      "REG123",
      "999888777",
      "123 Uni St",
      2020,
      2024,
      "QmDummyPhotoCID"
    );
  });

  it("Should allow university to register student in ResumeRegistry", async function () {
    await resumeRegistry.connect(uniWallet).registerStudent(
      "Alice",
      "Dummy University",
      "alice@uni.edu",
      "Blockchain",
      "QmResumeCID",
      "QmDummyPhotoCID",
      "BSc Computer Science",
      "REG123",
      2024
    );

    const student = await resumeRegistry.getStudent(1);
    expect(student.name).to.equal("Alice");
  });

  it("Should verify student", async function () {
    await resumeRegistry.connect(uniWallet).verifyStudent(1);
    const student = await resumeRegistry.getStudent(1);
    expect(student.isVerified).to.be.true;
  });
});
