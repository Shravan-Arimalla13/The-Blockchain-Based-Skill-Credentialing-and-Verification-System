// In server/utils/certificateGenerator.js
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const createBuffer = (base64Str) => {
    if (!base64Str || typeof base64Str !== 'string') return null;
    const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
    try { return Buffer.from(base64Data, 'base64'); } 
    catch (e) { return null; }
};

exports.generateCertificatePDF = async (certificate, res) => {
    console.log(`Generating Professional PDF for: ${certificate.studentName}`);

    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${certificate.studentName}-Certificate.pdf`);
    doc.pipe(res);

    const W = 841.89;
    const H = 595.28;
    const CX = W / 2;

    // Extract Config
    const config = certificate.config || {};
    const collegeName = config.collegeName || 'K. S. Institute of Technology';
    const address = config.collegeAddress || "No.14, Raghuvanahalli, Kanakapura Road, Bengaluru - 560109\nAffiliated to VTU, Belagavi & Approved by AICTE, New Delhi, Accredited by NBA ( CSE, ECE ) , NAAC A+";
    const deptHeader = config.headerDepartment || 'DEPARTMENT OF MASTER OF COMPUTER APPLICATIONS (MCA)';
    const certTitle = config.certificateTitle || 'CERTIFICATE OF PARTICIPATION';
    const eventType = config.eventType || 'Workshop';
    const duration = config.eventDuration ? `${config.eventDuration} ` : ''; // Add space if exists
    const signText = config.customSignatureText || 'Authorized Signature';

    // Student Details (Fallbacks provided if user model update is pending)
    const studentBranch = certificate.studentDepartment || 'MCA'; 
    const studentSem = certificate.studentSemester || '1st'; 

    // Images
    const logoBuffer = createBuffer(config.collegeLogo);
    const signatureBuffer = createBuffer(config.signatureImage);

    // --- 1. BORDERS ---
    doc.rect(0, 0, W, H).fill('#ffffff');
    
    // Classic Double Border
    doc.lineWidth(15).strokeColor('#1e3a8a'); // Dark Blue
    doc.rect(20, 20, W - 40, H - 40).stroke();
    
    doc.lineWidth(1).strokeColor('#fbbf24'); // Gold
    doc.rect(32, 32, W - 64, H - 64).stroke();

    // --- 2. HEADER BLOCK ---
    let yPos = 60;

    // Logo (Left Aligned or Centered Top)
    // Let's keep it centered top for a clean academic look, pushing text down
    if (logoBuffer) {
        try {
            doc.image(logoBuffer, CX - 40, yPos, { width: 80 });
            yPos += 90; 
        } catch (e) {}
    }

    // College Name
    doc.font('Helvetica-Bold').fontSize(26).fillColor('#1e3a8a')
       .text(collegeName.toUpperCase(), 0, yPos, { align: 'center', width: W });
    yPos += 35;

    // Address Line (Small, gray, wrapped)
    doc.font('Helvetica').fontSize(9).fillColor('#475569')
       .text(address, 60, yPos, { align: 'center', width: W - 120 });
    yPos += 30; // Adjust based on address length

    // Department Header
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000')
       .text(deptHeader, 0, yPos, { align: 'center', width: W });
    yPos += 40;

    // Certificate Title (The Big Title)
    doc.font('Helvetica-Bold').fontSize(32).fillColor('#b45309') // Dark Gold/Bronze color
       .text(certTitle, 0, yPos, { align: 'center', characterSpacing: 2 });
    yPos += 60;

    // --- 3. BODY TEXT ---
    // Template: "This is to Certify that Mr/Ms {name} of {sem} semester {branch} has attended the {days} {event} on {date}"
    
    const dateStr = new Date(certificate.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    doc.font('Times-Roman').fontSize(18).fillColor('#0f172a').text('This is to Certify that Mr/Ms', 0, yPos, { align: 'center' });
    yPos += 30;

    // Student Name (Highlighted)
    doc.font('Times-BoldItalic').fontSize(36).fillColor('#1e40af')
       .text(certificate.studentName, 0, yPos, { align: 'center' });
    // Underline
    const nameW = doc.widthOfString(certificate.studentName);
    doc.lineWidth(1).strokeColor('#1e40af')
       .moveTo(CX - nameW/2 - 10, yPos + 32).lineTo(CX + nameW/2 + 10, yPos + 32).stroke();
    yPos += 45;

    // The Details Line
    const bodyText = `of ${studentSem} semester ${studentBranch} has attended the ${duration}${eventType}`;
    doc.font('Times-Roman').fontSize(18).fillColor('#0f172a').text(bodyText, 0, yPos, { align: 'center' });
    yPos += 30;

    // Event Name & Date
    doc.font('Helvetica-Bold').fontSize(22).text(certificate.eventName, 0, yPos, { align: 'center' });
    yPos += 30;
    doc.font('Times-Roman').fontSize(16).text(`on ${dateStr}`, 0, yPos, { align: 'center' });


    // --- 4. FOOTER ---
    
    // QR Code (Left)
    const footerY = H - 130;
    try {
        const qrUrl = await QRCode.toDataURL(`http://localhost:5173/verify/${certificate.certificateId}`);
        doc.image(qrUrl, 60, footerY, { width: 80 });
        doc.fontSize(9).font('Helvetica').text('Scan to Verify', 60, footerY + 85, { width: 80, align: 'center' });
    } catch (e) {}

    // Signature (Right)
    const sigX = W - 250;
    if (signatureBuffer) {
        try { doc.image(signatureBuffer, sigX + 20, footerY - 10, { width: 140 }); } catch (e) {}
    }
    doc.moveTo(sigX, footerY + 70).lineTo(sigX + 180, footerY + 70).lineWidth(1).strokeColor('black').stroke();
    doc.fontSize(12).text(signText, sigX, footerY + 80, { width: 180, align: 'center' });

    // --- ID ALIGNMENT FIX ---
    // Moved UP above the border
    doc.fontSize(10).fillColor('#94a3b8')
       .text(`Certificate ID: ${certificate.certificateId} | Generated by Blockchain Credentialing System`, 0, H - 55, { align: 'center', width: W });

    doc.end();
};