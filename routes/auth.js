const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const USERS_CSV = path.join(__dirname, '..', 'users.csv');

// Helper: Generate unique MED ID
function generateMedId() {
    return 'MED' + Math.floor(100000 + Math.random() * 900000);
}

// Helper: Read users.csv and parse
function readUsers() {
    if (!fs.existsSync(USERS_CSV)) return [];
    const data = fs.readFileSync(USERS_CSV, 'utf8').trim();
    if (!data) return [];
    return data.split('\n').map(line => {
        const [id, name, email, password, role] = line.split(',');
        return { id, name, email, password, role };
    });
}

// Registration route
router.post('/register', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields required.' });
    }
    const users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: 'Email already registered.' });
    }
    let newId;
    do {
        newId = generateMedId();
    } while (users.find(u => u.id === newId));
    const newUser = [newId, name, email, password, role].join(',');
    fs.appendFileSync(USERS_CSV, (users.length ? '\n' : '') + newUser);
    res.json({ message: 'Registration successful.', id: newId });
});

// Login route
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    
    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
    res.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
    });
});

module.exports = router;
