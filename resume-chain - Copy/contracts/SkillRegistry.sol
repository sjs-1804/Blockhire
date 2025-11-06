// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UniversityRegistry.sol";

contract SkillRegistry {
    UniversityRegistry uniContract;

    constructor(address uniRegistryAddress) {
        uniContract = UniversityRegistry(uniRegistryAddress);
    }

    enum TestMode { ONLINE, OFFLINE }

    struct Question {
        string questionText;
        string[] options;
        uint correctOption;
    }

    struct SkillTest {
        string skillName;
        Question[] questions;
        TestMode mode;
        uint startTime;
        uint endTime;
        bool active;
        address[] participants;
        mapping(address => uint) submittedScores;
        mapping(address => bool) submitted;
    }

    struct Skill {
        string name;
        bool verified;
        uint score;
        string batch;
    }

    mapping(address => SkillTest[]) public universityTests;
    mapping(address => Skill[]) public studentSkills;

    // University posts a test
    function postSkillTest(
        string memory skillName,
        string[] memory questionTexts,
        string[][] memory options,
        uint[] memory correctOptions,
        TestMode mode,
        uint startTime,
        uint endTime
    ) public {
        require(uniContract.isUniversityVerified(msg.sender), "Only verified universities can post tests");
        require(questionTexts.length == options.length && options.length == correctOptions.length, "Mismatched lengths");

        SkillTest storage test = universityTests[msg.sender].push();
        test.skillName = skillName;
        test.mode = mode;
        test.startTime = startTime;
        test.endTime = endTime;
        test.active = true;

        for (uint i = 0; i < questionTexts.length; i++) {
            test.questions.push(Question({
                questionText: questionTexts[i],
                options: options[i],
                correctOption: correctOptions[i]
            }));
        }
    }

    // Student submits online test
    function submitOnlineTest(address university, uint testIndex, uint[] memory answers) public {
        SkillTest storage test = universityTests[university][testIndex];
        require(test.active, "Test is not active");
        require(test.mode == TestMode.ONLINE, "Not an online test");
        require(block.timestamp >= test.startTime && block.timestamp <= test.endTime, "Test not in active window");
        require(!test.submitted[msg.sender], "Already submitted");
        require(answers.length == test.questions.length, "Answer count mismatch");

        uint score = 0;
        for (uint i = 0; i < answers.length; i++) {
            if (answers[i] == test.questions[i].correctOption) {
                score++;
            }
        }

        test.submitted[msg.sender] = true;
        test.submittedScores[msg.sender] = score;

        studentSkills[msg.sender].push(Skill({
            name: test.skillName,
            verified: true,
            score: score,
            batch: ""
        }));
    }

    // University assigns offline score
    function setOfflineScore(address student, uint testIndex, uint score, string memory batch) public {
        SkillTest storage test = universityTests[msg.sender][testIndex];
        require(test.mode == TestMode.OFFLINE, "Not an offline test");
        require(uniContract.isUniversityVerified(msg.sender), "Only verified university can assign scores");

        studentSkills[student].push(Skill({
            name: test.skillName,
            verified: true,
            score: score,
            batch: batch
        }));
    }

    // Get student skills
    function getSkills(address student) public view returns (Skill[] memory) {
        return studentSkills[student];
    }
}
