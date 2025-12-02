// In server/seedData.js
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Event = require('./models/event.model');
const Certificate = require('./models/certificate.model');
const SystemLog = require('./models/systemLog.model');
const Quiz = require('./models/quiz.model');
const StudentRoster = require('./models/studentRoster.model');
const { nanoid } = require('nanoid');
require('dotenv').config();

// --- CONFIGURATION ---
const DEPARTMENTS = ['MCA', 'CSE', 'ECE', 'ISE', 'MECH', 'CIVIL'];
const EVENT_TYPES = ['Workshop', 'Seminar', 'Hackathon', 'Bootcamp', 'Symposium', 'Guest Lecture'];
const TITLES = ['CERTIFICATE OF PARTICIPATION', 'CERTIFICATE OF ACHIEVEMENT', 'CERTIFICATE OF EXCELLENCE'];
const QUIZ_TOPICS = ['React.js Basics', 'Blockchain Fundamentals', 'Advanced Python', 'Data Structures', 'AI Ethics', 'Cloud Computing'];

// --- HELPERS ---
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const seedDatabase = async () => {
    try {
        console.log("🌱 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        // --- 0. CLEANUP (Optional - Uncomment to wipe DB first) ---
        // await User.deleteMany({ role: 'Student' });
        // await Event.deleteMany({});
        // await Certificate.deleteMany({});
        // await SystemLog.deleteMany({});
        // await Quiz.deleteMany({});
        // console.log("🧹 Cleaned old data.");

        // --- 1. CREATE FACULTY (If not exists) ---
        let faculty = await User.findOne({ email: 'faculty@college.com' });
        if (!faculty) {
            // In a real app, you'd hash the password. For seed, we assume you might have one or create a dummy
            // Skipping creation to avoid auth complexity, assuming you have one logged in or will create via invite.
            // We will fetch ANY faculty to use as the "creator"
            faculty = await User.findOne({ role: 'Faculty' });
        }
        // If still no faculty, find ANY admin or user to blame
        const creatorId = faculty ? faculty._id : (await User.findOne())._id; 

        // --- 2. CREATE STUDENTS (Activated Users) ---
        console.log("👨‍🎓 Seeding Students...");
        const students = [];
        for (let i = 1; i <= 50; i++) {
            const dept = random(DEPARTMENTS);
            const email = `student${i}@college.com`;
            
            let student = await User.findOne({ email });
            if (!student) {
                student = await User.create({
                    name: `Student ${i} (${dept})`,
                    email: email,
                    password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // Dummy hash
                    role: 'Student',
                    department: dept,
                    usn: `1KS24${dept}${String(i).padStart(3, '0')}`,
                    semester: `${Math.ceil(Math.random() * 8)}th`,
                    isVerified: true,
                    // Simulate some having wallets connected
                    walletAddress: Math.random() > 0.5 ? `0x${nanoid(40)}` : null
                });
            }
            students.push(student);
        }

        // --- 3. CREATE EVENTS (Past & Future) ---
        console.log("📅 Seeding Events...");
        const events = [];
        const today = new Date();
        const lastYear = new Date(new Date().setFullYear(today.getFullYear() - 1));
        const nextMonth = new Date(new Date().setMonth(today.getMonth() + 2));

        for (let i = 1; i <= 15; i++) {
            const isPast = Math.random() > 0.2; // 80% past events
            const eventDate = isPast ? randomDate(lastYear, today) : randomDate(today, nextMonth);
            const type = random(EVENT_TYPES);
            const dept = random(DEPARTMENTS);
            
            const event = await Event.create({
                name: `${dept} ${type} 202${Math.floor(Math.random()*2) + 4}`, // e.g. MCA Workshop 2024
                date: eventDate,
                description: `An intensive ${type} organized by the Department of ${dept}. Focusing on industry skills and practical knowledge.`,
                createdBy: creatorId,
                department: dept,
                isPublic: Math.random() > 0.7, // 30% public
                certificatesIssued: isPast, // Only past events have certs
                certificateConfig: {
                    collegeName: "K. S. Institute of Technology",
                    headerDepartment: `DEPARTMENT OF ${dept}`,
                    certificateTitle: random(TITLES),
                    eventType: type,
                    customSignatureText: "Head of Department"
                }
            });
            events.push(event);
        }

        // --- 4. ISSUE CERTIFICATES (For Past Events) ---
        console.log("📜 Minting Certificates (Database Only)...");
        const pastEvents = events.filter(e => e.certificatesIssued);
        let certCount = 0;

        for (const event of pastEvents) {
            // Pick 5-20 random students per event
            const attendees = students
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.floor(Math.random() * 15) + 5);

            for (const student of attendees) {
                // Only issue if student matches dept OR event is public
                if (event.isPublic || student.department === event.department) {
                    const certId = `CERT-${nanoid(10)}`;
                    // Simulate TX Hash (Since we aren't running local blockchain for seeding)
                    const txHash = "0x" + nanoid(64); 

                    await Certificate.create({
                        certificateId: certId,
                        tokenId: Math.floor(Math.random() * 10000),
                        certificateHash: txHash, // Using fake hash for seed
                        transactionHash: txHash,
                        studentName: student.name,
                        studentEmail: student.email,
                        eventName: event.name,
                        eventDate: event.date,
                        issuedBy: creatorId,
                        verificationUrl: `/verify/${certId}`,
                        scanCount: Math.floor(Math.random() * 10), // Simulate verification scans
                        // Override timestamps to match event date for Analytics trends
                        createdAt: event.date, 
                        updatedAt: event.date
                    });
                    certCount++;
                }
            }
        }

        // --- 5. CREATE QUIZZES ---
        console.log("🧠 Seeding Quizzes...");
        for (const topic of QUIZ_TOPICS) {
            const dept = random(DEPARTMENTS);
            await Quiz.create({
                topic: topic,
                description: `Test your knowledge in ${topic}. Pass this to earn a skill credential.`,
                totalQuestions: 10,
                passingScore: 60,
                createdBy: creatorId,
                department: dept,
                isActive: true
            });
            
            // Create Shadow Event for the Quiz Cert
            await Event.create({
                name: `Certified: ${topic}`,
                date: new Date(),
                description: `Skill Assessment for ${topic}`,
                createdBy: creatorId,
                department: dept,
                isPublic: false,
                certificatesIssued: true,
                certificateConfig: {
                    collegeName: "K. S. Institute of Technology",
                    headerDepartment: `DEPARTMENT OF ${dept}`,
                    certificateTitle: "CERTIFICATE OF SKILL",
                    eventType: "Skill Assessment",
                    customSignatureText: "Examination Authority"
                }
            });
        }

        // --- 6. CREATE SYSTEM LOGS ---
        console.log("📝 Generating Audit Logs...");
        const actions = ["CERTIFICATE_ISSUED", "EVENT_CREATED", "BULK_ISSUE", "USER_ACTIVATED"];
        for (let i = 0; i < 20; i++) {
            await SystemLog.create({
                action: random(actions),
                description: `System action #${i} performed automatically.`,
                adminName: "System Seeder",
                timestamp: randomDate(lastYear, today)
            });
        }

        console.log(`\n✅ SEEDING COMPLETE!`);
        console.log(`   - Students: 50`);
        console.log(`   - Events: 15`);
        console.log(`   - Certificates: ${certCount}`);
        console.log(`   - Quizzes: ${QUIZ_TOPICS.length}`);
        console.log(`   - Logs: 20`);
        console.log(`\n👉 Run 'node index.js' and check your Admin Analytics Dashboard!`);

    } catch (error) {
        console.error("❌ Seeding Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

seedDatabase();
