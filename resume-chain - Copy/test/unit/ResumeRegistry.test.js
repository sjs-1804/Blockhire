const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniversityRegistry & ResumeRegistry Integration", function () {
  let universityRegistry, resumeRegistry;
  let owner, uni1, uni2, studentWallet, employerWallet;

  before(async () => {
    [owner, uni1, uni2, studentWallet, employerWallet] = await ethers.getSigners();

    // Deploy UniversityRegistry
    const UniversityRegistryFactory = await ethers.getContractFactory("UniversityRegistry");
    universityRegistry = await UniversityRegistryFactory.deploy(); // ethers v6, already deployed

    // Deploy ResumeRegistry with UniversityRegistry address
    const ResumeRegistryFactory = await ethers.getContractFactory("ResumeRegistry");
    resumeRegistry = await ResumeRegistryFactory.deploy(universityRegistry.target); // use .target for address
  });

  it("Should register and approve universities", async function () {
    await universityRegistry.connect(uni1).registerUniversity(
      "ABC University",
      "www.abcuni.edu",
      "Address 123",
      "contact@abcuni.edu",
      "ABC123",
      "Accredited"
    );

    const verified = await universityRegistry.isUniversityVerified(uni1.address);
    expect(verified).to.equal(true);

    const uniData = await universityRegistry.getUniversity(uni1.address);
    expect(uniData.name).to.equal("ABC University");
  });

  it("Should add students to university", async function () {
    await universityRegistry.connect(uni1).addStudent(
      "Alice",
      "alice@example.com",
      "B.Tech CS",
      "STU001",
      "1234567890",
      "Addr1",
      2019,
      2023,
      "QmPhotoCID"
    );

    const students = await universityRegistry.getStudents(uni1.address);
    expect(students.length).to.equal(1);
    expect(students[0].name).to.equal("Alice");
  });

  it("Should allow ResumeRegistry to register student with cross-verification", async function () {
    await resumeRegistry.connect(uni1).registerStudent(
      "Alice",
      "ABC University",
      "alice@example.com",
      "Blockchain",
      "QmResumeCID",
      "QmPhotoCID",
      "B.Tech CS",
      "STU001",
      2023
    );

    const student = await resumeRegistry.getStudent(1);
    expect(student.name).to.equal("Alice");
    expect(student.university).to.equal("ABC University");
    expect(student.isVerified).to.equal(false);
  });

  it("Should verify student", async function () {
    await resumeRegistry.connect(uni1).verifyStudent(1);
    const student = await resumeRegistry.getStudent(1);
    expect(student.isVerified).to.equal(true);
  });

  it("Should register employer", async function () {
    await resumeRegistry.registerEmployer("TechCorp", employerWallet.address);
    const employer = await resumeRegistry.employers("TechCorp");
    expect(employer.isRegistered).to.equal(true);
  });

  it("Should assign test to student", async function () {
    await resumeRegistry.connect(employerWallet).assignTest(
      1,
      "TechCorp",
      "hr@techcorp.com",
      "9876543210",
      "Blockchain Developer",
      "2025-10-25 10:00",
      120
    );

    const tests = await resumeRegistry.getStudentTests(1);
    expect(tests.length).to.equal(1);
    expect(tests[0].jobTitle).to.equal("Blockchain Developer");
  });

  it("Should allow student to submit test", async function () {
    await resumeRegistry.connect(studentWallet).submitTestByStudent(1, 0, [1, 2, 3]);
    const submissions = await resumeRegistry.getStudentTestSubmissions(1);
    expect(submissions.length).to.equal(1);
    expect(submissions[0].submitted).to.equal(true);
  });

  it("Should allow employer to submit test results and create job notification", async function () {
    await resumeRegistry.connect(employerWallet).submitTestResult(
      1,
      0,
      90,
      "2025-11-01",
      "HQ Address",
      80
    );

    const tests = await resumeRegistry.getStudentTests(1);
    expect(tests[0].score).to.equal(90);
    expect(tests[0].submitted).to.equal(true);

    const jobs = await resumeRegistry.getStudentJobNotifications(1);
    expect(jobs.length).to.equal(1);
    expect(jobs[0].companyName).to.equal("TechCorp");
  });

  it("Should allow searching student by skill", async function () {
    const results = await resumeRegistry.searchStudentsBySkill("Blockchain");
    expect(results.length).to.equal(1);
    expect(results[0].name).to.equal("Alice");
  });
});
