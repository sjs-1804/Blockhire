// ==============================
// Mega app.js - Full Integration
// ==============================
let web3, accounts;
let universityRegistry, resumeRegistry, employeeRegistry;

// ---------------------- INITIALIZE ----------------------
async function init() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        accounts = await web3.eth.getAccounts();

        // ------------------ Replace with deployed addresses ------------------
        const universityRegistryAddress = "0x..."; // UniversityRegistry.sol
        const resumeRegistryAddress = "0x...";     // ResumeRegistry.sol
        const employeeRegistryAddress = "0x...";   // EmployeeRegistry.sol

        universityRegistry = new web3.eth.Contract(universityRegistryABI, universityRegistryAddress);
        resumeRegistry = new web3.eth.Contract(resumeRegistryABI, resumeRegistryAddress);
        employeeRegistry = new web3.eth.Contract(employeeRegistryABI, employeeRegistryAddress);

        console.log("✅ DApp connected:", accounts[0]);
        loadStudentNotifications();
        loadEmployerStudentSearch();
    } else {
        alert("Please install MetaMask to use this DApp!");
    }
}

window.addEventListener("load", init);

// ======================= UNIVERSITY FUNCTIONS =======================
async function addUniversity(name, email, accreditationNo) {
    await universityRegistry.methods.addUniversity(name, email, accreditationNo).send({ from: accounts[0] });
    alert("✅ University added");
}

async function addStudent(universityId, name, email, course, year) {
    await universityRegistry.methods.addStudent(universityId, name, email, course, year).send({ from: accounts[0] });
    alert("✅ Student added");
}

async function approveRequest(studentId, requestIndex, time, place) {
    await universityRegistry.methods.approveRequest(studentId, requestIndex, time, place).send({ from: accounts[0] });
    alert("✅ Request approved");
}

async function postMarks(studentId, requestIndex, marks) {
    await universityRegistry.methods.postMarks(studentId, requestIndex, marks).send({ from: accounts[0] });
    alert("✅ Marks posted");
}

// ======================= STUDENT FUNCTIONS =======================
let currentStudentId;

async function registerStudent(name, email, universityId, course, year, resumeCID, skill) {
    try {
        // Register in UniversityRegistry
        const tx = await universityRegistry.methods.registerStudent(name, email, universityId, course, year, resumeCID).send({ from: accounts[0] });
        const studentCount = await universityRegistry.methods.studentCount().call();
        currentStudentId = studentCount;

        // Register in ResumeRegistry
        await resumeRegistry.methods.registerStudent(name, universityId.toString(), email, skill, resumeCID).send({ from: accounts[0] });

        alert(`✅ Registered successfully! Student ID: ${currentStudentId}`);
        loadStudentNotifications();
    } catch (err) {
        console.error(err);
        alert("Error registering student: " + (err.message || err.reason));
    }
}

async function requestSkillTest(skillName, testType) {
    if (!currentStudentId) return alert("Please register first!");
    await universityRegistry.methods.requestSkillTest(currentStudentId, skillName, testType).send({ from: accounts[0] });
    alert("✅ Skill test requested");
    loadStudentNotifications();
}

async function loadStudentNotifications() {
    if (!currentStudentId) return;

    // Skill test results
    const tests = await resumeRegistry.methods.getStudentTests(currentStudentId).call();
    const testBody = document.getElementById("testNotifBody");
    testBody.innerHTML = "";
    tests.forEach(t => {
        testBody.innerHTML += `
            <tr>
                <td class="border px-4 py-2">${t.skill}</td>
                <td class="border px-4 py-2">${t.testType}</td>
                <td class="border px-4 py-2">${t.isApproved ? "Approved" : "Pending"}</td>
                <td class="border px-4 py-2">${t.schedule || "-"}</td>
                <td class="border px-4 py-2">${t.result || "-"}</td>
            </tr>`;
    });

    // Job notifications
    const jobs = await employeeRegistry.methods.getNotificationsForStudent(currentStudentId).call();
    const jobBody = document.getElementById("jobNotifBody");
    jobBody.innerHTML = "";
    jobs.forEach(j => {
        jobBody.innerHTML += `
            <tr>
                <td class="border px-4 py-2">${j.title}</td>
                <td class="border px-4 py-2">${j.employerId}</td>
                <td class="border px-4 py-2">${j.skills}</td>
                <td class="border px-4 py-2">${j.salary}</td>
                <td class="border px-4 py-2">${j.interviewDate}</td>
                <td class="border px-4 py-2">${j.location}</td>
            </tr>`;
    });
}

// ======================= EMPLOYER FUNCTIONS =======================
async function registerEmployer(orgName, location, managerName, contactInfo, email, description, profileCID) {
    await employeeRegistry.methods.registerEmployer(orgName, location, managerName, contactInfo, email, description, profileCID).send({ from: accounts[0] });
    alert("✅ Employer registered successfully");
}

async function searchStudentsBySkill() {
    const skill = document.getElementById("skillInput").value.trim();
    if (!skill) return alert("Enter a skill");
    const students = await universityRegistry.methods.searchStudentsBySkill(skill).call();

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";
    if (students.length === 0) {
        resultsDiv.innerHTML = `<p class="text-gray-600">No students found with this skill</p>`;
        return;
    }

    students.forEach(s => {
        resultsDiv.innerHTML += `
        <div class="bg-white p-4 rounded shadow mb-4">
            <h3 class="font-bold">👨‍🎓 ${s.name}</h3>
            <p>Email: ${s.email}</p>
            <p>Course: ${s.course} (Year ${s.year})</p>
            <p>University ID: ${s.universityId}</p>
            <p>Resume: <a href="https://ipfs.io/ipfs/${s.resumeCID}" target="_blank">${s.resumeCID}</a></p>
            <button onclick="sendJobNotification('${s.id}')" class="mt-2 bg-green-600 text-white px-3 py-1 rounded">📩 Send Job Invite</button>
        </div>`;
    });
}

async function sendJobNotification(studentId) {
    const title = prompt("Job Title");
    const desc = prompt("Description");
    const salary = prompt("Salary");
    const skills = prompt("Skills Required");
    const interviewDate = prompt("Interview Date & Time");
    const location = prompt("Interview Location");

    await employeeRegistry.methods.sendJobNotification(
        studentId, title, desc, salary, skills, interviewDate, location
    ).send({ from: accounts[0] });

    alert("✅ Job notification sent");
}

// Optional: pre-load student search for employer portal
async function loadEmployerStudentSearch() {
    if (!document.getElementById("skillInput")) return;
    document.getElementById("skillInput").addEventListener("input", searchStudentsBySkill);
}
