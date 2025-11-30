// In server/utils/mailer.js
const nodemailer = require('nodemailer');

// 1. Create the "transporter" (the mail truck)
// We're using Gmail, but this could be SendGrid, etc.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
    },
});

// 2. A function to send the faculty invite email
exports.sendFacultyInvite = async (email, token) => {
    // This is the link the faculty will click
    // We'll build this page in the next step.
    const inviteLink = `http://localhost:5173/claim-invite/${token}`;

    const mailOptions = {
        from: `"Project Credentialing" <${process.env.EMAIL_HOST_USER}>`,
        to: email,
        subject: 'You have been invited to join Project Credentialing',
        html: `
            <h1>Welcome!</h1>
            <p>You have been invited to join the platform as a Faculty (Department Admin).</p>
            <p>Please click the link below to set up your account. This link is valid for 24 hours.</p>
            <a href="${inviteLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                Click Here to Activate Your Account
            </a>
            <p>If you did not request this, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Invite email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email sending failed');
    }
};



// In server/utils/mailer.js
// ... (keep the transporter and sendFacultyInvite)

// --- NEW FUNCTION ---
exports.sendStudentActivation = async (email, token) => {
    // This is the link the student will click
    const activationLink = `http://localhost:5173/activate-account/${token}`;

    const mailOptions = {
        from: `"Project Credentialing" <${process.env.EMAIL_HOST_USER}>`,
        to: email,
        subject: 'Activate Your Project Credentialing Account',
        html: `
            <h1>Welcome, Student!</h1>
            <p>Your account is ready to be activated. Please click the link below to set your password.</p>
            <p>This link is valid for 24 hours.</p>
            <a href="${activationLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                Click Here to Set Your Password
            </a>
            <p>If you did not request this, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Student activation email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email sending failed');
    }
};





// --- NEW FUNCTION: Send Certificate Notification ---
exports.sendCertificateIssued = async (email, studentName, eventName, certificateId) => {
    // Link to the public verification page
    const verifyLink = `https://my-project.vercel.app/verify/${certificateId}`; // We will update this domain later
    // For local testing use:
    const localLink = `http://localhost:5173/verify/${certificateId}`;

    const mailOptions = {
        from: `"CredentialChain System" <${process.env.EMAIL_HOST_USER}>`,
        to: email,
        subject: `Start Your Career: New Certificate Earned for ${eventName}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2563eb;">Congratulations, ${studentName}!</h2>
                <p>You have successfully earned a new verifiable credential for <strong>${eventName}</strong>.</p>
                
                <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">Certificate ID:</p>
                    <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 16px;">${certificateId}</p>
                </div>

                <p>This certificate has been secured on the blockchain as a permanent NFT.</p>

                <a href="${localLink}" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View & Verify Certificate
                </a>

                <p style="margin-top: 20px; font-size: 12px; color: #888;">
                    You can also view this in your Student Dashboard or your Web3 Wallet.
                </p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Certificate email sent to: ${email}`);
    } catch (error) {
        console.error('Error sending certificate email:', error);
        // We don't throw an error here because we don't want to crash the whole issuing process just because an email failed.
    }
};



// --- NEW: Send Password Reset Link ---
exports.sendPasswordReset = async (email, token) => {
    const resetLink = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
        from: `"CredentialChain Security" <${process.env.EMAIL_HOST_USER}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
            <h3>Password Reset Request</h3>
            <p>You requested a password reset for your CredentialChain account.</p>
            <p>Click the link below to set a new password. This link expires in 15 minutes.</p>
            <a href="${resetLink}" style="padding: 10px 15px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">
                Reset Password
            </a>
            <p>If you did not request this, please ignore this email.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset email sent to:', email);
    } catch (error) {
        console.error('Error sending reset email:', error);
    }
};