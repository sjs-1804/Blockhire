// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EndorsementRegistry {
    struct Endorsement {
        address endorser;
        string skill;
        string digitalSignature;
        uint256 timestamp;
    }

    mapping(bytes32 => Endorsement[]) public resumeEndorsements;
    mapping(address => uint256) public endorserTrustScore;

    event SkillEndorsed(bytes32 indexed resumeID, address indexed endorser, string skill, string digitalSignature);

    function endorseSkill(
        bytes32 resumeID,
        string memory skill,
        string memory digitalSignature
    ) public {
        resumeEndorsements[resumeID].push(
            Endorsement({
                endorser: msg.sender,
                skill: skill,
                digitalSignature: digitalSignature,
                timestamp: block.timestamp
            })
        );

        endorserTrustScore[msg.sender] += 1;

        emit SkillEndorsed(resumeID, msg.sender, skill, digitalSignature);
    }

    function getEndorsements(bytes32 resumeID) public view returns (Endorsement[] memory) {
        return resumeEndorsements[resumeID];
    }

    function getTrustScore(address endorser) public view returns (uint256) {
        return endorserTrustScore[endorser];
    }
}
