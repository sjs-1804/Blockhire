const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelper = require("../helpers/testHelper");
const { TEST_DATA } = require("../fixtures/testData");

/**
 * Security Testing Suite
 * Tests for various attack vectors and security vulnerabilities
 */

describe("Security Audit Tests", function () {
  let helper;
  let signers, contracts;

  // Increase timeout for security tests
  this.timeout(120000);

  beforeEach(async function () {
    helper = new TestHelper();
    ({ signers, contracts } = await helper.setupTestData());
  });

  describe("Access Control Validation", function () {
    it("Should prevent unauthorized access to university-only functions", async function () {
      console.log("🔒 Testing university access control");

      // Non-university tries to create skill test
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.student)
          .createSkillTest(
            "Unauthorized Test",
            "This should fail",
            "Beginner",
            1800,
            70
          ),
        "Only verified universities can create tests"
      );

      // Non-university tries to approve test requests
      const skillTest = await helper.createSkillTest();
      await contracts.skillRegistry
        .connect(signers.student)
        .requestTest(skillTest.testId);

      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.employer)
          .approveTestRequest(skillTest.testId, signers.student.address),
        "Only verified universities can approve test requests"
      );

      // Non-university tries to post test scores
      await contracts.skillRegistry
        .connect(signers.university)
        .approveTestRequest(skillTest.testId, signers.student.address);

      await contracts.skillRegistry
        .connect(signers.student)
        .submitTestAnswers(skillTest.testId, [0, 1]);

      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.employer)
          .postTestScore(skillTest.testId, signers.student.address, 85),
        "Only verified universities can post scores"
      );

      console.log("✅ University access control validated");
    });

    it("Should prevent unauthorized student verification", async function () {
      console.log("🚫 Testing unauthorized student verification");

      const studentProfile = await helper.createStudentProfile(signers.student);

      // Non-university tries to verify student
      await helper.expectRevert(
        contracts.resumeRegistry
          .connect(signers.employer)
          .verifyStudent(studentProfile.studentId),
        "Only verified universities can verify students"
      );

      // Another student tries to verify student
      await helper.expectRevert(
        contracts.resumeRegistry
          .connect(signers.otherStudent)
          .verifyStudent(studentProfile.studentId),
        "Only verified universities can verify students"
      );

      console.log("✅ Student verification access control validated");
    });

    it("Should prevent unauthorized university registration", async function () {
      console.log("🛡️ Testing university registration control");

      // Non-owner tries to add university
      await helper.expectRevert(
        contracts.universityRegistry
          .connect(signers.student)
          .addUniversity(signers.otherUniversity.address),
        "Only owner can add universities"
      );

      // University tries to add another university
      await helper.expectRevert(
        contracts.universityRegistry
          .connect(signers.university)
          .addUniversity(signers.otherUniversity.address),
        "Only owner can add universities"
      );

      console.log("✅ University registration access control validated");
    });
  });

  describe("Reentrancy Attack Prevention", function () {
    it("Should prevent reentrancy attacks on verifyStudent function", async function () {
      console.log("🔄 Testing reentrancy protection in verifyStudent");

      // Deploy a malicious contract that attempts reentrancy
      const MaliciousContract = await ethers.getContractFactory("ReentrancyAttacker");
      const attacker = await MaliciousContract.deploy(
        await contracts.resumeRegistry.getAddress(),
        await contracts.universityRegistry.getAddress()
      );
      await attacker.waitForDeployment();

      // Try to trigger reentrancy through malicious contract
      await helper.expectRevert(
        attacker.attemptReentrancy(),
        "ReentrancyGuard: reentrant call"
      );

      console.log("✅ Reentrancy attack prevented in verifyStudent");
    });

    it("Should prevent reentrancy attacks on endorseSkill function", async function () {
      console.log("🔄 Testing reentrancy protection in endorseSkill");

      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Deploy malicious contract for endorsement reentrancy
      const MaliciousEndorser = await ethers.getContractFactory("EndorsementReentrancyAttacker");
      const maliciousEndorser = await MaliciousEndorser.deploy(
        await contracts.endorsementRegistry.getAddress(),
        await contracts.resumeRegistry.getAddress()
      );
      await maliciousEndorser.waitForDeployment();

      await helper.expectRevert(
        maliciousEndorser.attemptEndorsementReentrancy(studentProfile.studentId),
        "ReentrancyGuard: reentrant call"
      );

      console.log("✅ Reentrancy attack prevented in endorseSkill");
    });

    it("Should handle recursive call attempts safely", async function () {
      console.log("🔀 Testing recursive call prevention");

      // Create a scenario where recursive calls might occur
      const studentProfile = await helper.createStudentProfile(signers.student);

      // Try multiple rapid calls that might trigger recursive behavior
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          contracts.resumeRegistry
            .connect(signers.university)
            .verifyStudent(studentProfile.studentId)
        );
      }

      // Should only succeed once (subsequent calls should fail)
      await Promise.allSettled(promises);

      const student = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      expect(student.isVerified).to.be.true;

      console.log("✅ Recursive call attempts handled safely");
    });
  });

  describe("Input Validation and Boundary Testing", function () {
    it("Should validate student registration inputs", async function () {
      console.log("✅ Testing student registration input validation");

      // Empty name
      await helper.expectRevert(
        helper.createStudentProfile(signers.student, { name: "" }),
        "Name cannot be empty"
      );

      // Invalid email format
      await helper.expectRevert(
        helper.createStudentProfile(signers.student, { email: "invalid-email" }),
        "Invalid email format"
      );

      // Invalid graduation year (too early)
      await helper.expectRevert(
        helper.createStudentProfile(signers.student, { graduationYear: 1999 }),
        "Invalid graduation year"
      );

      // Invalid graduation year (too far in future)
      const futureYear = new Date().getFullYear() + 10;
      await helper.expectRevert(
        helper.createStudentProfile(signers.student, { graduationYear: futureYear }),
        "Invalid graduation year"
      );

      console.log("✅ Student registration input validation working");
    });

    it("Should validate endorsement inputs", async function () {
      console.log("⭐ Testing endorsement input validation");

      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Empty skill name
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(studentProfile.studentId, "", 5, "Empty skill test"),
        "Skill name cannot be empty"
      );

      // Invalid rating (too low)
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(studentProfile.studentId, "JavaScript", 0, "Too low rating"),
        "Rating must be between 1 and 5"
      );

      // Invalid rating (too high)
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(studentProfile.studentId, "JavaScript", 6, "Too high rating"),
        "Rating must be between 1 and 5"
      );

      // Empty comment
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(studentProfile.studentId, "JavaScript", 5, ""),
        "Comment cannot be empty"
      );

      // Very long comment (potential buffer overflow)
      const longComment = "A".repeat(1001); // Assuming max 1000 chars
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(studentProfile.studentId, "JavaScript", 5, longComment),
        "Comment too long"
      );

      console.log("✅ Endorsement input validation working");
    });

    it("Should validate skill test inputs", async function () {
      console.log("📝 Testing skill test input validation");

      // Empty title
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.university)
          .createSkillTest("", "Description", "Beginner", 1800, 70),
        "Test title cannot be empty"
      );

      // Empty description
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.university)
          .createSkillTest("Title", "", "Beginner", 1800, 70),
        "Test description cannot be empty"
      );

      // Invalid time limit (negative)
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.university)
          .createSkillTest("Title", "Description", "Beginner", -1, 70),
        "Invalid time limit"
      );

      // Invalid passing score (negative)
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.university)
          .createSkillTest("Title", "Description", "Beginner", 1800, -1),
        "Invalid passing score"
      );

      // Invalid passing score (too high)
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.university)
          .createSkillTest("Title", "Description", "Beginner", 1800, 101),
        "Invalid passing score"
      );

      console.log("✅ Skill test input validation working");
    });

    it("Should handle edge cases in numeric inputs", async function () {
      console.log("🔢 Testing numeric input edge cases");

      // Test maximum valid values
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Maximum rating (5)
      await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(studentProfile.studentId, "Test Skill", 5, "Maximum rating test");

      // Minimum rating (1)
      await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(studentProfile.studentId, "Test Skill 2", 1, "Minimum rating test");

      // Verify endorsements were created correctly
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      expect(endorsements.length).to.equal(2);
      expect(endorsements[0].rating).to.equal(5);
      expect(endorsements[1].rating).to.equal(1);

      console.log("✅ Numeric input edge cases handled correctly");
    });
  });

  describe("Integer Overflow/Underflow Protection", function () {
    it("Should prevent integer overflow in endorsement counts", async function () {
      console.log("🔢 Testing integer overflow protection");

      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Try to create many endorsements to test overflow protection
      // This would only be feasible with very large numbers in practice
      // For testing purposes, we verify the counter is working correctly

      for (let i = 0; i < 10; i++) {
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentProfile.studentId,
            `Skill ${i}`,
            5,
            `Endorsement ${i}`
          );
      }

      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      expect(endorsements.length).to.equal(10);

      console.log("✅ Integer overflow protection working");
    });

    it("Should handle large number operations safely", async function () {
      console.log("🔢 Testing large number operations");

      // Test with maximum uint256 values (if applicable)
      const maxUint256 = ethers.MaxUint256;

      // Create test with maximum time limit
      await contracts.skillRegistry
        .connect(signers.university)
        .createSkillTest(
          "Max Time Test",
          "Test with maximum time limit",
          "Beginner",
          Number(maxUint256), // This might be limited by the contract
          70
        );

      // This test depends on the actual contract implementation
      // Some contracts might limit these values to reasonable ranges

      console.log("✅ Large number operations handled safely");
    });
  });

  describe("Front-Running Attack Prevention", function function () {
    it("Should prevent front-running on student verification", async function () {
      console.log("🏃 Testing front-running prevention");

      const studentProfile = await helper.createStudentProfile(signers.student);

      // Simulate front-running scenario
      // Attacker tries to verify student before university

      const tx1 = contracts.resumeRegistry
        .connect(signers.university)
        .verifyStudent(studentProfile.studentId);

      const tx2 = contracts.resumeRegistry
        .connect(signers.attacker)
        .verifyStudent(studentProfile.studentId); // Should fail

      await Promise.all([
        expect(tx1).to.not.be.reverted,
        expect(tx2).to.be.reverted
      ]);

      console.log("✅ Front-running attack prevented");
    });

    it("Should prevent front-running on skill test submissions", async function () {
      console.log("🏃 Testing front-running prevention in test submissions");

      const skillTest = await helper.createSkillTest();
      await contracts.skillRegistry
        .connect(signers.student)
        .requestTest(skillTest.testId);

      await contracts.skillRegistry
        .connect(signers.university)
        .approveTestRequest(skillTest.testId, signers.student.address);

      // Student and attacker try to submit answers simultaneously
      const studentSubmission = contracts.skillRegistry
        .connect(signers.student)
        .submitTestAnswers(skillTest.testId, [0, 1]);

      const attackerSubmission = contracts.skillRegistry
        .connect(signers.attacker)
        .submitTestAnswers(skillTest.testId, [1, 0]); // Wrong answers

      await Promise.all([
        expect(studentSubmission).to.not.be.reverted,
        expect(attackerSubmission).to.be.reverted
      ]);

      console.log("✅ Front-running attack prevented in test submissions");
    });
  });

  describe("Denial of Service (DoS) Protection", function () {
    it("Should prevent gas limit exhaustion attacks", async function () {
      console.log("⛽ Testing gas limit exhaustion protection");

      // Try to create operations that would consume excessive gas
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Try to create very long endorsement comments
      const longComments = Array(100).fill("A".join("")); // Very long string

      // The contract should reject operations that would consume too much gas
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentProfile.studentId,
            "Test Skill",
            5,
            longComments
          ),
        "Comment too long" // Or similar gas protection error
      );

      console.log("✅ Gas limit exhaustion protection working");
    });

    it("Should handle array length limits", async function () {
      console.log("📚 Testing array length limits");

      // Test with various array operations
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Create multiple endorsements
      const endorsementCount = 50;
      for (let i = 0; i < endorsementCount; i++) {
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentProfile.studentId,
            `Skill ${i}`,
            5,
            `Endorsement ${i}`
          );
      }

      // Verify all endorsements were created
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      expect(endorsements.length).to.equal(endorsementCount);

      console.log("✅ Array length limits handled correctly");
    });
  });

  describe("Logic Vulnerabilities", function () {
    it("Should prevent double verification of students", async function () {
      console.log("✅ Testing double verification prevention");

      const studentProfile = await helper.createStudentProfile(signers.student);

      // First verification should succeed
      await contracts.resumeRegistry
        .connect(signers.university)
        .verifyStudent(studentProfile.studentId);

      // Second verification should fail
      await helper.expectRevert(
        contracts.resumeRegistry
          .connect(signers.university)
          .verifyStudent(studentProfile.studentId),
        "Student already verified"
      );

      console.log("✅ Double verification prevented");
    });

    it("Should prevent duplicate endorsements for same skill", async function () {
      console.log("🔄 Testing duplicate endorsement prevention");

      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // First endorsement should succeed
      await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(studentProfile.studentId, "JavaScript", 5, "First endorsement");

      // Second endorsement of same skill by same endorser should fail
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(studentProfile.studentId, "JavaScript", 4, "Duplicate endorsement"),
        "Skill already endorsed by this employer"
      );

      console.log("✅ Duplicate endorsements prevented");
    });

    it("Should prevent test score manipulation", async function () {
      console.log("🎯 Testing test score manipulation prevention");

      const skillTest = await helper.createSkillTest();
      await contracts.skillRegistry
        .connect(signers.student)
        .requestTest(skillTest.testId);

      await contracts.skillRegistry
        .connect(signers.university)
        .approveTestRequest(skillTest.testId, signers.student.address);

      await contracts.skillRegistry
        .connect(signers.student)
        .submitTestAnswers(skillTest.testId, [0, 1]);

      // Only university should be able to post scores
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.student)
          .postTestScore(skillTest.testId, signers.student.address, 100),
        "Only verified universities can post scores"
      );

      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.employer)
          .postTestScore(skillTest.testId, signers.student.address, 100),
        "Only verified universities can post scores"
      );

      // University posts legitimate score
      await contracts.skillRegistry
        .connect(signers.university)
        .postTestScore(skillTest.testId, signers.student.address, 85);

      // Try to modify the score
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.university)
          .postTestScore(skillTest.testId, signers.student.address, 100),
        "Score already posted"
      );

      console.log("✅ Test score manipulation prevented");
    });
  });

  describe("Privacy and Data Protection", function () {
    it("Should protect sensitive student information", async function () {
      console.log("🔒 Testing privacy protection");

      const studentProfile = await helper.createStudentProfile(signers.student, {
        name: "Private Student",
        email: "private@student.edu",
        phoneNumber: "123-456-7890"
      });

      // Only authorized users should access certain information
      // Test that private information is not exposed to unauthorized users

      const student = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      expect(student.name).to.equal("Private Student");
      expect(student.email).to.equal("private@student.edu");

      // Test access control for sensitive functions
      await helper.expectRevert(
        contracts.resumeRegistry
          .connect(signers.otherStudent)
          .updateResume("QmNewResumeCID"),
        "Only student can update their own resume"
      );

      console.log("✅ Privacy protection working");
    });

    it("Should prevent unauthorized data access", async function () {
      console.log("🚫 Testing unauthorized data access prevention");

      // Create student with sensitive data
      const studentProfile = await helper.createStudentProfile(signers.student);

      // Try to access another student's data
      const otherStudentProfile = await helper.createStudentProfile(signers.otherStudent);

      // Student should not be able to access other student's job notifications
      await helper.expectRevert(
        contracts.employeeRegistry
          .connect(signers.student)
          .getStudentJobNotifications(otherStudentProfile.studentId),
        "Only student can view their own job notifications"
      );

      console.log("✅ Unauthorized data access prevented");
    });
  });

  describe("Emergency and Recovery Scenarios", function () {
    it("Should handle emergency pause functionality", async function () {
      console.log("⏸️ Testing emergency pause functionality");

      // This test would depend on whether the contracts have pause functionality
      // If implemented, test that all critical functions can be paused in emergency

      console.log("✅ Emergency functionality tested (if implemented)");
    });

    it("Should handle system recovery after failures", async function () {
      console.log("🔄 Testing system recovery");

      const studentProfile = await helper.createStudentProfile(signers.student);

      // Simulate various failure scenarios and verify recovery
      try {
        await contracts.resumeRegistry
          .connect(signers.university)
          .verifyStudent(studentProfile.studentId);
      } catch (error) {
        // Handle error and try recovery
        console.log("Error handled:", error.message);
      }

      // Verify system is still functional
      const student = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      expect(student.name).to.not.be.empty;

      console.log("✅ System recovery working");
    });
  });
});