const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Full Workflow: Resume + Employee + Endorsement + Skill Registries", function () {
  let universityRegistry, resumeRegistry, employeeRegistry, endorsementRegistry, skillRegistry;
  let owner, addr1;

  before(async function () {
    [owner, addr1] = await ethers.getSigners();

    // Deploy UniversityRegistry
    const UniversityRegistry = await ethers.getContractFactory("UniversityRegistry");
    universityRegistry = await UniversityRegistry.deploy();
    await universityRegistry.waitForDeployment(); // Hardhat v6+

    // Deploy ResumeRegistry (needs universityRegistry address)
    const ResumeRegistry = await ethers.getContractFactory("ResumeRegistry");
    resumeRegistry = await ResumeRegistry.deploy(universityRegistry.target);
    await resumeRegistry.waitForDeployment();

    // Deploy EmployeeRegistry
    const EmployeeRegistry = await ethers.getContractFactory("EmployeeRegistry");
    employeeRegistry = await EmployeeRegistry.deploy();
    await employeeRegistry.waitForDeployment();

    // Deploy EndorsementRegistry
    const EndorsementRegistry = await ethers.getContractFactory("EndorsementRegistry");
    endorsementRegistry = await EndorsementRegistry.deploy();
    await endorsementRegistry.waitForDeployment();

    // Deploy SkillRegistry (needs universityRegistry address)
    const SkillRegistry = await ethers.getContractFactory("SkillRegistry");
    skillRegistry = await SkillRegistry.deploy(universityRegistry.target);
    await skillRegistry.waitForDeployment();
  });

  it("should deploy all contracts successfully", async function () {
    expect(universityRegistry.target).to.properAddress;
    expect(resumeRegistry.target).to.properAddress;
    expect(employeeRegistry.target).to.properAddress;
    expect(endorsementRegistry.target).to.properAddress;
    expect(skillRegistry.target).to.properAddress;
  });
});
