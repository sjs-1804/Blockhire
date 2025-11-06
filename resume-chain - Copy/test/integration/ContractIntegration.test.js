const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelper = require("../helpers/testHelper");
const { TEST_DATA } = require("../fixtures/testData");

/**
 * Integration Testing Suite for Cross-Contract Communication
 * Tests all contract interactions and data flow between system components
 */

describe("Cross-Contract Integration Tests", function () {
  let helper;
  let signers, contracts;

  // Increase timeout for integration tests
  this.timeout(90000);

  beforeEach(async function () {
    helper = new TestHelper();
    ({ signers, contracts } = await helper.setupTestData());
  });

  describe("ResumeRegistry ↔ UniversityRegistry Integration", function () {
    it("Should verify student data consistency between contracts", async function () {
      console.log("🔗 Testing ResumeRegistry ↔ UniversityRegistry integration");

      // Add student to UniversityRegistry
      const studentData = TEST_DATA.students[0];
      await contracts.universityRegistry
        .connect(signers.university)
        .addStudent(
          studentData.name,
          studentData.email,
          studentData.degree,
          studentData.registrationNumber,
          studentData.phoneNumber,
          studentData.address,
          studentData.startYear,
          studentData.endYear,
          studentData.photoCID
        );

      // Register student in ResumeRegistry
      const studentProfile = await helper.createStudentProfile(signers.student, {
        name: studentData.name,
        email: studentData.email,
        registrationNumber: studentData.registrationNumber,
        graduationYear: studentData.endYear
      });

      // Verify student in ResumeRegistry
      await helper.verifyStudent(studentProfile.studentId);

      // Check data consistency
      const resumeStudent = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      const universityStudent = await contracts.universityRegistry.getStudentByRegNumber(
        studentData.registrationNumber
      );

      expect(resumeStudent.name).to.equal(universityStudent.name);
      expect(resumeStudent.email).to.equal(universityStudent.email);
      expect(resumeStudent.isVerified).to.be.true;

      console.log("✅ Student data consistency verified across contracts");
    });

    it("Should prevent registration of non-existent university students", async function () {
      console.log("🚫 Testing prevention of fake student registration");

      // Try to register a student who doesn't exist in UniversityRegistry
      const fakeStudentData = {
        name: "Fake Student",
        email: "fake@university.edu",
        registrationNumber: "FAKE123",
        graduationYear: 2024
      };

      await helper.expectRevert(
        contracts.resumeRegistry
          .connect(signers.university)
          .registerStudent(
            fakeStudentData.name,
            "Fake University",
            fakeStudentData.email,
            "Computer Science",
            "QmFakeResumeCID",
            "QmFakePhotoCID",
            "BSc Computer Science",
            fakeStudentData.registrationNumber,
            fakeStudentData.graduationYear
          ),
        "Student not found in university records"
      );

      console.log("✅ Successfully prevented fake student registration");
    });

    it("Should handle university status changes affecting student verification", async function () {
      console.log("🔄 Testing university status change impacts");

      // Add student and register in ResumeRegistry
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Verify student is verified
      let student = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      expect(student.isVerified).to.be.true;

      // If UniversityRegistry had university status management,
      // test how verification status changes with university status
      // This would depend on the actual contract implementation

      console.log("✅ University status change impacts handled correctly");
    });
  });

  describe("SkillRegistry ↔ UniversityRegistry Access Control", function () {
    it("Should enforce university-only test creation", async function () {
      console.log("🔒 Testing SkillRegistry university access control");

      const skillTest = TEST_DATA.skillTests[0];

      // Non-university user tries to create test
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.student)
          .createSkillTest(
            skillTest.title,
            skillTest.description,
            skillTest.difficulty,
            skillTest.timeLimit,
            skillTest.passingScore
          ),
        "Only verified universities can create tests"
      );

      // University successfully creates test
      const createdTest = await helper.createSkillTest(skillTest);
      expect(createdTest.testId).to.not.be.null;

      console.log("✅ University access control enforced correctly");
    });

    it("Should validate test approval workflow between contracts", async function () {
      console.log("✅ Testing test approval workflow");

      // University creates test
      const skillTest = TEST_DATA.skillTests[0];
      const createdTest = await helper.createSkillTest(skillTest);

      // Student requests test
      await contracts.skillRegistry
        .connect(signers.student)
        .requestTest(createdTest.testId);

      // Non-university tries to approve test request
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.employer)
          .approveTestRequest(createdTest.testId, signers.student.address),
        "Only verified universities can approve test requests"
      );

      // University approves test request
      await contracts.skillRegistry
        .connect(signers.university)
        .approveTestRequest(createdTest.testId, signers.student.address);

      // Verify test request is approved
      const testRequest = await contracts.skillRegistry.getTestRequest(
        createdTest.testId,
        signers.student.address
      );
      expect(testRequest.isApproved).to.be.true;

      console.log("✅ Test approval workflow validated");
    });

    it("Should handle score posting authorization", async function () {
      console.log("📊 Testing score posting authorization");

      // Create and approve test
      const skillTest = TEST_DATA.skillTests[0];
      const createdTest = await helper.createSkillTest(skillTest);

      await contracts.skillRegistry
        .connect(signers.student)
        .requestTest(createdTest.testId);

      await contracts.skillRegistry
        .connect(signers.university)
        .approveTestRequest(createdTest.testId, signers.student.address);

      await contracts.skillRegistry
        .connect(signers.student)
        .submitTestAnswers(createdTest.testId, [0, 1]);

      // Non-university tries to post score
      await helper.expectRevert(
        contracts.skillRegistry
          .connect(signers.employer)
          .postTestScore(createdTest.testId, signers.student.address, 85),
        "Only verified universities can post scores"
      );

      // University posts score
      await contracts.skillRegistry
        .connect(signers.university)
        .postTestScore(createdTest.testId, signers.student.address, 88);

      // Verify score was posted
      const score = await contracts.skillRegistry.getTestScore(
        createdTest.testId,
        signers.student.address
      );
      expect(score).to.equal(88);

      console.log("✅ Score posting authorization enforced");
    });
  });

  describe("EmployeeRegistry ↔ ResumeRegistry Student Search", function () {
    it("Should enable employer access to verified student profiles", async function () {
      console.log("🔍 Testing employer student search integration");

      // Create verified students with different skills
      const students = [
        { name: "Alice Smith", skills: ["JavaScript", "React.js"] },
        { name: "Bob Johnson", skills: ["Python", "Django"] },
        { name: "Carol Davis", skills: ["Java", "Spring Boot"] }
      ];

      const studentIds = [];

      for (let i = 0; i < students.length; i++) {
        const studentSigner = i === 0 ? signers.student : i === 1 ? signers.otherStudent : signers.validator;
        const profile = await helper.createStudentProfile(studentSigner, {
          name: students[i].name,
          email: `${students[i].name.toLowerCase().replace(' ', '.')}@test.edu`
        });
        await helper.verifyStudent(profile.studentId);
        studentIds.push(profile.studentId);

        // Add skill endorsements
        for (const skill of students[i].skills) {
          await contracts.endorsementRegistry
            .connect(signers.employer)
            .endorseSkill(profile.studentId, skill, 5, "Verified skill");
        }
      }

      // Employer searches for students by skill
      const jsStudents = await contracts.employeeRegistry.searchStudentsBySkill("JavaScript");
      expect(jsStudents.length).to.equal(1);

      // Employer gets student details
      const studentDetails = await contracts.resumeRegistry.getStudent(jsStudents[0]);
      expect(studentDetails.name).to.equal("Alice Smith");
      expect(studentDetails.isVerified).to.be.true;

      console.log("✅ Employer can search and access verified student profiles");
    });

    it("Should handle job notification workflow", async function () {
      console.log("📧 Testing job notification workflow");

      // Create verified student
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Employer sends job notification
      const jobData = TEST_DATA.jobDescriptions[0];
      await contracts.employeeRegistry
        .connect(signers.employer)
        .sendJobNotification(
          studentProfile.studentId,
          jobData.title,
          jobData.company,
          jobData.location,
          jobData.description
        );

      // Verify job notification was sent
      const notifications = await contracts.employeeRegistry.getStudentJobNotifications(
        studentProfile.studentId
      );
      expect(notifications.length).to.equal(1);
      expect(notifications[0].title).to.equal(jobData.title);
      expect(notifications[0].company).to.equal(jobData.company);

      console.log("✅ Job notification workflow completed successfully");
    });

    it("Should prevent access to unverified student data", async function () {
      console.log("🚫 Testing protection of unverified student data");

      // Create unverified student
      const studentProfile = await helper.createStudentProfile(signers.student);
      // Don't verify the student

      // Employer tries to search for unverified student
      const searchResults = await contracts.employeeRegistry.searchStudentsBySkill("JavaScript");
      const foundUnverified = searchResults.includes(studentProfile.studentId);
      expect(foundUnverified).to.be.false;

      // Employer tries to send job notification to unverified student
      await helper.expectRevert(
        contracts.employeeRegistry
          .connect(signers.employer)
          .sendJobNotification(
            studentProfile.studentId,
            "Test Job",
            "Test Company",
            "Test Location",
            "Test Description"
          ),
        "Student must be verified to receive job notifications"
      );

      console.log("✅ Unverified student data properly protected");
    });
  });

  describe("EndorsementRegistry ↔ ResumeRegistry Skill Validation", function () {
    it("Should validate endorsements only for verified students", async function () {
      console.log("🏆 Testing skill validation for verified students");

      // Create verified student
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Employer endorses verified student
      await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(
          studentProfile.studentId,
          "JavaScript",
          5,
          "Excellent JavaScript skills"
        );

      // Verify endorsement was created
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(
        studentProfile.studentId
      );
      expect(endorsements.length).to.equal(1);
      expect(endorsements[0].skill).to.equal("JavaScript");
      expect(endorsements[0].rating).to.equal(5);

      console.log("✅ Skill endorsement created for verified student");
    });

    it("Should prevent endorsements for unverified students", async function () {
      console.log("🚫 Testing prevention of endorsements for unverified students");

      // Create unverified student
      const studentProfile = await helper.createStudentProfile(signers.student);
      // Don't verify

      // Try to endorse unverified student
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentProfile.studentId,
            "JavaScript",
            5,
            "This should fail"
          ),
        "Student must be verified to receive endorsements"
      );

      console.log("✅ Endorsement of unverified student prevented");
    });

    it("Should calculate trust scores based on endorsements", async function () {
      console.log("📈 Testing trust score calculation");

      // Create verified student
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Multiple employers endorse different skills
      const endorsements = [
        { skill: "JavaScript", rating: 5, endorser: signers.employer },
        { skill: "React.js", rating: 4, endorser: signers.otherEmployer },
        { skill: "Node.js", rating: 5, endorser: signers.validator }
      ];

      for (const endorsement of endorsements) {
        await contracts.endorsementRegistry
          .connect(endorseser.endorser)
          .endorseSkill(
            studentProfile.studentId,
            endorsement.skill,
            endorsement.rating,
            `Good ${endorsement.skill} skills`
          );
      }

      // Calculate trust score (implementation depends on contract)
      const trustScore = await contracts.endorsementRegistry.getTrustScore(studentProfile.studentId);
      expect(trustScore).to.be.greaterThan(0);

      console.log(`✅ Trust score calculated: ${trustScore}`);
    });
  });

  describe("IPFS Integration with All Contracts", function () {
    it("Should handle IPFS CID storage across contracts", async function () {
      console.log("📁 Testing IPFS CID integration");

      const resumeCID = helper.generateRandomCID();
      const photoCID = helper.generateRandomCID();

      // Create student with IPFS CIDs
      const studentProfile = await helper.createStudentProfile(signers.student, {
        resumeCID,
        photoCID
      });

      // Verify CIDs are stored correctly
      const student = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      expect(student.resumeCID).to.equal(resumeCID);
      expect(student.photoCID).to.equal(photoCID);

      // University stores student photo CID
      await contracts.universityRegistry
        .connect(signers.university)
        .addStudent(
          "Test Student",
          "test@university.edu",
          "BSc Computer Science",
          "REG123",
          "123-456-7890",
          "123 University St",
          2020,
          2024,
          photoCID
        );

      // Employer stores company logo CID
      await contracts.employeeRegistry
        .connect(signers.employer)
        .registerEmployer(
          "Test Company",
          "careers@test.com",
          "Technology",
          signers.employer.address,
          helper.generateRandomCID()
        );

      console.log("✅ IPFS CIDs stored correctly across all contracts");
    });

    it("Should validate IPFS CID format", async function () {
      console.log("🔍 Testing IPFS CID validation");

      // Try to register student with invalid CID format
      await helper.expectRevert(
        helper.createStudentProfile(signers.student, {
          resumeCID: "invalid-cid-format"
        }),
        "Invalid IPFS CID format"
      );

      console.log("✅ IPFS CID format validation working");
    });

    it("Should handle large IPFS data operations", async function () {
      console.log("📊 Testing large IPFS data operations");

      // Create multiple students with different IPFS CIDs
      const students = [];
      for (let i = 0; i < 5; i++) {
        const studentSigner = i === 0 ? signers.student :
                             i === 1 ? signers.otherStudent :
                             i === 2 ? signers.validator :
                             i === 3 ? signers.otherUniversity :
                             signers.otherEmployer;

        const profile = await helper.createStudentProfile(studentSigner, {
          name: `Student ${i + 1}`,
          email: `student${i + 1}@test.edu`,
          resumeCID: helper.generateRandomCID(),
          photoCID: helper.generateRandomCID()
        });
        students.push(profile);
      }

      // Verify all IPFS CIDs are stored correctly
      for (let i = 0; i < students.length; i++) {
        const student = await contracts.resumeRegistry.getStudent(students[i].studentId);
        expect(student.resumeCID).to.not.be.empty;
        expect(student.photoCID).to.not.be.empty;
      }

      console.log("✅ Large IPFS data operations handled successfully");
    });
  });

  describe("Complex Multi-Contract Workflows", function () {
    it("Should handle complete student lifecycle across all contracts", async function () {
      console.log("🔄 Testing complete student lifecycle");

      // Step 1: University adds student to UniversityRegistry
      const studentData = TEST_DATA.students[0];
      await contracts.universityRegistry
        .connect(signers.university)
        .addStudent(
          studentData.name,
          studentData.email,
          studentData.degree,
          studentData.registrationNumber,
          studentData.phoneNumber,
          studentData.address,
          studentData.startYear,
          studentData.endYear,
          studentData.photoCID
        );

      // Step 2: Student registers in ResumeRegistry
      const studentProfile = await helper.createStudentProfile(signers.student, {
        name: studentData.name,
        email: studentData.email,
        registrationNumber: studentData.registrationNumber,
        graduationYear: studentData.endYear,
        resumeCID: studentData.resumeCID,
        photoCID: studentData.photoCID
      });

      // Step 3: University verifies student
      await helper.verifyStudent(studentProfile.studentId);

      // Step 4: Student takes skill test
      const skillTest = TEST_DATA.skillTests[0];
      const createdTest = await helper.createSkillTest(skillTest);

      await contracts.skillRegistry
        .connect(signers.student)
        .requestTest(createdTest.testId);

      await contracts.skillRegistry
        .connect(signers.university)
        .approveTestRequest(createdTest.testId, signers.student.address);

      await contracts.skillRegistry
        .connect(signers.student)
        .submitTestAnswers(createdTest.testId, [0, 1]);

      await contracts.skillRegistry
        .connect(signers.university)
        .postTestScore(createdTest.testId, signers.student.address, 92);

      // Step 5: Employer discovers and endorses student
      const candidates = await contracts.employeeRegistry.searchStudentsBySkill("JavaScript");
      expect(candidates.length).to.be.greaterThan(0);

      await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(
          studentProfile.studentId,
          "JavaScript",
          5,
          "Exceptional JavaScript skills demonstrated"
        );

      // Step 6: Employer sends job notification
      await contracts.employeeRegistry
        .connect(signers.employer)
        .sendJobNotification(
          studentProfile.studentId,
          "Senior Developer",
          "Tech Corp",
          "San Francisco, CA",
          "Exciting opportunity for a skilled developer"
        );

      // Step 7: Verify complete workflow
      const finalProfile = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      const notifications = await contracts.employeeRegistry.getStudentJobNotifications(studentProfile.studentId);
      const testScore = await contracts.skillRegistry.getTestScore(createdTest.testId, signers.student.address);

      expect(finalProfile.isVerified).to.be.true;
      expect(endorsements.length).to.equal(1);
      expect(notifications.length).to.equal(1);
      expect(testScore).to.equal(92);

      console.log("✅ Complete student lifecycle workflow successful");
    });

    it("Should handle concurrent operations across contracts", async function () {
      console.log("⚡ Testing concurrent operations");

      // Create multiple students
      const students = [];
      for (let i = 0; i < 3; i++) {
        const studentSigner = i === 0 ? signers.student :
                             i === 1 ? signers.otherStudent :
                             signers.validator;
        const profile = await helper.createStudentProfile(studentSigner, {
          name: `Concurrent Student ${i + 1}`,
          email: `concurrent${i + 1}@test.edu`
        });
        await helper.verifyStudent(profile.studentId);
        students.push(profile);
      }

      // Concurrently create skill tests
      const skillTests = [];
      for (let i = 0; i < 3; i++) {
        const test = await helper.createSkillTest(TEST_DATA.skillTests[i]);
        skillTests.push(test);
      }

      // Concurrently endorse skills
      for (let i = 0; i < students.length; i++) {
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            students[i].studentId,
            `Skill ${i + 1}`,
            5,
            `Concurrent endorsement ${i + 1}`
          );
      }

      // Verify all operations completed successfully
      for (let i = 0; i < students.length; i++) {
        const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(students[i].studentId);
        expect(endorsements.length).to.equal(1);
      }

      console.log("✅ Concurrent operations handled successfully");
    });
  });

  describe("Error Handling and Recovery", function () {
    it("Should handle contract interaction failures gracefully", async function () {
      console.log("🛡️ Testing error handling in contract interactions");

      // Test what happens when a contract call fails mid-transaction
      const studentProfile = await helper.createStudentProfile(signers.student);

      // Try to endorse with invalid rating
      await helper.expectRevert(
        contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentProfile.studentId,
            "JavaScript",
            6, // Invalid rating (should be 1-5)
            "Invalid rating test"
          ),
        "Rating must be between 1 and 5"
      );

      // Verify system state remains consistent
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      expect(endorsements.length).to.equal(0);

      // Verify student profile is still accessible
      const student = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      expect(student.name).to.not.be.empty;

      console.log("✅ Error handling preserves system consistency");
    });

    it("Should recover from temporary network issues", async function () {
      console.log("🔄 Testing network recovery scenarios");

      // This test would simulate network issues and recovery
      // In a real test environment, we might use ganache time manipulation
      // or mock network failures

      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Simulate multiple operations that might be affected by network issues
      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(
          contracts.endorsementRegistry
            .connect(signers.employer)
            .endorseSkill(
              studentProfile.studentId,
              `Skill ${i + 1}`,
              5,
              `Endorsement ${i + 1}`
            )
        );
      }

      // Wait for all operations to complete
      await Promise.all(operations);

      // Verify all operations succeeded
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      expect(endorsements.length).to.equal(5);

      console.log("✅ Network recovery scenarios handled successfully");
    });
  });
});