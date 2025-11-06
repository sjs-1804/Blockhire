const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts with account:", deployer.address);

  // 1️⃣ UniversityRegistry
  const UniversityRegistry = await hre.ethers.getContractFactory("UniversityRegistry");
  const universityRegistry = await UniversityRegistry.deploy();
  await universityRegistry.waitForDeployment();
  console.log("✅ UniversityRegistry deployed to:", universityRegistry.target);

  // 2️⃣ ResumeRegistry
  const ResumeRegistry = await hre.ethers.getContractFactory("ResumeRegistry");
  const resumeRegistry = await ResumeRegistry.deploy(universityRegistry.target);
  await resumeRegistry.waitForDeployment();
  console.log("✅ ResumeRegistry deployed to:", resumeRegistry.target);

  // 3️⃣ SkillRegistry
  const SkillRegistry = await hre.ethers.getContractFactory("SkillRegistry");
  const skillRegistry = await SkillRegistry.deploy(universityRegistry.target);
  await skillRegistry.waitForDeployment();
  console.log("✅ SkillRegistry deployed to:", skillRegistry.target);

  // 4️⃣ EmployeeRegistry
  const EmployeeRegistry = await hre.ethers.getContractFactory("EmployeeRegistry");
  const employeeRegistry = await EmployeeRegistry.deploy(resumeRegistry.target); // <-- FIXED
  await employeeRegistry.waitForDeployment();
  console.log("✅ EmployeeRegistry deployed to:", employeeRegistry.target);

  // 5️⃣ EndorsementRegistry
  const EndorsementRegistry = await hre.ethers.getContractFactory("EndorsementRegistry");
  const endorsementRegistry = await EndorsementRegistry.deploy();
  await endorsementRegistry.waitForDeployment();
  console.log("✅ EndorsementRegistry deployed to:", endorsementRegistry.target);

  // 6️⃣ Lock contract
  const Lock = await hre.ethers.getContractFactory("Lock");
  const unlockTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours from now
  const lock = await Lock.deploy(unlockTime, { value: hre.ethers.parseEther("0.1") });
  await lock.waitForDeployment();
  console.log("✅ Lock deployed to:", lock.target);

  console.log("\n📦 All contracts deployed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
