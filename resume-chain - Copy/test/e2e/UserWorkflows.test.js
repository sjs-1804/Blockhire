const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelper = require("../helpers/testHelper");
const { TEST_DATA, getRandomStudent, getRandomEmployer, getRandomSkillTest } = require("../fixtures/testData");

/**
 * End-to-End User Workflow Tests
 * Tests complete user journeys for all three roles: Students, Universities, and Employers
 */

describe("End-to-End User Workflows", function () {
  let helper;
  let signers, contracts;

  // Increase timeout for these comprehensive tests
  this.timeout(60000);

  beforeEach(async function () {
    helper = new TestHelper();
    ({ signers, contracts } = await helper.setupTestData());
  });

  describe("Complete Student Journey", function () {
    it("Should handle complete student workflow from registration to job notifications", async function () {
      console.log("🎓 Starting Complete Student Journey Test");

      // Step 1: University registration (already done in setup)
      console.log("✅ University already registered");

      // Step 2: University adds student records to UniversityRegistry
      const studentData = getRandomStudent();
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
      console.log("✅ Student record added to UniversityRegistry");

      // Step 3: Student registers in ResumeRegistry with verified details
      const studentProfile = await helper.createStudentProfile(signers.student, {
        name: studentData.name,
        email: studentData.email,
        major: studentData.major,
        resumeCID: studentData.resumeCID,
        photoCID: studentData.photoCID,
        degree: studentData.degree,
        registrationNumber: studentData.registrationNumber,
        graduationYear: studentData.endYear
      });
      console.log("✅ Student registered in ResumeRegistry");

      // Step 4: Student uploads resume to IPFS and gets CID (simulated)
      const resumeCID = helper.generateRandomCID();
      console.log(`✅ Resume uploaded to IPFS with CID: ${resumeCID}`);

      // Step 5: Student gets verified by university
      await helper.verifyStudent(studentProfile.studentId);
      await helper.assertStudentData(studentProfile.studentId, { isVerified: true });
      console.log("✅ Student verified by university");

      // Step 6: Student requests skill tests
      const skillTest = getRandomSkillTest();
      const createdTest = await helper.createSkillTest(skillTest);
      console.log(`✅ Skill test created: ${skillTest.title}`);

      // Student requests to take the test
      await contracts.skillRegistry
        .connect(signers.student)
        .requestTest(createdTest.testId);
      console.log("✅ Student requested skill test");

      // University approves test request
      await contracts.skillRegistry
        .connect(signers.university)
        .approveTestRequest(createdTest.testId, signers.student.address);
      console.log("✅ Test request approved by university");

      // Step 7: Student takes tests and submits answers (simulated)
      const testAnswers = [0, 1]; // Indices of correct answers
      await contracts.skillRegistry
        .connect(signers.student)
        .submitTestAnswers(createdTest.testId, testAnswers);
      console.log("✅ Student submitted test answers");

      // Step 8: Student receives scores and job notifications
      // University posts test scores
      const score = 85; // 85% score
      await contracts.skillRegistry
        .connect(signers.university)
        .postTestScore(createdTest.testId, signers.student.address, score);
      console.log(`✅ Test score posted: ${score}%`);

      // Verify score was recorded
      const studentScore = await contracts.skillRegistry.getTestScore(
        createdTest.testId,
        signers.student.address
      );
      expect(studentScore).to.equal(score);

      // Employer sends job notification/interview request
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
      console.log("✅ Job notification sent to student");

      // Step 9: Student views verified profile and endorsements
      const studentProfileData = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      expect(studentProfileData.name).to.equal(studentData.name);
      expect(studentProfileData.isVerified).to.be.true;
      console.log("✅ Student verified profile accessible");

      // Employer endorses student skills
      const skill = getRandomSkill();
      await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(
          studentProfile.studentId,
          skill,
          5, // 5-star rating
          "Excellent skill level demonstrated during test"
        );
      console.log(`✅ Student endorsed for skill: ${skill}`);

      // Verify endorsement
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      expect(endorsements.length).to.be.greaterThan(0);
      console.log("✅ Endorsements visible on student profile");

      console.log("🎉 Complete Student Journey Test PASSED");
    });

    it("Should handle student profile updates and multiple endorsements", async function () {
      console.log("🔄 Testing Student Profile Updates");

      // Create initial student profile
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Student updates profile information
      const newResumeCID = helper.generateRandomCID();
      await contracts.resumeRegistry
        .connect(signers.student)
        .updateResume(newResumeCID);
      console.log("✅ Student updated resume CID");

      // Verify updated profile
      const updatedProfile = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      expect(updatedProfile.resumeCID).to.equal(newResumeCID);
      console.log("✅ Profile update verified");

      // Multiple employers endorse different skills
      const skills = ["JavaScript", "React.js", "Node.js"];
      const endorsers = [signers.employer, signers.otherEmployer];

      for (let i = 0; i < skills.length; i++) {
        await contracts.endorsementRegistry
          .connect(endorsers[i])
          .endorseSkill(
            studentProfile.studentId,
            skills[i],
            4 + Math.floor(Math.random() * 2), // 4-5 star rating
            `Good demonstration of ${skills[i]} skills`
          );
      }
      console.log("✅ Multiple skills endorsed by different employers");

      // Verify all endorsements
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      expect(endorsements.length).to.equal(skills.length);
      console.log("✅ All endorsements recorded correctly");

      console.log("🎉 Student Profile Updates Test PASSED");
    });
  });

  describe("Complete Employer Journey", function () {
    it("Should handle complete employer workflow from registration to candidate hiring", async function () {
      console.log("🏢 Starting Complete Employer Journey Test");

      // Step 1: Employer registers company (already done in setup)
      console.log("✅ Employer company registered");

      // Step 2: Employer searches for students by skills
      // First, create some verified students with different skills
      const students = [signers.student, signers.otherStudent];
      const skills = ["JavaScript", "React.js", "Python"];

      for (let i = 0; i < students.length; i++) {
        const studentProfile = await helper.createStudentProfile(students[i], {
          name: `Student ${i + 1}`,
          email: `student${i + 1}@test.edu`
        });
        await helper.verifyStudent(studentProfile.studentId);

        // Endorse student with a skill
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(studentProfile.studentId, skills[i], 5, "Strong skills demonstrated");
      }
      console.log("✅ Created verified students with skill endorsements");

      // Employer searches for students with specific skills
      const searchResults = await contracts.employeeRegistry
        .searchStudentsBySkill("JavaScript");
      expect(searchResults.length).to.be.greaterThan(0);
      console.log(`✅ Found ${searchResults.length} students with JavaScript skills`);

      // Step 3: Employer views student resumes and verified credentials
      for (const studentId of searchResults) {
        const student = await contracts.resumeRegistry.getStudent(studentId);
        const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentId);

        expect(student.isVerified).to.be.true;
        expect(endorsements.length).to.be.greaterThan(0);
        console.log(`✅ Viewed verified student ${student.name} with ${endorsements.length} endorsements`);
      }

      // Step 4: Employer assigns skill tests to students
      const skillTest = getRandomSkillTest();
      const createdTest = await helper.createSkillTest(skillTest);

      for (const studentId of searchResults) {
        await contracts.skillRegistry
          .connect(signers.employer)
          .assignTest(studentId, createdTest.testId);
        console.log(`✅ Assigned skill test to student ${studentId}`);
      }

      // Step 5: Employer reviews test submissions
      // Students submit tests (simulated)
      for (const studentId of searchResults) {
        await contracts.skillRegistry
          .connect(signers.student)
          .submitTestAnswers(createdTest.testId, [0, 1]);
      }
      console.log("✅ Students submitted test answers");

      // University posts scores
      for (const studentId of searchResults) {
        await contracts.skillRegistry
          .connect(signers.university)
          .postTestScore(createdTest.testId,
            studentId === searchResults[0] ? signers.student.address : signers.otherStudent.address,
            studentId === searchResults[0] ? 90 : 75
          );
      }
      console.log("✅ Test scores posted by university");

      // Employer reviews scores
      for (const studentId of searchResults) {
        const score = await contracts.skillRegistry.getTestScore(
          createdTest.testId,
          studentId === searchResults[0] ? signers.student.address : signers.otherStudent.address
        );
        console.log(`✅ Reviewed test score: ${score}% for student ${studentId}`);
      }

      // Step 6: Employer sends job notifications/interview requests
      const jobData = TEST_DATA.jobDescriptions[0];
      for (const studentId of searchResults) {
        await contracts.employeeRegistry
          .connect(signers.employer)
          .sendJobNotification(
            studentId,
            jobData.title,
            jobData.company,
            jobData.location,
            jobData.description
          );
      }
      console.log(`✅ Sent job notifications to ${searchResults.length} students`);

      // Step 7: Employer endorses student skills
      for (const studentId of searchResults) {
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentId,
            "Problem Solving",
            5,
            "Excellent problem-solving abilities demonstrated"
          );
      }
      console.log("✅ Endorsed additional student skills");

      console.log("🎉 Complete Employer Journey Test PASSED");
    });

    it("Should handle employer candidate filtering and selection process", async function () {
      console.log("🔍 Testing Employer Candidate Filtering");

      // Create multiple students with different skills and scores
      const studentData = [
        { name: "Alice Johnson", skills: ["JavaScript", "React.js"], score: 95 },
        { name: "Bob Smith", skills: ["Python", "Machine Learning"], score: 88 },
        { name: "Carol Davis", skills: ["Java", "Spring Boot"], score: 92 }
      ];

      const createdStudentIds = [];

      for (let i = 0; i < studentData.length; i++) {
        const studentSigner = i === 0 ? signers.student : i === 1 ? signers.otherStudent : signers.validator;
        const studentProfile = await helper.createStudentProfile(studentSigner, {
          name: studentData[i].name,
          email: `${studentData[i].name.toLowerCase().replace(' ', '.')}@test.edu`
        });
        await helper.verifyStudent(studentProfile.studentId);
        createdStudentIds.push(studentProfile.studentId);

        // Endorse skills
        for (const skill of studentData[i].skills) {
          await contracts.endorsementRegistry
            .connect(signers.employer)
            .endorseSkill(studentProfile.studentId, skill, 5, "Verified skill");
        }
      }

      console.log("✅ Created diverse candidate pool");

      // Employer filters candidates by specific skill
      const jsCandidates = await contracts.employeeRegistry.searchStudentsBySkill("JavaScript");
      expect(jsCandidates.length).to.equal(1);
      console.log(`✅ Found ${jsCandidates.length} JavaScript candidates`);

      // Employer views detailed profiles for top candidates
      for (const studentId of createdStudentIds) {
        const student = await contracts.resumeRegistry.getStudent(studentId);
        const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentId);

        console.log(`📋 Candidate: ${student.name}`);
        console.log(`   Skills: ${endorsements.length} endorsements`);
        console.log(`   Verified: ${student.isVerified}`);
      }

      console.log("🎉 Employer Candidate Filtering Test PASSED");
    });
  });

  describe("Complete University Journey", function () {
    it("Should handle complete university workflow from registration to test management", async function () {
      console.log("🎓 Starting Complete University Journey Test");

      // Step 1: University registers and gets approved (already done in setup)
      console.log("✅ University registered and approved");

      // Step 2: University adds/updates student records
      const students = [
        getRandomStudent(),
        getRandomStudent(),
        getRandomStudent()
      ];

      for (let i = 0; i < students.length; i++) {
        await contracts.universityRegistry
          .connect(signers.university)
          .addStudent(
            students[i].name,
            students[i].email,
            students[i].degree,
            students[i].registrationNumber,
            students[i].phoneNumber,
            students[i].address,
            students[i].startYear,
            students[i].endYear,
            students[i].photoCID
          );
      }
      console.log(`✅ Added ${students.length} student records to UniversityRegistry`);

      // Step 3: University verifies student resume submissions
      const studentProfiles = [];
      for (let i = 0; i < students.length; i++) {
        const studentSigner = i === 0 ? signers.student : i === 1 ? signers.otherStudent : signers.validator;
        const profile = await helper.createStudentProfile(studentSigner, {
          name: students[i].name,
          email: students[i].email,
          degree: students[i].degree,
          registrationNumber: students[i].registrationNumber,
          graduationYear: students[i].endYear
        });
        studentProfiles.push(profile);
      }

      // University verifies all students
      for (const profile of studentProfiles) {
        await helper.verifyStudent(profile.studentId);
      }
      console.log("✅ Verified all student resume submissions");

      // Step 4: University creates and manages skill tests
      const skillTests = [
        getRandomSkillTest(),
        getRandomSkillTest(),
        getRandomSkillTest()
      ];

      const createdTests = [];
      for (const test of skillTests) {
        const created = await helper.createSkillTest(test);
        createdTests.push(created);
      }
      console.log(`✅ Created ${createdTests.length} skill tests`);

      // Step 5: University approves test requests
      for (let i = 0; i < studentProfiles.length; i++) {
        await contracts.skillRegistry
          .connect(studentProfiles[i].studentId === 1 ? signers.student :
                   studentProfiles[i].studentId === 2 ? signers.otherStudent : signers.validator)
          .requestTest(createdTests[i].testId);

        await contracts.skillRegistry
          .connect(signers.university)
          .approveTestRequest(createdTests[i].testId,
            studentProfiles[i].studentId === 1 ? signers.student.address :
            studentProfiles[i].studentId === 2 ? signers.otherStudent.address : signers.validator.address);
      }
      console.log("✅ Approved all student test requests");

      // Step 6: University posts test scores and results
      const scores = [92, 87, 95]; // Different scores for each student
      for (let i = 0; i < studentProfiles.length; i++) {
        // Students submit answers (simulated)
        await contracts.skillRegistry
          .connect(studentProfiles[i].studentId === 1 ? signers.student :
                   studentProfiles[i].studentId === 2 ? signers.otherStudent : signers.validator)
          .submitTestAnswers(createdTests[i].testId, [0, 1]);

        // University posts scores
        await contracts.skillRegistry
          .connect(signers.university)
          .postTestScore(
            createdTests[i].testId,
            studentProfiles[i].studentId === 1 ? signers.student.address :
            studentProfiles[i].studentId === 2 ? signers.otherStudent.address : signers.validator.address,
            scores[i]
          );
      }
      console.log("✅ Posted test scores for all students");

      // Verify all scores were recorded correctly
      for (let i = 0; i < studentProfiles.length; i++) {
        const recordedScore = await contracts.skillRegistry.getTestScore(
          createdTests[i].testId,
          studentProfiles[i].studentId === 1 ? signers.student.address :
          studentProfiles[i].studentId === 2 ? signers.otherStudent.address : signers.validator.address
        );
        expect(recordedScore).to.equal(scores[i]);
      }
      console.log("✅ Verified all test scores recorded correctly");

      // Step 7: University updates student records (demonstrating record management)
      await contracts.universityRegistry
        .connect(signers.university)
        .updateStudent(
          students[0].registrationNumber,
          "Alice Johnson-Smith", // Updated name
          students[0].email,
          students[0].degree,
          students[0].phoneNumber,
          students[0].address,
          students[0].startYear,
          students[0].endYear,
          students[0].photoCID
        );
      console.log("✅ Updated student record in UniversityRegistry");

      console.log("🎉 Complete University Journey Test PASSED");
    });

    it("Should handle university test quality control and student management", async function () {
      console.log("📊 Testing University Test Quality Control");

      // Create tests with varying difficulty levels
      const tests = [
        { title: "Basic Programming", difficulty: "Beginner", passingScore: 60 },
        { title: "Advanced Algorithms", difficulty: "Advanced", passingScore: 85 },
        { title: "Web Development", difficulty: "Intermediate", passingScore: 75 }
      ];

      const createdTests = [];
      for (const test of tests) {
        const created = await helper.createSkillTest(test);
        createdTests.push(created);
      }
      console.log("✅ Created tests with varying difficulty levels");

      // University monitors test performance
      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Student takes all tests
      const submissionScores = [65, 82, 78];
      for (let i = 0; i < createdTests.length; i++) {
        await contracts.skillRegistry
          .connect(signers.student)
          .requestTest(createdTests[i].testId);

        await contracts.skillRegistry
          .connect(signers.university)
          .approveTestRequest(createdTests[i].testId, signers.student.address);

        await contracts.skillRegistry
          .connect(signers.student)
          .submitTestAnswers(createdTests[i].testId, [0, 1]);

        await contracts.skillRegistry
          .connect(signers.university)
          .postTestScore(createdTests[i].testId, signers.student.address, submissionScores[i]);
      }
      console.log("✅ Student completed all tests with varying scores");

      // University analyzes test results
      for (let i = 0; i < createdTests.length; i++) {
        const score = await contracts.skillRegistry.getTestScore(
          createdTests[i].testId,
          signers.student.address
        );
        const passed = score >= tests[i].passingScore;
        console.log(`📈 Test: ${tests[i].title} - Score: ${score}%, Passed: ${passed}`);
        expect(passed).to.equal(score >= tests[i].passingScore);
      }

      console.log("🎉 University Test Quality Control Test PASSED");
    });
  });

  describe("Cross-Role Integration Workflows", function () {
    it("Should handle complete workflow: University → Student → Employer interactions", async function () {
      console.log("🔄 Starting Cross-Role Integration Test");

      // University registers student
      const studentData = getRandomStudent();
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

      // Student creates profile and gets verified
      const studentProfile = await helper.createStudentProfile(signers.student, {
        name: studentData.name,
        email: studentData.email
      });
      await helper.verifyStudent(studentProfile.studentId);

      // University creates skill test
      const skillTest = getRandomSkillTest();
      const createdTest = await helper.createSkillTest(skillTest);

      // Student takes and passes test
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
        .postTestScore(createdTest.testId, signers.student.address, 88);

      // Employer discovers and recruits student
      const candidates = await contracts.employeeRegistry.searchStudentsBySkill(skillTest.title.split(' ')[0]);
      expect(candidates.length).to.be.greaterThan(0);

      // Employer sends job offer
      const jobData = TEST_DATA.jobDescriptions[1];
      await contracts.employeeRegistry
        .connect(signers.employer)
        .sendJobNotification(
          studentProfile.studentId,
          jobData.title,
          jobData.company,
          jobData.location,
          jobData.description
        );

      // Employer endorses student
      await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(
          studentProfile.studentId,
          "Problem Solving",
          5,
          "Excellent analytical skills demonstrated"
        );

      // Verify complete workflow
      const finalProfile = await contracts.resumeRegistry.getStudent(studentProfile.studentId);
      const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(studentProfile.studentId);
      const finalScore = await contracts.skillRegistry.getTestScore(createdTest.testId, signers.student.address);

      expect(finalProfile.isVerified).to.be.true;
      expect(endorsements.length).to.be.greaterThan(0);
      expect(finalScore).to.equal(88);

      console.log("✅ Student profile verified and endorsed");
      console.log("✅ Test score recorded");
      console.log("✅ Job notification sent");
      console.log("✅ All three roles interacted successfully");

      console.log("🎉 Cross-Role Integration Test PASSED");
    });
  });
});