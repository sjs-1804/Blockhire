const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniversityRegistry", function () {
  let UniversityRegistry;
  let universityRegistry;
  let owner;
  let addr1;

  beforeEach(async function () {
    // Get contract factory
    UniversityRegistry = await ethers.getContractFactory("UniversityRegistry");
    
    // Get signers
    [owner, addr1] = await ethers.getSigners();

    // Deploy contract (ethers v6)
    universityRegistry = await UniversityRegistry.deploy();
  });

  it("should register a university and emit events", async function () {
    // Single call to registerUniversity, check both events
    await expect(
      universityRegistry.connect(addr1).registerUniversity(
        "ABC University",
        "https://abcuni.edu",
        "123 Street, City",
        "contact@abcuni.edu",
        "UNI12345",
        "Accredited"
      )
    )
      .to.emit(universityRegistry, "UniversityRegistered")
      .withArgs(addr1.address, 1)
      .and.to.emit(universityRegistry, "UniversityApproved")
      .withArgs(addr1.address);

    // Verify university stored correctly
    const uniId = await universityRegistry.universityIds(addr1.address);
    expect(uniId).to.equal(1);

    const uni = await universityRegistry.getUniversity(addr1.address);
    expect(uni.name).to.equal("ABC University");
    expect(uni.website).to.equal("https://abcuni.edu");
    expect(uni.physicalAddress).to.equal("123 Street, City");
    expect(uni.email).to.equal("contact@abcuni.edu");
    expect(uni.regNo).to.equal("UNI12345");
    expect(uni.accreditation).to.equal("Accredited");
    expect(uni.isApproved).to.equal(true);

    const verified = await universityRegistry.isUniversityVerified(addr1.address);
    expect(verified).to.equal(true);
  });

  it("should add a student for an approved university", async function () {
    // Register university first
    await universityRegistry.connect(addr1).registerUniversity(
      "ABC University",
      "https://abcuni.edu",
      "123 Street, City",
      "contact@abcuni.edu",
      "UNI12345",
      "Accredited"
    );

    // Add student and check event
    await expect(
      universityRegistry.connect(addr1).addStudent(
        "Alice Student",
        "alice@student.com",
        "B.Tech",
        "STU123",
        "9999999999",
        "456 Street, City",
        2020,
        2024,
        "QmPhotoCIDExample"
      )
    ).to.emit(universityRegistry, "StudentAdded")
     .withArgs(addr1.address, "Alice Student", "STU123");

    // Verify student stored
    const students = await universityRegistry.getStudents(addr1.address);
    expect(students.length).to.equal(1);
    expect(students[0].name).to.equal("Alice Student");
    expect(students[0].regNo).to.equal("STU123");
  });

  it("should revert when non-approved university tries to add a student", async function () {
    await expect(
      universityRegistry.connect(owner).addStudent(
        "Bob Student",
        "bob@student.com",
        "M.Tech",
        "STU999",
        "8888888888",
        "789 Street, City",
        2021,
        2025,
        "QmAnotherPhotoCID"
      )
    ).to.be.revertedWith("Only approved universities can add students");
  });

  it("should return empty student array for unregistered university", async function () {
    const students = await universityRegistry.getStudents(owner.address);
    expect(students.length).to.equal(0);
  });
});
