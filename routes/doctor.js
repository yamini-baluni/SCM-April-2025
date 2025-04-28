const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const UPLOADS_CSV = path.join(__dirname, '..', 'uploads.csv');

// Ensure CSV file exists with proper headers
if (!fs.existsSync(UPLOADS_CSV)) {
    fs.writeFileSync(UPLOADS_CSV, 'patientId,doctorId,reportType,reportContent,timestamp\n');
}

// Helper: Append upload to CSV
function appendUpload(upload) {
    const line = [
        upload.patientId,
        upload.doctorId || 'default',
        upload.reportType,
        upload.reportContent.replace(/[\r\n,]/g, ' '),
        upload.timestamp
    ].join(',');
    fs.appendFileSync(UPLOADS_CSV, '\n' + line);
}

// Helper: Read uploads.csv and parse
function readUploads() {
    if (!fs.existsSync(UPLOADS_CSV)) return [];
    const data = fs.readFileSync(UPLOADS_CSV, 'utf8').trim();
    if (!data) return [];
    const lines = data.split('\n');
    // Skip header row
    return lines.slice(1).map(line => {
        const [patientId, doctorId, reportType, reportContent, timestamp] = line.split(',');
        return { patientId, doctorId, reportType, reportContent, timestamp };
    });
}

// Upload report
router.post('/upload', (req, res) => {
    try {
        const { patientId, reportType, reportContent } = req.body;
        
        if (!patientId || !reportType || !reportContent) {
            return res.status(400).json({ 
                success: false,
                message: 'Patient ID, Report Type and Content are required.' 
            });
        }
        
        const upload = {
            patientId,
            reportType,
            reportContent,
            timestamp: new Date().toISOString()
        };
        
        appendUpload(upload);
        res.json({ 
            success: true,
            message: 'Report uploaded successfully.' 
        });
    } catch (error) {
        console.error('Error uploading report:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error uploading report. Please try again.' 
        });
    }
});

// View reports for a patient
router.get('/reports/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        const uploads = readUploads().filter(u => u.patientId === patientId);
        
        res.json({
            success: true,
            data: uploads
        });
    } catch (error) {
        console.error('Error reading reports:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error retrieving reports. Please try again.' 
        });
    }
});

// Get all reports for statistics
router.get('/stats', (req, res) => {
    try {
        const uploads = readUploads();
        
        // Count reports by type
        const reportTypeCounts = {};
        uploads.forEach(upload => {
            reportTypeCounts[upload.reportType] = (reportTypeCounts[upload.reportType] || 0) + 1;
        });

        // Count reports by doctor
        const doctorReportCounts = {};
        uploads.forEach(upload => {
            doctorReportCounts[upload.doctorId] = (doctorReportCounts[upload.doctorId] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                totalReports: uploads.length,
                reportTypeCounts,
                doctorReportCounts
            }
        });
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error retrieving statistics. Please try again.' 
        });
    }
});

module.exports = router;

// Serve dashboard page
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

