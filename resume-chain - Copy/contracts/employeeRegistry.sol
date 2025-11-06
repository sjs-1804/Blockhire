// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IResumeRegistry {
    function searchStudentsBySkill(string memory _skill) external view returns (uint256[] memory);
}

contract EmployeeRegistry {
    struct Employer {
        string companyName;
        string location;
        string contactPerson;
        string contactNumber;
        string email;
        string description;
        string profileCID;
        address wallet;
        bool isRegistered;
    }

    struct Test {
        uint256[] studentIds;
        string jobTitle;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 durationMinutes;
        string[] questions;
        uint256[] maxMarks;
        uint256 totalMarks;
        bool isMCQ; // true for MCQ auto-evaluation, false for manual
        mapping(uint256 => bool) submitted; // studentId => submitted
        mapping(uint256 => uint256[]) answers; // studentId => answers
        mapping(uint256 => uint256) scores; // studentId => score
    }

    mapping(address => Employer) public employers;
    Test[] private tests;
    IResumeRegistry public resumeRegistry;

    modifier onlyRegisteredEmployer() {
        require(employers[msg.sender].isRegistered, "Employer not registered");
        _;
    }

    event EmployerRegistered(address indexed employer);
    event TestAssigned(uint256 indexed testIndex, uint256[] studentIds, uint256 startTime, uint256 endTime);
    event TestSubmitted(uint256 indexed testIndex, uint256 indexed studentId, uint256 score);
    event JobNotification(uint256 indexed studentId, string jobTitle, string companyName);

    constructor(address _resumeRegistry) {
        resumeRegistry = IResumeRegistry(_resumeRegistry);
    }

    // ---------------- EMPLOYER FUNCTIONS ----------------
    function registerEmployer(
        string memory _companyName,
        string memory _location,
        string memory _contactPerson,
        string memory _contactNumber,
        string memory _email,
        string memory _description,
        string memory _profileCID
    ) public {
        require(!employers[msg.sender].isRegistered, "Already registered");
        employers[msg.sender] = Employer({
            companyName: _companyName,
            location: _location,
            contactPerson: _contactPerson,
            contactNumber: _contactNumber,
            email: _email,
            description: _description,
            profileCID: _profileCID,
            wallet: msg.sender,
            isRegistered: true
        });
        emit EmployerRegistered(msg.sender);
    }

    function searchStudentsBySkill(string memory _skill) public view onlyRegisteredEmployer returns (uint256[] memory) {
        return resumeRegistry.searchStudentsBySkill(_skill);
    }

    function createTest(
        uint256[] memory _studentIds,
        string memory _jobTitle,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _durationMinutes,
        string[] memory _questions,
        uint256[] memory _maxMarks,
        uint256 _totalMarks,
        bool _isMCQ
    ) public onlyRegisteredEmployer returns (uint256) {
        require(_questions.length == _maxMarks.length, "Questions and marks length mismatch");

        Test storage newTest = tests.push();
        newTest.studentIds = _studentIds;
        newTest.jobTitle = _jobTitle;
        newTest.description = _description;
        newTest.startTime = _startTime;
        newTest.endTime = _endTime;
        newTest.durationMinutes = _durationMinutes;
        newTest.questions = _questions;
        newTest.maxMarks = _maxMarks;
        newTest.totalMarks = _totalMarks;
        newTest.isMCQ = _isMCQ;

        for (uint i = 0; i < _studentIds.length; i++) {
            newTest.submitted[_studentIds[i]] = false;
        }

        uint256 testIndex = tests.length - 1;
        emit TestAssigned(testIndex, _studentIds, _startTime, _endTime);
        return testIndex;
    }

    function submitTest(uint256 _testIndex, uint256 _studentId, uint256[] memory _answers) public {
        require(_testIndex < tests.length, "Invalid test index");
        Test storage t = tests[_testIndex];
        require(block.timestamp >= t.startTime, "Test not started yet");
        require(block.timestamp <= t.endTime, "Test already ended");
        require(!t.submitted[_studentId], "Already submitted");

        t.answers[_studentId] = _answers;
        t.submitted[_studentId] = true;

        uint256 score = 0;
        if (t.isMCQ) {
            for (uint i = 0; i < _answers.length && i < t.maxMarks.length; i++) {
                score += _answers[i] <= t.maxMarks[i] ? _answers[i] : t.maxMarks[i];
            }
            t.scores[_studentId] = score;
            emit TestSubmitted(_testIndex, _studentId, score);
        }
    }

    function autoSubmitExpiredTest(uint256 _testIndex) public {
        require(_testIndex < tests.length, "Invalid test index");
        Test storage t = tests[_testIndex];
        require(block.timestamp > t.endTime, "Test not ended yet");

        for (uint i = 0; i < t.studentIds.length; i++) {
            uint256 studentId = t.studentIds[i];
            if (!t.submitted[studentId]) {
                uint256[] memory emptyAnswers = new uint256[](t.questions.length);
                t.answers[studentId] = emptyAnswers;
                t.submitted[studentId] = true;
                if (t.isMCQ) {
                    t.scores[studentId] = 0;
                    emit TestSubmitted(_testIndex, studentId, 0);
                }
            }
        }
    }

    function setManualScore(uint256 _testIndex, uint256 _studentId, uint256 _score) public onlyRegisteredEmployer {
        Test storage t = tests[_testIndex];
        require(t.submitted[_studentId], "Student did not submit");
        require(!t.isMCQ, "MCQ auto-evaluated");
        t.scores[_studentId] = _score;
        emit TestSubmitted(_testIndex, _studentId, _score);
    }

    function notifyJob(uint256 _testIndex, uint256 _threshold) public onlyRegisteredEmployer {
        Test storage t = tests[_testIndex];
        for (uint i = 0; i < t.studentIds.length; i++) {
            uint256 studentId = t.studentIds[i];
            if (t.scores[studentId] >= _threshold) {
                emit JobNotification(studentId, t.jobTitle, employers[msg.sender].companyName);
            }
        }
    }

    // ---------------- VIEW FUNCTIONS ----------------
    function getTest(uint256 _testIndex) public view returns (
        uint256[] memory studentIds,
        string memory jobTitle,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 durationMinutes,
        string[] memory questions,
        uint256[] memory maxMarks,
        uint256 totalMarks,
        bool isMCQ
    ) {
        Test storage t = tests[_testIndex];
        return (
            t.studentIds, t.jobTitle, t.description, t.startTime, t.endTime, t.durationMinutes,
            t.questions, t.maxMarks, t.totalMarks, t.isMCQ
        );
    }

    function getStudentAnswers(uint256 _testIndex, uint256 _studentId) public view returns (uint256[] memory) {
        Test storage t = tests[_testIndex];
        return t.answers[_studentId];
    }

    function getStudentScore(uint256 _testIndex, uint256 _studentId) public view returns (uint256) {
        return tests[_testIndex].scores[_studentId];
    }

    function totalTests() public view returns (uint256) {
        return tests.length;
    }
}
