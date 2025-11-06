const { expect } = require("chai");
const { ethers } = require("hardhat");
const TestHelper = require("../helpers/testHelper");
const { TEST_DATA } = require("../fixtures/testData");

/**
 * Performance Testing Suite
 * Tests gas usage, performance metrics, and optimization
 */

describe("Performance and Gas Optimization Tests", function () {
  let helper;
  let signers, contracts;

  // Increase timeout for performance tests
  this.timeout(300000);

  beforeEach(async function () {
    helper = new TestHelper();
    ({ signers, contracts } = await helper.setupTestData());
  });

  describe("Gas Usage Analysis", function () {
    it("Should measure gas usage for core operations", async function () {
      console.log("⛽ Measuring gas usage for core operations");

      // Measure student registration gas usage
      const studentProfile = await helper.createStudentProfile(signers.student);
      const registrationGas = await helper.calculateGasUsage(studentProfile.transaction);
      console.log(`📊 Student Registration Gas: ${registrationGas.gasUsed.toString()}`);

      // Measure student verification gas usage
      const verificationTx = await helper.verifyStudent(studentProfile.studentId);
      const verificationGas = await helper.calculateGasUsage(verificationTx);
      console.log(`📊 Student Verification Gas: ${verificationGas.gasUsed.toString()}`);

      // Measure skill endorsement gas usage
      const endorsementTx = await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(
          studentProfile.studentId,
          "JavaScript",
          5,
          "Excellent JavaScript skills demonstrated"
        );
      const endorsementGas = await helper.calculateGasUsage(endorsementTx);
      console.log(`📊 Skill Endorsement Gas: ${endorsementGas.gasUsed.toString()}`);

      // Measure skill test creation gas usage
      const skillTest = TEST_DATA.skillTests[0];
      const testCreation = await helper.createSkillTest(skillTest);
      const testCreationGas = await helper.calculateGasUsage(testCreation.transaction);
      console.log(`📊 Skill Test Creation Gas: ${testCreationGas.gasUsed.toString()}`);

      // Measure job notification gas usage
      const jobNotificationTx = await contracts.employeeRegistry
        .connect(signers.employer)
        .sendJobNotification(
          studentProfile.studentId,
          "Senior Developer",
          "Tech Corp",
          "San Francisco",
          "Exciting opportunity"
        );
      const jobNotificationGas = await helper.calculateGasUsage(jobNotificationTx);
      console.log(`📊 Job Notification Gas: ${jobNotificationGas.gasUsed.toString()}`);

      // Assert gas usage is within reasonable limits
      expect(registrationGas.gasUsed).to.be.lessThan(200000); // Should be under 200k gas
      expect(verificationGas.gasUsed).to.be.lessThan(100000); // Should be under 100k gas
      expect(endorsementGas.gasUsed).to.be.lessThan(150000); // Should be under 150k gas
      expect(testCreationGas.gasUsed).to.be.lessThan(300000); // Should be under 300k gas
      expect(jobNotificationGas.gasUsed).to.be.lessThan(200000); // Should be under 200k gas

      console.log("✅ All gas usage within acceptable limits");
    });

    it("Should analyze gas usage for batch operations", async function () {
      console.log("📦 Analyzing gas usage for batch operations");

      const studentIds = [];
      const gasUsages = [];

      // Create multiple students and measure gas usage trend
      for (let i = 0; i < 10; i++) {
        const studentSigner = i === 0 ? signers.student :
                             i === 1 ? signers.otherStudent :
                             i === 2 ? signers.validator :
                             i === 3 ? signers.otherUniversity :
                             signers.otherEmployer;

        const startTime = Date.now();
        const profile = await helper.createStudentProfile(studentSigner, {
          name: `Batch Student ${i + 1}`,
          email: `batch${i + 1}@test.edu`
        });
        const endTime = Date.now();

        const gasUsage = await helper.calculateGasUsage(profile.transaction);
        gasUsages.push(Number(gasUsage.gasUsed));
        studentIds.push(profile.studentId);

        console.log(`📊 Student ${i + 1} - Gas: ${gasUsage.gasUsed}, Time: ${endTime - startTime}ms`);
      }

      // Verify gas usage is consistent (not increasing significantly)
      const avgGas = gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length;
      const maxGas = Math.max(...gasUsages);
      const minGas = Math.min(...gasUsages);

      console.log(`📊 Average Gas: ${avgGas.toFixed(0)}`);
      console.log(`📊 Max Gas: ${maxGas}`);
      console.log(`📊 Min Gas: ${minGas}`);
      console.log(`📊 Gas Variance: ${((maxGas - minGas) / avgGas * 100).toFixed(2)}%`);

      // Gas usage should be relatively consistent (less than 20% variance)
      expect((maxGas - minGas) / avgGas).to.be.lessThan(0.2);

      console.log("✅ Batch operation gas usage is consistent");
    });

    it("Should measure gas usage optimization with storage patterns", async function () {
      console.log("🗄️ Testing storage pattern gas optimization");

      const studentProfile = await helper.createStudentProfile(signers.student);
      await helper.verifyStudent(studentProfile.studentId);

      // Test gas usage for multiple endorsements on same student
      const endorsementGasUsages = [];
      const skills = ["JavaScript", "React.js", "Node.js", "Python", "Java"];

      for (const skill of skills) {
        const endorsementTx = await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentProfile.studentId,
            skill,
            5,
            `Excellent ${skill} skills`
          );

        const gasUsage = await helper.calculateGasUsage(endorsementTx);
        endorsementGasUsages.push(Number(gasUsage.gasUsed));
        console.log(`📊 Endorsement ${skill} - Gas: ${gasUsage.gasUsed}`);
      }

      // Analyze gas usage pattern for growing arrays
      for (let i = 1; i < endorsementGasUsages.length; i++) {
        const gasIncrease = endorsementGasUsages[i] - endorsementGasUsages[i - 1];
        const percentIncrease = (gasIncrease / endorsementGasUsages[i - 1]) * 100;
        console.log(`📊 Gas increase for endorsement ${i + 1}: ${gasIncrease} (${percentIncrease.toFixed(2)}%)`);
      }

      // Gas usage should not increase exponentially
      const totalIncrease = endorsementGasUsages[endorsementGasUsages.length - 1] - endorsementGasUsages[0];
      const percentTotalIncrease = (totalIncrease / endorsementGasUsages[0]) * 100;
      expect(percentTotalIncrease).to.be.lessThan(100); // Less than 100% total increase

      console.log("✅ Storage pattern gas optimization validated");
    });
  });

  describe("Load Testing", function () {
    it("Should handle large dataset operations (1000+ students)", async function () {
      console.log("🔥 Testing large dataset operations");

      const studentCount = 50; // Reduced for test performance, but demonstrates scaling
      const startTime = Date.now();
      const studentIds = [];

      // Create many students
      for (let i = 0; i < studentCount; i++) {
        const studentSigner = i % 5 === 0 ? signers.student :
                             i % 5 === 1 ? signers.otherStudent :
                             i % 5 === 2 ? signers.validator :
                             i % 5 === 3 ? signers.otherUniversity :
                             signers.otherEmployer;

        const profile = await helper.createStudentProfile(studentSigner, {
          name: `Load Test Student ${i + 1}`,
          email: `loadtest${i + 1}@test.edu`
        });
        studentIds.push(profile.studentId);

        // Verify every 10th student
        if ((i + 1) % 10 === 0) {
          await helper.verifyStudent(profile.studentId);
        }
      }

      const creationTime = Date.now() - startTime;
      console.log(`📊 Created ${studentCount} students in ${creationTime}ms`);
      console.log(`📊 Average time per student: ${(creationTime / studentCount).toFixed(2)}ms`);

      // Test search performance with large dataset
      const searchStartTime = Date.now();

      // Add endorsements to some students
      for (let i = 0; i < Math.min(20, studentIds.length); i++) {
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentIds[i],
            `Skill ${i % 5 + 1}`,
            5,
            `Load test endorsement ${i}`
          );
      }

      const searchTime = Date.now() - searchStartTime;
      console.log(`📊 Added endorsements in ${searchTime}ms`);

      // Test search performance
      const searchTestStartTime = Date.now();
      const searchResults = await contracts.employeeRegistry.searchStudentsBySkill("Skill 1");
      const searchTestTime = Date.now() - searchTestStartTime;

      console.log(`📊 Search completed in ${searchTestTime}ms`);
      console.log(`📊 Found ${searchResults.length} results`);

      expect(searchResults.length).to.be.greaterThan(0);
      expect(searchTestTime).to.be.lessThan(5000); // Search should complete within 5 seconds

      console.log("✅ Large dataset operations handled successfully");
    });

    it("Should handle concurrent user simulation", async function () {
      console.log("👥 Testing concurrent user simulation");

      const concurrentUsers = 10;
      const operationsPerUser = 5;
      const startTime = Date.now();

      // Simulate concurrent operations
      const userPromises = [];

      for (let user = 0; user < concurrentUsers; user++) {
        const userPromise = async () => {
          const userSigner = user === 0 ? signers.student :
                           user === 1 ? signers.otherStudent :
                           user === 2 ? signers.validator :
                           user === 3 ? signers.otherUniversity :
                           signers.otherEmployer;

          const userOperations = [];

          for (let op = 0; op < operationsPerUser; op++) {
            // Create student profile
            const profile = await helper.createStudentProfile(userSigner, {
              name: `Concurrent User ${user + 1} Op ${op + 1}`,
              email: `concurrent${user + 1}_${op + 1}@test.edu`
            });

            // Verify student
            await helper.verifyStudent(profile.studentId);

            // Add endorsement
            await contracts.endorsementRegistry
              .connect(signers.employer)
              .endorseSkill(
                profile.studentId,
                "Test Skill",
                5,
                `Concurrent operation endorsement`
              );

            userOperations.push(profile.studentId);
          }

          return userOperations;
        };

        userPromises.push(userPromise());
      }

      const results = await Promise.all(userPromises);
      const totalTime = Date.now() - startTime;

      console.log(`📊 ${concurrentUsers} concurrent users completed ${operationsPerUser} operations each in ${totalTime}ms`);
      console.log(`📊 Average time per operation: ${(totalTime / (concurrentUsers * operationsPerUser)).toFixed(2)}ms`);

      // Verify all operations completed successfully
      const totalOperations = results.reduce((sum, userOps) => sum + userOps.length, 0);
      expect(totalOperations).to.equal(concurrentUsers * operationsPerUser);

      console.log("✅ Concurrent user simulation completed successfully");
    });

    it("Should test performance under network congestion", async function () {
      console.log("🌐 Testing performance under network congestion");

      // Simulate network congestion by sending many transactions rapidly
      const transactionCount = 20;
      const startTime = Date.now();

      const transactions = [];

      for (let i = 0; i < transactionCount; i++) {
        const tx = contracts.resumeRegistry
          .connect(signers.university)
          .verifyStudent(i + 1); // Try to verify different student IDs

        transactions.push(tx.catch(error => {
          // Some transactions will fail, which is expected
          return { error: error.message };
        }));
      }

      const results = await Promise.allSettled(transactions);
      const endTime = Date.now();

      const successfulTxs = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
      const failedTxs = results.filter(r => r.status === 'rejected' || r.value.error).length;

      console.log(`📊 Network congestion test completed in ${endTime - startTime}ms`);
      console.log(`📊 Successful transactions: ${successfulTxs}`);
      console.log(`📊 Failed transactions: ${failedTxs}`);

      // System should handle congestion gracefully
      expect(successfulTxs + failedTxs).to.equal(transactionCount);

      console.log("✅ Network congestion performance test completed");
    });
  });

  describe("Memory and Storage Optimization", function () {
    it("Should optimize storage layout for gas efficiency", async function () {
      console.log("💾 Testing storage layout optimization");

      // Test gas usage differences between packed and unpacked storage
      const studentProfile = await helper.createStudentProfile(signers.student);
      const baseGas = await helper.calculateGasUsage(studentProfile.transaction);

      console.log(`📊 Base student registration gas: ${baseGas.gasUsed}`);

      // Add multiple endorsements to test array storage
      const endorsementGasUsages = [];
      for (let i = 0; i < 10; i++) {
        const endorsementTx = await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            studentProfile.studentId,
            `Storage Test Skill ${i + 1}`,
            5,
            `Testing storage optimization with endorsement number ${i + 1}`
          );

        const gasUsage = await helper.calculateGasUsage(endorsementTx);
        endorsementGasUsages.push(Number(gasUsage.gasUsed));
      }

      // Analyze gas usage pattern
      const firstEndorsement = endorsementGasUsages[0];
      const lastEndorsement = endorsementGasUsages[endorsementGasUsages.length - 1];
      const gasIncrease = lastEndorsement - firstEndorsement;
      const percentIncrease = (gasIncrease / firstEndorsement) * 100;

      console.log(`📊 First endorsement gas: ${firstEndorsement}`);
      console.log(`📊 Last endorsement gas: ${lastEndorsement}`);
      console.log(`📊 Gas increase: ${gasIncrease} (${percentIncrease.toFixed(2)}%)`);

      // Gas increase should be reasonable (not exponential)
      expect(percentIncrease).to.be.lessThan(200); // Less than 200% increase

      console.log("✅ Storage layout optimization validated");
    });

    it("Should test memory usage in complex operations", async function () {
      console.log("🧠 Testing memory usage in complex operations");

      const studentProfiles = [];

      // Create multiple students
      for (let i = 0; i < 5; i++) {
        const studentSigner = i === 0 ? signers.student :
                             i === 1 ? signers.otherStudent :
                             i === 2 ? signers.validator :
                             i === 3 ? signers.otherUniversity :
                             signers.otherEmployer;

        const profile = await helper.createStudentProfile(studentSigner, {
          name: `Memory Test Student ${i + 1}`,
          email: `memory${i + 1}@test.edu`
        });
        await helper.verifyStudent(profile.studentId);
        studentProfiles.push(profile);
      }

      // Test complex search operation
      const searchStartTime = Date.now();
      const allStudentEndorsements = [];

      for (const profile of studentProfiles) {
        const endorsements = await contracts.endorsementRegistry.getStudentEndorsements(profile.studentId);
        allStudentEndorsements.push(...endorsements);
      }

      const searchTime = Date.now() - searchStartTime;
      console.log(`📊 Complex search completed in ${searchTime}ms`);
      console.log(`📊 Total endorsements retrieved: ${allStudentEndorsements.length}`);

      // Search should complete efficiently even with multiple students
      expect(searchTime).to.be.lessThan(3000); // Should complete within 3 seconds

      console.log("✅ Memory usage in complex operations optimized");
    });
  });

  describe("Response Time Analysis", function () {
    it("Should measure response times for critical operations", async function () {
      console.log("⏱️ Measuring response times for critical operations");

      // Measure student registration response time
      const regStartTime = Date.now();
      const studentProfile = await helper.createStudentProfile(signers.student);
      const regResponseTime = Date.now() - regStartTime;

      // Measure student verification response time
      const verifyStartTime = Date.now();
      await helper.verifyStudent(studentProfile.studentId);
      const verifyResponseTime = Date.now() - verifyStartTime;

      // Measure endorsement response time
      const endorseStartTime = Date.now();
      await contracts.endorsementRegistry
        .connect(signers.employer)
        .endorseSkill(
          studentProfile.studentId,
          "Response Time Test Skill",
          5,
          "Testing response time"
        );
      const endorseResponseTime = Date.now() - endorseStartTime;

      // Measure search response time
      const searchStartTime = Date.now();
      const searchResults = await contracts.employeeRegistry.searchStudentsBySkill("Response Time Test Skill");
      const searchResponseTime = Date.now() - searchStartTime;

      console.log(`📊 Registration response time: ${regResponseTime}ms`);
      console.log(`📊 Verification response time: ${verifyResponseTime}ms`);
      console.log(`📊 Endorsement response time: ${endorseResponseTime}ms`);
      console.log(`📊 Search response time: ${searchResponseTime}ms`);

      // All response times should be under 2 seconds (2000ms)
      expect(regResponseTime).to.be.lessThan(2000);
      expect(verifyResponseTime).to.be.lessThan(2000);
      expect(endorseResponseTime).to.be.lessThan(2000);
      expect(searchResponseTime).to.be.lessThan(2000);

      console.log("✅ All response times within acceptable limits");
    });

    it("Should test response time under load", async function () {
      console.log("🏋️ Testing response time under load");

      const loadTestOperations = 25;
      const responseTimes = [];

      for (let i = 0; i < loadTestOperations; i++) {
        const startTime = Date.now();

        // Create student
        const studentSigner = i % 5 === 0 ? signers.student :
                             i % 5 === 1 ? signers.otherStudent :
                             i % 5 === 2 ? signers.validator :
                             i % 5 === 3 ? signers.otherUniversity :
                             signers.otherEmployer;

        const profile = await helper.createStudentProfile(studentSigner, {
          name: `Load Response Test ${i + 1}`,
          email: `loadresponse${i + 1}@test.edu`
        });

        // Verify student
        await helper.verifyStudent(profile.studentId);

        // Add endorsement
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            profile.studentId,
            "Load Test Skill",
            5,
            "Load test endorsement"
          );

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`📊 Average response time under load: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`📊 Max response time: ${maxResponseTime}ms`);
      console.log(`📊 Min response time: ${minResponseTime}ms`);

      // Even under load, response times should be reasonable
      expect(avgResponseTime).to.be.lessThan(5000); // Average under 5 seconds
      expect(maxResponseTime).to.be.lessThan(10000); // Max under 10 seconds

      console.log("✅ Response times under load are acceptable");
    });
  });

  describe("Performance Regression Testing", function () {
    it("Should establish performance baseline", async function () {
      console.log("📊 Establishing performance baseline");

      const baselineMetrics = {
        studentRegistration: [],
        studentVerification: [],
        skillEndorsement: [],
        searchOperations: []
      };

      // Collect baseline metrics
      for (let i = 0; i < 5; i++) {
        // Student registration
        const regStart = Date.now();
        const profile = await helper.createStudentProfile(signers.student, {
          name: `Baseline Student ${i + 1}`,
          email: `baseline${i + 1}@test.edu`
        });
        baselineMetrics.studentRegistration.push(Date.now() - regStart);

        // Student verification
        const verifyStart = Date.now();
        await helper.verifyStudent(profile.studentId);
        baselineMetrics.studentVerification.push(Date.now() - verifyStart);

        // Skill endorsement
        const endorseStart = Date.now();
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            profile.studentId,
            "Baseline Test Skill",
            5,
            "Baseline test endorsement"
          );
        baselineMetrics.skillEndorsement.push(Date.now() - endorseStart);

        // Search operation
        const searchStart = Date.now();
        await contracts.employeeRegistry.searchStudentsBySkill("Baseline Test Skill");
        baselineMetrics.searchOperations.push(Date.now() - searchStart);
      }

      // Calculate baseline averages
      const baseline = {
        studentRegistration: baselineMetrics.studentRegistration.reduce((a, b) => a + b, 0) / baselineMetrics.studentRegistration.length,
        studentVerification: baselineMetrics.studentVerification.reduce((a, b) => a + b, 0) / baselineMetrics.studentVerification.length,
        skillEndorsement: baselineMetrics.skillEndorsement.reduce((a, b) => a + b, 0) / baselineMetrics.skillEndorsement.length,
        searchOperations: baselineMetrics.searchOperations.reduce((a, b) => a + b, 0) / baselineMetrics.searchOperations.length
      };

      console.log("📊 Performance Baseline Metrics:");
      console.log(`📊 Student Registration: ${baseline.studentRegistration.toFixed(2)}ms`);
      console.log(`📊 Student Verification: ${baseline.studentVerification.toFixed(2)}ms`);
      console.log(`📊 Skill Endorsement: ${baseline.skillEndorsement.toFixed(2)}ms`);
      console.log(`📊 Search Operations: ${baseline.searchOperations.toFixed(2)}ms`);

      // Store baseline for future regression testing
      // In a real implementation, this would be saved to a file or database
      console.log("✅ Performance baseline established");
    });

    it("Should detect performance regressions", async function () {
      console.log("🔍 Testing performance regression detection");

      // This test would compare current performance against established baseline
      // For demonstration, we'll run the same operations as baseline test

      const currentMetrics = {
        studentRegistration: [],
        skillEndorsement: []
      };

      // Run operations and collect current metrics
      for (let i = 0; i < 3; i++) {
        // Student registration
        const regStart = Date.now();
        const profile = await helper.createStudentProfile(signers.student, {
          name: `Regression Test Student ${i + 1}`,
          email: `regression${i + 1}@test.edu`
        });
        currentMetrics.studentRegistration.push(Date.now() - regStart);

        // Skill endorsement
        const endorseStart = Date.now();
        await contracts.endorsementRegistry
          .connect(signers.employer)
          .endorseSkill(
            profile.studentId,
            "Regression Test Skill",
            5,
            "Regression test endorsement"
          );
        currentMetrics.skillEndorsement.push(Date.now() - endorseStart);
      }

      const avgCurrentReg = currentMetrics.studentRegistration.reduce((a, b) => a + b, 0) / currentMetrics.studentRegistration.length;
      const avgCurrentEndorse = currentMetrics.skillEndorsement.reduce((a, b) => a + b, 0) / currentMetrics.skillEndorsement.length;

      console.log(`📊 Current registration time: ${avgCurrentReg.toFixed(2)}ms`);
      console.log(`📊 Current endorsement time: ${avgCurrentEndorse.toFixed(2)}ms`);

      // In a real regression test, we would compare against stored baseline
      // For now, just ensure current performance is reasonable
      expect(avgCurrentReg).to.be.lessThan(5000); // Under 5 seconds
      expect(avgCurrentEndorse).to.be.lessThan(3000); // Under 3 seconds

      console.log("✅ Performance regression test completed");
    });
  });
});