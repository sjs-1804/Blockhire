/**
 * Test Data Fixtures for Resume Verification System
 * Contains sample data for universities, students, employers, and skills
 */

const TEST_DATA = {
  // University test data
  universities: [
    {
      name: "Stanford University",
      domain: "stanford.edu",
      address: "0x1234567890123456789012345678901234567890"
    },
    {
      name: "MIT",
      domain: "mit.edu",
      address: "0x2345678901234567890123456789012345678901"
    },
    {
      name: "UC Berkeley",
      domain: "berkeley.edu",
      address: "0x3456789012345678901234567890123456789012"
    }
  ],

  // Student test data
  students: [
    {
      name: "Alice Johnson",
      email: "alice@stanford.edu",
      degree: "BSc Computer Science",
      registrationNumber: "REG2024001",
      phoneNumber: "123-456-7890",
      address: "123 Campus Drive, Stanford, CA 94305",
      startYear: 2020,
      endYear: 2024,
      major: "Computer Science",
      photoCID: "QmAlicePhotoCID1234567890abcdef",
      resumeCID: "QmAliceResumeCID1234567890abcdef"
    },
    {
      name: "Bob Smith",
      email: "bob@mit.edu",
      degree: "MSc Electrical Engineering",
      registrationNumber: "REG2023002",
      phoneNumber: "234-567-8901",
      address: "456 Technology Square, Cambridge, MA 02139",
      startYear: 2019,
      endYear: 2023,
      major: "Electrical Engineering",
      photoCID: "QmBobPhotoCID2345678901bcdefg",
      resumeCID: "QmBobResumeCID2345678901bcdefg"
    },
    {
      name: "Carol Williams",
      email: "carol@berkeley.edu",
      degree: "PhD Computer Science",
      registrationNumber: "REG2022003",
      phoneNumber: "345-678-9012",
      address: "789 University Ave, Berkeley, CA 94720",
      startYear: 2018,
      endYear: 2024,
      major: "Computer Science",
      photoCID: "QmCarolPhotoCID3456789012cdefgh",
      resumeCID: "QmCarolResumeCID3456789012cdefgh"
    }
  ],

  // Employer test data
  employers: [
    {
      companyName: "Google",
      email: "careers@google.com",
      industry: "Technology",
      companyAddress: "1600 Amphitheatre Parkway, Mountain View, CA 94043",
      logoCID: "QmGoogleLogoCID1234567890abcdef",
      description: "Leading technology company"
    },
    {
      companyName: "Microsoft",
      email: "careers@microsoft.com",
      industry: "Software Development",
      companyAddress: "1 Microsoft Way, Redmond, WA 98052",
      logoCID: "QmMicrosoftLogoCID2345678901bcdefg",
      description: "Software and cloud services company"
    },
    {
      companyName: "Apple",
      email: "careers@apple.com",
      industry: "Consumer Electronics",
      companyAddress: "1 Apple Park Way, Cupertino, CA 95014",
      logoCID: "QmAppleLogoCID3456789012cdefgh",
      description: "Consumer electronics and software company"
    }
  ],

  // Skill test data
  skillTests: [
    {
      title: "JavaScript Fundamentals",
      description: "Test your knowledge of JavaScript basics including variables, functions, and control flow",
      difficulty: "Beginner",
      timeLimit: 1800, // 30 minutes
      passingScore: 70,
      questions: [
        {
          question: "What is the correct way to declare a variable in JavaScript?",
          options: ["var x = 5;", "variable x = 5;", "declare x = 5;", "x = 5;"],
          correctAnswer: 0
        },
        {
          question: "Which method is used to add an element to the end of an array?",
          options: ["push()", "pop()", "shift()", "unshift()"],
          correctAnswer: 0
        }
      ]
    },
    {
      title: "React.js Advanced",
      description: "Advanced React concepts including hooks, context, and performance optimization",
      difficulty: "Advanced",
      timeLimit: 3600, // 1 hour
      passingScore: 80,
      questions: [
        {
          question: "Which hook is used for side effects in React?",
          options: ["useState", "useEffect", "useContext", "useReducer"],
          correctAnswer: 1
        },
        {
          question: "What is the purpose of React.memo?",
          options: ["Memoize function calls", "Prevent unnecessary re-renders", "Cache API responses", "Optimize bundle size"],
          correctAnswer: 1
        }
      ]
    },
    {
      title: "Blockchain Basics",
      description: "Introduction to blockchain technology and cryptocurrency concepts",
      difficulty: "Intermediate",
      timeLimit: 2700, // 45 minutes
      passingScore: 75,
      questions: [
        {
          question: "What is a hash function in blockchain?",
          options: ["Encrypts data", "Maps input to fixed-size output", "Stores data", "Validates transactions"],
          correctAnswer: 1
        }
      ]
    }
  ],

  // Skills for endorsements
  skills: [
    "JavaScript",
    "React.js",
    "Node.js",
    "Python",
    "Solidity",
    "Smart Contracts",
    "Blockchain Development",
    "Web3.js",
    "IPFS",
    "Cryptography",
    "Data Structures",
    "Algorithms",
    "Machine Learning",
    "Cloud Computing",
    "DevOps"
  ],

  // Sample job descriptions
  jobDescriptions: [
    {
      title: "Senior Frontend Developer",
      company: "Google",
      location: "Mountain View, CA",
      type: "Full-time",
      description: "We're looking for an experienced frontend developer to join our team.",
      requirements: ["5+ years React experience", "Strong JavaScript skills", "Experience with large-scale applications"],
      salary: "$150,000 - $200,000"
    },
    {
      title: "Blockchain Developer",
      company: "Microsoft",
      location: "Redmond, WA",
      type: "Full-time",
      description: "Join our blockchain team to build decentralized solutions.",
      requirements: ["Solidity expertise", "Smart contract development", "Web3.js experience"],
      salary: "$140,000 - $180,000"
    }
  ],

  // Sample endorsements
  endorsements: [
    {
      skill: "JavaScript",
      rating: 5,
      comment: "Excellent JavaScript skills, very knowledgeable about modern frameworks and best practices.",
      endorsementType: "technical"
    },
    {
      skill: "React.js",
      rating: 4,
      comment: "Strong React developer with good understanding of hooks and component architecture.",
      endorsementType: "technical"
    },
    {
      skill: "Communication",
      rating: 5,
      comment: "Great communicator, works well in team environments and explains complex concepts clearly.",
      endorsementType: "softskill"
    }
  ],

  // Security test scenarios
  securityScenarios: {
    unauthorizedAccess: {
      description: "Attempt to access functions without proper authorization",
      attackerScenarios: [
        "Student trying to verify other students",
        "Employer trying to register universities",
        "Unauthorized user attempting to create skill tests"
      ]
    },
    reentrancy: {
      description: "Test for reentrancy attack vulnerabilities",
      vulnerableFunctions: [
        "verifyStudent",
        "endorseSkill",
        "registerEmployer"
      ]
    },
    overflow: {
      description: "Test for integer overflow/underflow vulnerabilities",
      testCases: [
        "Maximum skill rating (255)",
        "Maximum number of endorsements",
        "Maximum time limits for tests"
      ]
    }
  },

  // Performance test data
  performanceTests: {
    batchSizes: [10, 50, 100, 500],
    concurrentUsers: [5, 10, 25, 50],
    stressTestDuration: 300, // 5 minutes
    gasLimitThreshold: 500000, // Maximum acceptable gas per transaction
    responseTimeThreshold: 5000 // Maximum response time in milliseconds
  }
};

/**
 * Get random student data
 */
function getRandomStudent() {
  const students = TEST_DATA.students;
  return students[Math.floor(Math.random() * students.length)];
}

/**
 * Get random employer data
 */
function getRandomEmployer() {
  const employers = TEST_DATA.employers;
  return employers[Math.floor(Math.random() * employers.length)];
}

/**
 * Get random skill
 */
function getRandomSkill() {
  const skills = TEST_DATA.skills;
  return skills[Math.floor(Math.random() * skills.length)];
}

/**
 * Get random skill test
 */
function getRandomSkillTest() {
  const tests = TEST_DATA.skillTests;
  return tests[Math.floor(Math.random() * tests.length)];
}

module.exports = {
  TEST_DATA,
  getRandomStudent,
  getRandomEmployer,
  getRandomSkill,
  getRandomSkillTest
};