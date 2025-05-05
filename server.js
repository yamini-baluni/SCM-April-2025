const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static HTML files
app.use(express.static(path.join(__dirname, 'public')));

// Mount routes
app.use('/api', require('./routes/auth'));
app.use('/api/doctor', require('./routes/doctor'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

