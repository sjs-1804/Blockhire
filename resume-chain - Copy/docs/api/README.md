# API Documentation

Complete API reference for the Blockchain-Based Resume Verification System smart contracts.

## Table of Contents

- [UniversityRegistry](#universityregistry)
- [ResumeRegistry](#resumeregistry)
- [SkillRegistry](#skillregistry)
- [EndorsementRegistry](#endorsementregistry)
- [EmployeeRegistry](#employeeregistry)
- [Events](#events)
- [Error Codes](#error-codes)
- [Data Structures](#data-structures)

---

## UniversityRegistry

Manages university registration and student records.

### Functions

#### `addUniversity(universityAddress)`
- **Description**: Adds a new university to the registry
- **Access**: Owner only
- **Parameters**:
  - `universityAddress` (address): Address of the university wallet
- **Returns**: None
- **Emits**: `UniversityAdded`

#### `addStudent(name, email, degree, registrationNumber, phoneNumber, address, startYear, endYear, photoCID)`
- **Description**: Adds a student record to the university
- **Access**: Registered university only
- **Parameters**:
  - `name` (string): Student's full name
  - `email` (string): Student's email address
  - `degree` (string): Degree program
  - `registrationNumber` (string): University registration number
  - `phoneNumber` (string): Contact phone number
  - `address` (string): Physical address
  - `startYear` (uint256): Academic start year
  - `endYear` (uint256): Graduation year
  - `photoCID` (string): IPFS CID for student photo
- **Returns**: None
- **Emits**: `StudentAdded`

#### `getStudent(registrationNumber)`
- **Description**: Retrieves student information by registration number
- **Access**: Public
- **Parameters**:
  - `registrationNumber` (string): Student registration number
- **Returns**: Student struct with all details
- **View**: Yes

#### `getUniversityCount()`
- **Description**: Returns the total number of registered universities
- **Access**: Public
- **Parameters**: None
- **Returns**: uint256 - Number of universities
- **View**: Yes

#### `isUniversityVerified(universityAddress)`
- **Description**: Checks if a university is registered and verified
- **Access**: Public
- **Parameters**:
  - `universityAddress` (address): University address to check
- **Returns**: bool - True if verified
- **View**: Yes

---

## ResumeRegistry

Manages student resume registration and verification.

### Functions

#### `registerStudent(name, universityName, email, major, resumeCID, photoCID, degree, registrationNumber, graduationYear)`
- **Description**: Registers a new student profile
- **Access**: Registered university only
- **Parameters**:
  - `name` (string): Student's full name
  - `universityName` (string): University name
  - `email` (string): Student email
  - `major` (string): Field of study/major
  - `resumeCID` (string): IPFS CID for resume file
  - `photoCID` (string): IPFS CID for student photo
  - `degree` (string): Degree obtained
  - `registrationNumber` (string): University registration number
  - `graduationYear` (uint256): Graduation year
- **Returns**: None
- **Emits**: `StudentRegistered`

#### `verifyStudent(studentId)`
- **Description**: Verifies a student's profile
- **Access**: Registered university only
- **Parameters**:
  - `studentId` (uint256): ID of the student to verify
- **Returns**: None
- **Emits**: `StudentVerified`

#### `updateResume(newResumeCID)`
- **Description**: Updates student's resume
- **Access**: Student only
- **Parameters**:
  - `newResumeCID` (string): New IPFS CID for updated resume
- **Returns**: None
- **Emits**: `ResumeUpdated`

#### `getStudent(studentId)`
- **Description**: Retrieves student information
- **Access**: Public
- **Parameters**:
  - `studentId` (uint256): Student ID
- **Returns**: Student struct with all details
- **View**: Yes

#### `getAllStudents()`
- **Description**: Retrieves all registered students
- **Access**: Public
- **Parameters**: None
- **Returns**: Student[] array
- **View**: Yes

#### `getStudentCount()`
- **Description**: Returns total number of registered students
- **Access**: Public
- **Parameters**: None
- **Returns**: uint256 - Number of students
- **View**: Yes

#### `isStudentVerified(studentId)`
- **Description**: Checks if a student is verified
- **Access**: Public
- **Parameters**:
  - `studentId` (uint256): Student ID to check
- **Returns**: bool - True if verified
- **View**: Yes

---

## SkillRegistry

Manages skill tests and certifications.

### Functions

#### `createSkillTest(title, description, difficulty, timeLimit, passingScore)`
- **Description**: Creates a new skill test
- **Access**: Registered university only
- **Parameters**:
  - `title` (string): Test title
  - `description` (string): Test description
  - `difficulty` (string): Difficulty level (Beginner/Intermediate/Advanced)
  - `timeLimit` (uint256): Time limit in seconds
  - `passingScore` (uint256): Minimum score to pass (0-100)
- **Returns**: None
- **Emits**: `SkillTestCreated`

#### `requestTest(testId)`
- **Description**: Student requests to take a test
- **Access**: Any student
- **Parameters**:
  - `testId` (uint256): ID of the test to request
- **Returns**: None
- **Emits**: `TestRequested`

#### `approveTestRequest(testId, studentAddress)`
- **Description**: University approves a test request
- **Access**: Registered university only
- **Parameters**:
  - `testId` (uint256): Test ID
  - `studentAddress` (address): Student's wallet address
- **Returns**: None
- **Emits**: `TestRequestApproved`

#### `submitTestAnswers(testId, answers)`
- **Description**: Student submits test answers
- **Access**: Approved student only
- **Parameters**:
  - `testId` (uint256): Test ID
  - `answers` (uint256[]): Array of answer indices
- **Returns**: None
- **Emits**: `TestSubmitted`

#### `postTestScore(testId, studentAddress, score)`
- **Description**: University posts test score
- **Access**: Registered university only
- **Parameters**:
  - `testId` (uint256): Test ID
  - `studentAddress` (address): Student's address
  - `score` (uint256): Test score (0-100)
- **Returns**: None
- **Emits**: `TestScorePosted`

#### `getTest(testId)`
- **Description**: Retrieves test information
- **Access**: Public
- **Parameters**:
  - `testId` (uint256): Test ID
- **Returns**: Test struct with all details
- **View**: Yes

#### `getAllSkillTests()`
- **Description**: Retrieves all available skill tests
- **Access**: Public
- **Parameters**: None
- **Returns**: Test[] array
- **View**: Yes

#### `getTestScore(testId, studentAddress)`
- **Description**: Retrieves student's test score
- **Access**: Public
- **Parameters**:
  - `testId` (uint256): Test ID
  - `studentAddress` (address): Student's address
- **Returns**: uint256 - Test score
- **View**: Yes

#### `getTestCount()`
- **Description**: Returns total number of skill tests
- **Access**: Public
- **Parameters**: None
- **Returns**: uint256 - Number of tests
- **View**: Yes

---

## EndorsementRegistry

Manages skill endorsements and trust scores.

### Functions

#### `endorseSkill(studentId, skill, rating, comment)`
- **Description**: Endorses a student's skill
- **Access**: Registered employer only
- **Parameters**:
  - `studentId` (uint256): Student ID to endorse
  - `skill` (string): Skill name
  - `rating` (uint256): Rating from 1-5
  - `comment` (string): Endorsement comment
- **Returns**: None
- **Emits**: `SkillEndorsed`

#### `getStudentEndorsements(studentId)`
- **Description**: Retrieves all endorsements for a student
- **Access**: Public
- **Parameters**:
  - `studentId` (uint256): Student ID
- **Returns**: Endorsement[] array
- **View**: Yes

#### `getTrustScore(studentId)`
- **Description**: Calculates trust score for a student
- **Access**: Public
- **Parameters**:
  - `studentId` (uint256): Student ID
- **Returns**: uint256 - Trust score (0-100)
- **View**: Yes

#### `getEndorsementCount()`
- **Description**: Returns total number of endorsements
- **Access**: Public
- **Parameters**: None
- **Returns**: uint256 - Number of endorsements
- **View**: Yes

---

## EmployeeRegistry

Manages employer registration and job notifications.

### Functions

#### `registerEmployer(companyName, email, industry, employerAddress, logoCID)`
- **Description**: Registers a new employer
- **Access**: Public
- **Parameters**:
  - `companyName` (string): Company name
  - `email` (string): Company email
  - `industry` (string): Industry sector
  - `employerAddress` (address): Employer's wallet address
  - `logoCID` (string): IPFS CID for company logo
- **Returns**: None
- **Emits**: `EmployerRegistered`

#### `searchStudentsBySkill(skill)`
- **Description**: Searches for students by endorsed skill
- **Access**: Registered employer only
- **Parameters**:
  - `skill` (string): Skill to search for
- **Returns**: uint256[] array of student IDs
- **View**: Yes

#### `sendJobNotification(studentId, title, company, location, description)`
- **Description**: Sends job notification to student
- **Access**: Registered employer only
- **Parameters**:
  - `studentId` (uint256): Student ID
  - `title` (string): Job title
  - `company` (string): Company name
  - `location` (string): Job location
  - `description` (string): Job description
- **Returns**: None
- **Emits**: `JobNotificationSent`

#### `getStudentJobNotifications(studentId)`
- **Description**: Retrieves job notifications for a student
- **Access**: Student only
- **Parameters**:
  - `studentId` (uint256): Student ID
- **Returns**: JobNotification[] array
- **View**: Yes

#### `getEmployer(employerAddress)`
- **Description**: Retrieves employer information
- **Access**: Public
- **Parameters**:
  - `employerAddress` (address): Employer's address
- **Returns**: Employer struct with details
- **View**: Yes

#### `getEmployerCount()`
- **Description**: Returns total number of registered employers
- **Access**: Public
- **Parameters**: None
- **Returns**: uint256 - Number of employers
- **View**: Yes

---

## Events

### UniversityRegistry Events

#### `UniversityAdded(address indexed universityAddress, uint256 timestamp)`
Emitted when a new university is added.

#### `StudentAdded(string indexed registrationNumber, address indexed universityAddress, uint256 timestamp)`
Emitted when a student is added to university records.

### ResumeRegistry Events

#### `StudentRegistered(uint256 indexed studentId, string name, string email, uint256 timestamp)`
Emitted when a student registers their profile.

#### `StudentVerified(uint256 indexed studentId, address indexed universityAddress, uint256 timestamp)`
Emitted when a student is verified.

#### `ResumeUpdated(uint256 indexed studentId, string newResumeCID, uint256 timestamp)`
Emitted when a student updates their resume.

### SkillRegistry Events

#### `SkillTestCreated(uint256 indexed testId, string title, address indexed creatorAddress, uint256 timestamp)`
Emitted when a new skill test is created.

#### `TestRequested(uint256 indexed testId, address indexed studentAddress, uint256 timestamp)`
Emitted when a student requests a test.

#### `TestSubmitted(uint256 indexed testId, address indexed studentAddress, uint256 timestamp)`
Emitted when a student submits test answers.

#### `TestScorePosted(uint256 indexed testId, address indexed studentAddress, uint256 score, uint256 timestamp)`
Emitted when test score is posted.

### EndorsementRegistry Events

#### `SkillEndorsed(uint256 indexed studentId, string skill, uint256 rating, address indexed endorserAddress, uint256 timestamp)`
Emitted when a skill is endorsed.

### EmployeeRegistry Events

#### `EmployerRegistered(address indexed employerAddress, string companyName, string industry, uint256 timestamp)`
Emitted when an employer registers.

#### `JobNotificationSent(uint256 indexed studentId, address indexed employerAddress, string title, uint256 timestamp)`
Emitted when a job notification is sent.

---

## Error Codes

### Common Errors

- `UNAUTHORIZED`: Caller doesn't have required permissions
- `INVALID_INPUT`: Input parameter is invalid
- `NOT_FOUND`: Requested resource doesn't exist
- `ALREADY_EXISTS`: Resource already exists
- `INSUFFICIENT_GAS`: Transaction gas limit too low

### UniversityRegistry Errors

- `UNIVERSITY_NOT_VERIFIED`: University is not registered
- `STUDENT_NOT_FOUND`: Student record not found
- `UNAUTHORIZED_ACCESS`: Only owner can add universities

### ResumeRegistry Errors

- `STUDENT_NOT_VERIFIED`: Student must be verified first
- `INVALID_RESUME_CID`: Invalid IPFS CID format
- `UNAUTHORIZED_UPDATE`: Only student can update their resume

### SkillRegistry Errors

- `TEST_NOT_FOUND`: Skill test doesn't exist
- `REQUEST_NOT_APPROVED`: Test request not approved
- `ALREADY_SUBMITTED`: Test already submitted
- `SCORE_ALREADY_POSTED`: Score already posted

### EndorsementRegistry Errors

- `STUDENT_NOT_VERIFIED`: Student must be verified to receive endorsements
- `INVALID_RATING`: Rating must be between 1 and 5
- `ALREADY_ENDORSED`: Skill already endorsed by this employer

### EmployeeRegistry Errors

- `EMPLOYER_NOT_REGISTERED`: Employer not registered
- `STUDENT_NOT_VERIFIED`: Student must be verified for job notifications
- `UNAUTHORIZED_ACCESS`: Only student can view their notifications

---

## Data Structures

### Student Struct
```solidity
struct Student {
    uint256 id;
    string name;
    string email;
    string universityName;
    string major;
    string resumeCID;
    string photoCID;
    string degree;
    string registrationNumber;
    uint256 graduationYear;
    bool isVerified;
    address universityAddress;
    uint256 createdAt;
    uint256 verifiedAt;
}
```

### University Struct
```solidity
struct University {
    address universityAddress;
    bool isVerified;
    uint256 registeredAt;
}
```

### SkillTest Struct
```solidity
struct SkillTest {
    uint256 id;
    string title;
    string description;
    string difficulty;
    uint256 timeLimit;
    uint256 passingScore;
    address creatorAddress;
    uint256 createdAt;
    bool isActive;
}
```

### Endorsement Struct
```solidity
struct Endorsement {
    uint256 id;
    uint256 studentId;
    string skill;
    uint256 rating;
    string comment;
    address endorserAddress;
    uint256 createdAt;
}
```

### Employer Struct
```solidity
struct Employer {
    address employerAddress;
    string companyName;
    string email;
    string industry;
    string logoCID;
    bool isRegistered;
    uint256 registeredAt;
}
```

### JobNotification Struct
```solidity
struct JobNotification {
    uint256 id;
    uint256 studentId;
    address employerAddress;
    string title;
    string company;
    string location;
    string description;
    uint256 createdAt;
    bool isRead;
}
```

---

## Usage Examples

### Student Registration
```javascript
// Connect to contract
const resumeRegistry = new ethers.Contract(resumeAddress, resumeABI, signer);

// Register student
const tx = await resumeRegistry.registerStudent(
    "Alice Johnson",
    "Stanford University",
    "alice@stanford.edu",
    "Computer Science",
    "QmResumeCID...",
    "QmPhotoCID...",
    "BSc Computer Science",
    "REG2024001",
    2024
);

await tx.wait();
```

### Skill Endorsement
```javascript
// Connect to contract
const endorsementRegistry = new ethers.Contract(endorsementAddress, endorsementABI, signer);

// Endorse skill
const tx = await endorsementRegistry.endorseSkill(
    1, // studentId
    "JavaScript",
    5, // rating
    "Excellent JavaScript skills demonstrated"
);

await tx.wait();
```

### Student Search
```javascript
// Connect to contract
const employeeRegistry = new ethers.Contract(employeeAddress, employeeABI, signer);

// Search students by skill
const studentIds = await employeeRegistry.searchStudentsBySkill("JavaScript");
console.log("Found students:", studentIds);
```

### Job Notification
```javascript
// Send job notification
const tx = await employeeRegistry.sendJobNotification(
    1, // studentId
    "Senior Frontend Developer",
    "Tech Corp",
    "San Francisco, CA",
    "Exciting opportunity for a skilled frontend developer"
);

await tx.wait();
```

---

For more detailed examples and integration guides, see the [Development Documentation](../guides/development.md).