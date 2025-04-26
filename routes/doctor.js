const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const UPLOADS_CSV = path.join(__dirname, '..', 'uploads.csv');

// Ensure CSV file exists
if (!fs.existsSync(UPLOADS_CSV)) {
    fs.writeFileSync(UPLOADS_CSV, 'patientId,doctorId,reportType,reportContent,timestamp\n');
}

// Authentication middleware
const authenticateDoctor = (req, res, next) => {
    const user = req.session.user;
    if (!user || user.role !== 'doctor') {
        return res.status(401).json({ message: 'Unauthorized. Please login as a doctor.' });
    }
    next();
};

// Apply authentication middleware to all doctor routes
router.use(authenticateDoctor);

// Helper: Append upload to CSV
function appendUpload(upload) {
    const line = [
        upload.patientId,
        upload.doctorId,
        upload.reportType,
        upload.reportContent.replace(/[\r\n,]/g, ' '),
        upload.timestamp
    ].join(',');
    const exists = fs.existsSync(UPLOADS_CSV);
    fs.appendFileSync(UPLOADS_CSV, (exists && fs.statSync(UPLOADS_CSV).size ? '\n' : '') + line);
}

// Helper: Read uploads.csv and parse
function readUploads() {
    if (!fs.existsSync(UPLOADS_CSV)) return [];
    const data = fs.readFileSync(UPLOADS_CSV, 'utf8').trim();
    if (!data) return [];
    return data.split('\n').map(line => {
        const [patientId, doctorId, reportType, reportContent, timestamp] = line.split(',');
        return { patientId, doctorId, reportType, reportContent, timestamp };
    });
}

// Upload report
router.post('/upload', (req, res) => {
    const { patientId, doctorId, reportType, reportContent } = req.body;
    if (!patientId || !doctorId || !reportType || !reportContent) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    
    try {
        const upload = {
            patientId,
            doctorId,
            reportType,
            reportContent,
            timestamp: new Date().toISOString()
        };
        appendUpload(upload);
        res.json({ message: 'Report uploaded successfully.' });
    } catch (error) {
        console.error('Error uploading report:', error);
        res.status(500).json({ message: 'Error uploading report. Please try again.' });
    }
});

// View reports for a patient
router.get('/reports/:patientId', (req, res) => {
    const { patientId } = req.params;
    try {
        const uploads = readUploads().filter(u => u.patientId === patientId);
        res.json(uploads);
    } catch (error) {
        console.error('Error reading reports:', error);
        res.status(500).json({ message: 'Error retrieving reports. Please try again.' });
    }
});

module.exports = router;
