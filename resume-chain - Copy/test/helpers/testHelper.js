const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Test Helper Utilities for Resume Verification System
 * Provides common setup, utilities, and validation functions for testing
 */

class TestHelper {
  constructor() {
    this.signers = {};
    this.contracts = {};
    this.deployments = {};
  }

  /**
   * Initialize all signers for testing
   */
  async initializeSigners() {
    const signers = await ethers.getSigners();
    this.signers = {
      owner: signers[0],
      university: signers[1],
      student: signers[2],
      employer: signers[3],
      otherUniversity: signers[4],
      otherStudent: signers[5],
      otherEmployer: signers[6],
      attacker: signers[7], // For security testing
      validator: signers[8]
    };
    return this.signers;
  }

  /**
   * Deploy all contracts with proper dependencies
   */
  async deployContracts() {
    // Deploy UniversityRegistry first (dependency for others)
    const UniversityRegistry = await ethers.getContractFactory("UniversityRegistry");
    this.contracts.universityRegistry = await UniversityRegistry.deploy();
    await this.contracts.universityRegistry.waitForDeployment();

    // Deploy other core contracts
    const ResumeRegistry = await ethers.getContractFactory("ResumeRegistry");
    this.contracts.resumeRegistry = await ResumeRegistry.deploy(
      await this.contracts.universityRegistry.getAddress()
    );
    await this.contracts.resumeRegistry.waitForDeployment();

    const SkillRegistry = await ethers.getContractFactory("SkillRegistry");
    this.contracts.skillRegistry = await SkillRegistry.deploy(
      await this.contracts.universityRegistry.getAddress()
    );
    await this.contracts.skillRegistry.waitForDeployment();

    const EndorsementRegistry = await ethers.getContractFactory("EndorsementRegistry");
    this.contracts.endorsementRegistry = await EndorsementRegistry.deploy(
      await this.contracts.resumeRegistry.getAddress()
    );
    await this.contracts.endorsementRegistry.waitForDeployment();

    const EmployeeRegistry = await ethers.getContractFactory("employeeRegistry");
    this.contracts.employeeRegistry = await EmployeeRegistry.deploy(
      await this.contracts.resumeRegistry.getAddress()
    );
    await this.contracts.employeeRegistry.waitForDeployment();

    return this.contracts;
  }

  /**
   * Setup basic test data
   */
  async setupTestData() {
    await this.initializeSigners();
    await this.deployContracts();

    // Register universities
    await this.contracts.universityRegistry.addUniversity(
      this.signers.university.address
    );
    await this.contracts.universityRegistry.addUniversity(
      this.signers.otherUniversity.address
    );

    // Register employers
    await this.contracts.employeeRegistry.registerEmployer(
      "Tech Corp",
      "tech@corp.com",
      "Software Development",
      this.signers.employer.address,
      "QmTechLogoCID"
    );

    // Add student to university registry
    await this.contracts.universityRegistry
      .connect(this.signers.university)
      .addStudent(
        "Alice Johnson",
        "alice@university.edu",
        "BSc Computer Science",
        "REG2024001",
        "1234567890",
        "123 University St",
        2020,
        2024,
        "QmAlicePhotoCID"
      );

    return {
      signers: this.signers,
      contracts: this.contracts
    };
  }

  /**
   * Create a complete student profile
   */
  async createStudentProfile(studentSigner, overrides = {}) {
    const defaultData = {
      name: "Test Student",
      universityName: "Test University",
      email: "student@test.edu",
      major: "Computer Science",
      resumeCID: "QmTestResumeCID",
      photoCID: "QmTestPhotoCID",
      degree: "BSc Computer Science",
      registrationNumber: "REG2024002",
      graduationYear: 2024
    };

    const studentData = { ...defaultData, ...overrides };

    const tx = await this.contracts.resumeRegistry
      .connect(this.signers.university)
      .registerStudent(
        studentData.name,
        studentData.universityName,
        studentData.email,
        studentData.major,
        studentData.resumeCID,
        studentData.photoCID,
        studentData.degree,
        studentData.registrationNumber,
        studentData.graduationYear
      );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "StudentRegistered");

    return {
      transaction: tx,
      receipt,
      studentId: event ? Number(event.args.studentId) : null,
      studentData
    };
  }

  /**
   * Verify a student profile
   */
  async verifyStudent(studentId, verifier = null) {
    const verifierSigner = verifier || this.signers.university;
    return await this.contracts.resumeRegistry
      .connect(verifierSigner)
      .verifyStudent(studentId);
  }

  /**
   * Assert student data matches expected values
   */
  async assertStudentData(studentId, expectedData) {
    const student = await this.contracts.resumeRegistry.getStudent(studentId);

    if (expectedData.name) expect(student.name).to.equal(expectedData.name);
    if (expectedData.email) expect(student.email).to.equal(expectedData.email);
    if (expectedData.major) expect(student.major).to.equal(expectedData.major);
    if (expectedData.isVerified !== undefined) {
      expect(student.isVerified).to.equal(expectedData.isVerified);
    }
    if (expectedData.resumeCID) expect(student.resumeCID).to.equal(expectedData.resumeCID);
  }

  /**
   * Create a skill test
   */
  async createSkillTest(testData = {}) {
    const defaultTestData = {
      title: "JavaScript Proficiency Test",
      description: "Test your JavaScript knowledge",
      difficulty: "Intermediate",
      timeLimit: 3600, // 1 hour
      passingScore: 70
    };

    const data = { ...defaultTestData, ...testData };

    const tx = await this.contracts.skillRegistry
      .connect(this.signers.university)
      .createSkillTest(
        data.title,
        data.description,
        data.difficulty,
        data.timeLimit,
        data.passingScore
      );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "SkillTestCreated");

    return {
      transaction: tx,
      receipt,
      testId: event ? Number(event.args.testId) : null,
      testData: data
    };
  }

  /**
   * Get current timestamp and add specified seconds
   */
  async getFutureTimestamp(secondsFromNow) {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + secondsFromNow;
  }

  /**
   * Generate random IPFS CID for testing
   */
  generateRandomCID() {
    return `Qm${Math.random().toString(16).substr(2, 44)}`;
  }

  /**
   * Expect transaction to revert with specific message
   */
  async expectRevert(promise, expectedMessage) {
    try {
      await promise;
      expect.fail("Transaction should have reverted");
    } catch (error) {
      if (expectedMessage) {
        expect(error.message).to.include(expectedMessage);
      } else {
        expect(error.message).to.include("revert");
      }
    }
  }

  /**
   * Calculate gas usage for a transaction
   */
  async calculateGasUsage(transaction) {
    const receipt = await transaction.wait();
    return {
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      totalCost: receipt.gasUsed * receipt.effectiveGasPrice
    };
  }

  /**
   * Generate test data for batch operations
   */
  generateBatchTestData(count, dataGenerator = () => ({})) {
    return Array.from({ length: count }, (_, index) => ({
      ...dataGenerator(index),
      index
    }));
  }
}

module.exports = TestHelper;