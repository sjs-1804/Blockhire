// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUniversityRegistry {
    function isUniversityVerified(address uni) external view returns (bool);
    function getStudents(address uniAddress) external view returns (
        string[] memory names,
        string[] memory emails,
        string[] memory degrees,
        string[] memory regNos,
        uint16[] memory yearsCompletion
    );
}

contract ResumeRegistry {
    struct Student {
        uint256 id;
        string name;
        string university;
        string email;
        string skill;
        string resumeCID;
        string photoCID;
        bytes32 resumeHash;
        bool isVerified;
        address studentWallet;
    }

    struct TestNotification {
        uint256 studentId;
        string companyName;
        string employerEmail;
        string employerContact;
        string jobTitle;
        string testDateTime;
        uint256 durationMinutes;
        bool submitted;
        uint256 score;
    }

    struct JobNotification {
        string companyName;
        string jobTitle;
        string interviewDate;
        string interviewLocation;
        string employerEmail;
        string employerContact;
    }

    struct StudentTestSubmission {
        uint256 testIndex;
        uint256[] answers;
        bool submitted;
    }

    struct Employer {
        string companyName;
        address wallet;
        bool isRegistered;
    }

    mapping(uint256 => Student) public students;
    mapping(uint256 => TestNotification[]) public studentTests;
    mapping(uint256 => JobNotification[]) public studentJobNotifications;
    mapping(uint256 => StudentTestSubmission[]) public studentTestSubmissions;
    mapping(string => Employer) public employers;

    // Track which employer assigned which test
    mapping(uint256 => mapping(uint256 => string)) private testAssignedBy; // studentId => testIndex => companyName

    uint256 public studentCount;
    IUniversityRegistry public universityRegistry;

    modifier onlyUniversity() {
        require(universityRegistry.isUniversityVerified(msg.sender), "Only verified universities");
        _;
    }

    modifier onlyEmployer(string memory _companyName) {
        require(employers[_companyName].isRegistered, "Employer not registered");
        require(msg.sender == employers[_companyName].wallet, "Only employer wallet can call");
        _;
    }

    constructor(address _universityRegistry) {
        universityRegistry = IUniversityRegistry(_universityRegistry);
    }

    // ---------------- UNIVERSITY FUNCTIONS ----------------
    function registerStudent(
        string memory _name,
        string memory _university,
        string memory _email,
        string memory _skill,
        string memory _resumeCID,
        string memory _photoCID,
        string memory _degree,
        string memory _regNo,
        uint16 _yearCompletion
    ) public onlyUniversity {
        // Cross-verification
        require(verifyStudentWithUniversity(msg.sender, _name, _email, _degree, _regNo, _yearCompletion), 
                "Student details do not match university records");

        studentCount++;
        bytes32 computedHash = keccak256(
    abi.encodePacked(_name, _email, _degree, _regNo, _yearCompletion, _resumeCID)
);

students[studentCount] = Student({
    id: studentCount,
    name: _name,
    university: _university,
    email: _email,
    skill: _skill,
    resumeCID: _resumeCID,
    photoCID: _photoCID,
    resumeHash: computedHash,
    isVerified: false,
    studentWallet: msg.sender
});
    }

    function verifyStudent(uint256 _studentId) public onlyUniversity {
        students[_studentId].isVerified = true;
    }

    // ---------------- EMPLOYER FUNCTIONS ----------------
    function registerEmployer(string memory _companyName, address _wallet) public {
        require(!employers[_companyName].isRegistered, "Already registered");
        employers[_companyName] = Employer({
            companyName: _companyName,
            wallet: _wallet,
            isRegistered: true
        });
    }

    function assignTest(
        uint256 _studentId,
        string memory _companyName,
        string memory _employerEmail,
        string memory _employerContact,
        string memory _jobTitle,
        string memory _testDateTime,
        uint256 _durationMinutes
    ) public onlyEmployer(_companyName) {
        studentTests[_studentId].push(TestNotification({
            studentId: _studentId,
            companyName: _companyName,
            employerEmail: _employerEmail,
            employerContact: _employerContact,
            jobTitle: _jobTitle,
            testDateTime: _testDateTime,
            durationMinutes: _durationMinutes,
            submitted: false,
            score: 0
        }));

        uint256 testIndex = studentTests[_studentId].length - 1;
        testAssignedBy[_studentId][testIndex] = _companyName;
    }

    function submitTestResult(
        uint256 _studentId,
        uint256 _testIndex,
        uint256 _score,
        string memory _interviewDate,
        string memory _interviewLocation,
        uint256 _threshold
    ) public {
        TestNotification storage test = studentTests[_studentId][_testIndex];
        string memory companyName = test.companyName;

        require(employers[companyName].isRegistered, "Employer not registered");
        require(msg.sender == employers[companyName].wallet, "Only employer can submit result");

        test.submitted = true;
        test.score = _score;

        if (_score >= _threshold) {
            studentJobNotifications[_studentId].push(JobNotification({
                companyName: test.companyName,
                jobTitle: test.jobTitle,
                interviewDate: _interviewDate,
                interviewLocation: _interviewLocation,
                employerEmail: test.employerEmail,
                employerContact: test.employerContact
            }));
        }
    }

    function sendJobOffer(
        uint256 _studentId,
        string memory _companyName,
        string memory _jobTitle,
        string memory _description,
        string memory _salary,
        string memory _interviewDate,
        string memory _interviewLocation
    ) public onlyEmployer(_companyName) {
        studentJobNotifications[_studentId].push(JobNotification({
            companyName: _companyName,
            jobTitle: _jobTitle,
            interviewDate: _interviewDate,
            interviewLocation: _interviewLocation,
            employerEmail: "info@company.com",
            employerContact: "N/A"
        }));
    }

    function submitTestByStudent(
        uint256 _studentId,
        uint256 _testIndex,
        uint256[] memory _answers
    ) public {
        for (uint i = 0; i < studentTestSubmissions[_studentId].length; i++) {
            require(studentTestSubmissions[_studentId][i].testIndex != _testIndex, "Already submitted");
        }

        studentTestSubmissions[_studentId].push(StudentTestSubmission({
            testIndex: _testIndex,
            answers: _answers,
            submitted: true
        }));

        studentTests[_studentId][_testIndex].submitted = true;
    }

    // ---------------- SECURE GETTERS ----------------
    function getStudentTestAnswers(uint256 _studentId, uint256 _testIndex) public view returns (uint256[] memory) {
        string memory companyName = testAssignedBy[_studentId][_testIndex];
        require(employers[companyName].isRegistered, "Employer not registered");
        require(msg.sender == employers[companyName].wallet, "Only assigning employer can view answers");

        return studentTestSubmissions[_studentId][_testIndex].answers;
    }

    function searchStudentsBySkill(string memory _skill) public view returns (Student[] memory) {
        uint count = 0;
        for (uint i = 1; i <= studentCount; i++) {
            if (keccak256(bytes(students[i].skill)) == keccak256(bytes(_skill))) {
                count++;
            }
        }

        Student[] memory result = new Student[](count);
        uint index = 0;
        for (uint i = 1; i <= studentCount; i++) {
            if (keccak256(bytes(students[i].skill)) == keccak256(bytes(_skill))) {
                result[index] = students[i];
                index++;
            }
        }

        return result;
    }

    // ---------------- VIEW FUNCTIONS ----------------
    function getStudent(uint256 _studentId) public view returns (Student memory) {
        return students[_studentId];
    }

    function getStudentTests(uint256 _studentId) public view returns (TestNotification[] memory) {
        return studentTests[_studentId];
    }

    function getStudentJobNotifications(uint256 _studentId) public view returns (JobNotification[] memory) {
        return studentJobNotifications[_studentId];
    }

    function getStudentTestSubmissions(uint256 _studentId) public view returns (StudentTestSubmission[] memory) {
        return studentTestSubmissions[_studentId];
    }

    // ---------------- CROSS-VERIFICATION FUNCTION ----------------
    function verifyStudentWithUniversity(
        address _uniAddress,
        string memory _name,
        string memory _email,
        string memory _degree,
        string memory _regNo,
        uint16 _yearCompletion
    ) public view returns (bool) {
        // Fetch students from UniversityRegistry
        (
            string[] memory names,
            string[] memory emails,
            string[] memory degrees,
            string[] memory regNos,
            uint16[] memory yearsCompletion
        ) = universityRegistry.getStudents(_uniAddress);

        for (uint i = 0; i < names.length; i++) {
            if (
                keccak256(bytes(names[i])) == keccak256(bytes(_name)) &&
                keccak256(bytes(emails[i])) == keccak256(bytes(_email)) &&
                keccak256(bytes(degrees[i])) == keccak256(bytes(_degree)) &&
                keccak256(bytes(regNos[i])) == keccak256(bytes(_regNo)) &&
                yearsCompletion[i] == _yearCompletion
            ) {
                return true;
            }
        }
        return false;
    }
}
