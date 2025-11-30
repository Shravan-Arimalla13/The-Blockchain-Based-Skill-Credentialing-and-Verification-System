// In server/controllers/admin.controller.js
const User = require('../models/user.model');
const StudentRoster = require('../models/studentRoster.model');
const jwt = require('jsonwebtoken');
const { sendFacultyInvite } = require('../utils/mailer'); // Our mailman!
const csv = require('csv-parser'); // <-- IMPORT
const stream = require('stream');
const Event = require('../models/event.model');           // <-- ADD THIS
const Certificate = require('../models/certificate.model'); // <-- ADD THIS
// ... (keep other imports like jwt, mailer, etc.)


exports.inviteFaculty = async (req, res) => {
    const { name, email, department } = req.body;

    try {
        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        // 2. Create the invite token
        // This token contains all the info we need to create the account later
        const inviteToken = jwt.sign(
            { name, email: email.toLowerCase(), department, role: 'Faculty' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Invite is good for 1 day
        );

        // 3. Send the email
        await sendFacultyInvite(email, inviteToken);

        res.status(200).json({ message: `Invite sent successfully to ${email}.` });

    } catch (error) {
        console.error(error);
        if (error.message === 'Email sending failed') {
            return res.status(500).json({ message: 'Admin action failed: Could not send email.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};



// In server/controllers/admin.controller.js
// ... (keep other imports)

// --- UPDATED FUNCTION: Import Student Roster ---
exports.importStudentRoster = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const results = [];
    let successCount = 0;
    let skippedCount = 0;
    const errors = [];

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv({ 
            mapHeaders: ({ header }) => header.trim().toLowerCase() 
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            for (const [index, row] of results.entries()) {
                // 1. Get 'semester' from the row
                const { name, email, usn, department, year, semester } = row;

                // 2. Basic validation (added semester)
                if (!name || !email || !usn || !department || !year || !semester) {
                    errors.push(`Row ${index + 2}: Missing required fields (name, email, usn, department, year, semester).`);
                    skippedCount++;
                    continue;
                }

                try {
                    const emailLower = email.toLowerCase();
                    const usnLower = usn.toLowerCase();

                    // 3. Check if user already exists
                    const existingUser = await User.findOne({ $or: [{ email: emailLower }, { usn: usnLower }] });
                    const existingRoster = await StudentRoster.findOne({ $or: [{ email: emailLower }, { usn: usnLower }] });

                    if (existingUser || existingRoster) {
                        skippedCount++;
                        continue; 
                    }

                    // 4. Add to roster (added semester)
                    const newRosterEntry = new StudentRoster({
                        name,
                        email: emailLower,
                        usn: usnLower,
                        department,
                        year: parseInt(year),
                        semester // <-- ADDED HERE
                    });
                    await newRosterEntry.save();
                    successCount++;

                } catch (error) {
                    errors.push(`Row ${index + 2} (Email: ${email}): ${error.message}`);
                    skippedCount++;
                }
            }

            // 5. Send final report
            res.status(200).json({
                message: `Roster import complete. Added ${successCount} new students. Skipped ${skippedCount} duplicates or invalid rows.`,
                errors: errors
            });
        })
        .on('error', (error) => {
            res.status(500).json({ message: 'Error parsing CSV file', errors: [error.message] });
        });
};


// In server/controllers/admin.controller.js

// --- UPDATED: Analytics Data Endpoint ---
exports.getAnalytics = async (req, res) => {
    try {
        // 1. Get simple counts
        const totalStudents = await User.countDocuments({ role: 'Student' });
        const totalEvents = await Event.countDocuments();
        const totalCerts = await Certificate.countDocuments();

        // 2. Get certificates by department (Pie Chart data)
        const certsByDept = await Certificate.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'studentEmail',
                    foreignField: 'email',
                    as: 'student'
                }
            },
            { $unwind: '$student' },
            {
                $group: {
                    _id: '$student.department',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // --- NEW: Get students by department (Bar Chart data) ---
        const studentsByDept = await User.aggregate([
            { $match: { role: 'Student' } }, // Only find students
            {
                $group: {
                    _id: '$department', // Group by their department
                    count: { $sum: 1 }   // Count them
                }
            },
            {
                $project: {
                    name: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { count: -1 } } // Sort descending
        ]);
        
        // --------------------------------------------------------

        res.status(200).json({
            totalStudents,
            totalEvents,
            totalCerts,
            certsByDept,
            studentsByDept // <-- Send the new data
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Server Error getting analytics' });
    }
};