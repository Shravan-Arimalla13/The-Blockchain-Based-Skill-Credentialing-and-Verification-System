// In server/controllers/certificate.controller.js
const Certificate = require('../models/certificate.model');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const { mintNFT, isHashValid, revokeByHash } = require('../utils/blockchain');
const { generateCertificatePDF } = require('../utils/certificateGenerator');
// --- IMPORT MAILER ---
const { sendCertificateIssued } = require('../utils/mailer'); 

// --- ISSUE SINGLE CERTIFICATE ---
exports.issueSingleCertificate = async (req, res) => {
    const { eventName, eventDate, studentName, studentEmail } = req.body;
    const issuerId = req.user.id;

    if (!eventName || !eventDate || !studentName || !studentEmail) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedEmail = studentEmail.toLowerCase();

    try {
        const student = await User.findOne({ email: normalizedEmail });
        if (!student) {
            return res.status(404).json({ message: 'Student account not found.' });
        }
        if (!student.walletAddress) {
            return res.status(400).json({ message: `Student (${student.name}) has not connected their wallet.` });
        }

        const existingCert = await Certificate.findOne({ eventName, studentEmail: normalizedEmail });
        if (existingCert) {
            return res.status(400).json({ message: 'Certificate already exists.' });
        }

        // 1. Create Hash
        const hashData = normalizedEmail + eventDate + eventName;
        const certificateHash = crypto.createHash('sha256').update(hashData).digest('hex');
        
        // 2. Mint NFT
        const { transactionHash, tokenId } = await mintNFT(student.walletAddress, certificateHash);

        // 3. Save to DB
        const certificateId = `CERT-${nanoid(10)}`;
        const newCert = new Certificate({
            certificateId,
            tokenId,
            certificateHash,
            transactionHash,
            studentName,
            studentEmail: normalizedEmail,
            eventName,
            eventDate,
            issuedBy: issuerId,
            verificationUrl: `/verify/${certificateId}`
        });

        await newCert.save();

        // 4. Send Email (Restored!)
        console.log("Sending email to:", normalizedEmail);
        await sendCertificateIssued(
            normalizedEmail, 
            studentName, 
            eventName, 
            certificateId
        );

        res.status(201).json({ message: 'NFT Issued & Email Sent ✅', certificate: newCert });

    } catch (error) {
        console.error('Error issuing single certificate:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// --- ISSUE EVENT CERTIFICATES ---
exports.issueEventCertificates = async (req, res) => {
    const eventId = req.params.eventId;
    const issuerId = req.user.id;
    let issuedCount = 0;
    let skippedCount = 0;
    const errors = [];

    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        
        for (const participant of event.participants) {
            const normalizedEmail = participant.email.toLowerCase();

            const student = await User.findOne({ email: normalizedEmail });
            if (!student || !student.walletAddress) {
                errors.push(`Skipped ${participant.name}: Wallet not connected.`);
                skippedCount++;
                continue;
            }

            const existingCert = await Certificate.findOne({ eventName: event.name, studentEmail: normalizedEmail });
            if (existingCert) {
                skippedCount++;
                continue;
            }

            const hashData = normalizedEmail + event.date + event.name;
            const certificateHash = crypto.createHash('sha256').update(hashData).digest('hex');

            try {
                // 1. Mint NFT
                const { transactionHash, tokenId } = await mintNFT(student.walletAddress, certificateHash);

                // 2. Save DB
                const certificateId = `CERT-${nanoid(10)}`;
                const newCert = new Certificate({
                    certificateId,
                    tokenId,
                    certificateHash,
                    transactionHash,
                    studentName: participant.name,
                    studentEmail: normalizedEmail,
                    eventName: event.name,
                    eventDate: event.date,
                    issuedBy: issuerId,
                    verificationUrl: `/verify/${certificateId}`
                });

                await newCert.save();

                // 3. Send Email (Restored!)
                sendCertificateIssued(
                    normalizedEmail, 
                    participant.name, 
                    event.name, 
                    certificateId
                );

                issuedCount++;
            } catch (mintError) {
                errors.push(`Failed ${participant.name}: ${mintError.message}`);
                skippedCount++;
            }
        }

        event.certificatesIssued = true;
        await event.save();
        
        res.status(201).json({ 
            message: `Successfully issued ${issuedCount} NFTs. Skipped ${skippedCount}.`,
            errors: errors
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- VERIFY CERTIFICATE ---
exports.verifyCertificate = async (req, res) => {
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    try {
        const { certId } = req.params;
        const safeCertId = escapeRegExp(certId);

        const certificate = await Certificate.findOne({ 
            certificateId: { $regex: new RegExp(`^${safeCertId}$`, 'i') } 
        }).populate('issuedBy', 'name');

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found or invalid.' });
        }

        const { exists, isRevoked } = await isHashValid(certificate.certificateHash);

        res.json({
            studentName: certificate.studentName,
            eventName: certificate.eventName,
            eventDate: certificate.eventDate,
            issuedBy: certificate.issuedBy.name,
            issuedOn: certificate.createdAt,
            certificateHash: certificate.certificateHash,
            transactionHash: certificate.transactionHash,
            certificateId: certificate.certificateId,
            isBlockchainVerified: exists,
            isRevoked: isRevoked
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- REVOKE CERTIFICATE ---
exports.revokeCertificate = async (req, res) => {
    const { certificateId } = req.body;
    try {
        const certificate = await Certificate.findOne({ certificateId: certificateId });
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found.' });
        }

        await revokeByHash(certificate.certificateHash);
        
        res.status(200).json({ message: 'Certificate successfully revoked on the blockchain.' });
    } catch (error) {
        console.error('Revocation failed:', error);
        res.status(500).json({ message: 'Server error during revocation.' });
    }
};

// --- GET MY CERTIFICATES ---
exports.getMyCertificates = async (req, res) => {
    try {
        const userEmail = req.user.email; 
        const certificates = await Certificate.find({ studentEmail: userEmail })
            .populate('issuedBy', 'name') 
            .sort({ eventDate: -1 });
        res.json(certificates);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- DOWNLOAD PDF ---
exports.downloadCertificate = async (req, res) => {
    try {
        const { certId } = req.params;
        const certificate = await Certificate.findOne({ certificateId: certId }).populate('issuedBy', 'name');
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

        const event = await Event.findOne({ name: certificate.eventName });
        const studentUser = await User.findOne({ email: certificate.studentEmail });

        const certData = {
            ...certificate.toObject(),
            config: event?.certificateConfig || {},
            studentDepartment: studentUser?.department || 'N/A',
            studentSemester: studentUser?.semester || '___' 
        };

        await generateCertificatePDF(certData, res); 
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).send('Server Error');
    }
};