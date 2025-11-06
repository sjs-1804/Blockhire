// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract UniversityRegistry {
    using ECDSA for bytes32;

    address private owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: only owner");
        _;
    }

    struct University {
        string name;
        string website;
        string physicalAddress;
        string email;
        string regNo;
        string accreditation;
        bool isApproved;
    }

    struct Student {
        string name;
        string email;
        string degree;
        string regNo;
        string contact;
        string studentAddress;
        uint16 yearJoining;
        uint16 yearCompletion;
        string photoCID; // IPFS CID
    }

    mapping(address => uint) public universityIds;
    mapping(uint => University) public universities;
    mapping(address => Student[]) private students;
    mapping(address => bool) private approvedUniversities;

    uint private nextUniId = 1;

    event UniversityRegistered(address indexed uniAddress, uint uniId);
    event UniversityApproved(address indexed uniAddress);
    event StudentAdded(address indexed uniAddress, string studentName, string regNo);

    // ---------------- UNIVERSITY REGISTRATION ----------------
    function registerUniversity(
        string memory _name,
        string memory _website,
        string memory _physicalAddress,
        string memory _email,
        string memory _regNo,
        string memory _accreditation
    ) external {
        require(universityIds[msg.sender] == 0, "University already registered");

        uint uniId = nextUniId++;
        universities[uniId] = University({
            name: _name,
            website: _website,
            physicalAddress: _physicalAddress,
            email: _email,
            regNo: _regNo,
            accreditation: _accreditation,
            isApproved: true
        });

        universityIds[msg.sender] = uniId;
        approvedUniversities[msg.sender] = true;

        emit UniversityRegistered(msg.sender, uniId);
        emit UniversityApproved(msg.sender);
    }

    function isUniversityVerified(address uni) external view returns (bool) {
        return approvedUniversities[uni];
    }

    // ---------------- STUDENT REGISTRATION ----------------
    function addStudent(
        string memory _name,
        string memory _email,
        string memory _degree,
        string memory _regNo,
        string memory _contact,
        string memory _studentAddress,
        uint16 _yearJoining,
        uint16 _yearCompletion,
        string memory _photoCID
    ) external {
        require(approvedUniversities[msg.sender], "Only approved universities can add students");

        students[msg.sender].push(Student({
            name: _name,
            email: _email,
            degree: _degree,
            regNo: _regNo,
            contact: _contact,
            studentAddress: _studentAddress,
            yearJoining: _yearJoining,
            yearCompletion: _yearCompletion,
            photoCID: _photoCID
        }));

        emit StudentAdded(msg.sender, _name, _regNo);
    }

    // ---------------- STRONG STUDENT VERIFICATION ----------------
    function verifyStudentSignature(
        string memory _name,
        string memory _regNo,
        string memory _degree,
        uint16 _yearCompletion,
        bytes memory signature,
        address university
    ) public view returns (bool) {
        // Compose a unique hash of student attributes
        bytes32 messageHash = keccak256(abi.encodePacked(_name, _regNo, _degree, _yearCompletion));

        // Manually create Ethereum Signed Message hash (replaces toEthSignedMessageHash)
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        // Recover signer from signature
        address signer = ECDSA.recover(ethSignedMessageHash, signature);

        // Check if signer is verified university
        return approvedUniversities[signer] && signer == university;
    }

    // ---------------- VIEW FUNCTIONS ----------------
    // ---------------- VIEW FUNCTION: RETURN SEPARATE ARRAYS ----------------
function getStudents(address uniAddress) external view returns (
    string[] memory names,
    string[] memory emails,
    string[] memory degrees,
    string[] memory regNos,
    uint16[] memory yearsCompletion
) {
    Student[] storage uniStudents = students[uniAddress];
    uint len = uniStudents.length;

    names = new string[](len);
    emails = new string[](len);
    degrees = new string[](len);
    regNos = new string[](len);
    yearsCompletion = new uint16[](len);

    for (uint i = 0; i < len; i++) {
        names[i] = uniStudents[i].name;
        emails[i] = uniStudents[i].email;
        degrees[i] = uniStudents[i].degree;
        regNos[i] = uniStudents[i].regNo;
        yearsCompletion[i] = uniStudents[i].yearCompletion;
    }
}


    function getUniversity(address uniAddress) external view returns (University memory) {
        uint id = universityIds[uniAddress];
        require(id != 0, "University not registered");
        return universities[id];
    }

    function getAllUniversities() external view returns (University[] memory) {
        uint total = nextUniId - 1;
        University[] memory list = new University[](total);
        for (uint i = 1; i <= total; i++) {
            list[i - 1] = universities[i];
        }
        return list;
    }

    // ---------------- OWNER FUNCTIONS ----------------
    function addUniversity(address uniAddress) external onlyOwner {
        require(universityIds[uniAddress] == 0, "University already registered");

        uint uniId = nextUniId++;
        universities[uniId] = University({
            name: "Dummy University",
            website: "www.dummy.edu",
            physicalAddress: "Dummy Address",
            email: "info@dummy.edu",
            regNo: "DUMMY123",
            accreditation: "NA",
            isApproved: true
        });

        universityIds[uniAddress] = uniId;
        approvedUniversities[uniAddress] = true;

        emit UniversityRegistered(uniAddress, uniId);
        emit UniversityApproved(uniAddress);
    }
}
