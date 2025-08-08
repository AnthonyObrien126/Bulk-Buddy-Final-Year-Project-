const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

console.log("Auth routes loaded");

// Simple test route
router.get('/test', (req, res) => {
    res.send('Auth route is working');
});

// Register new user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user already exists
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ error: 'User already exists' });

        // Create and save new user
        const user = new User({ email, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login existing user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('🛂 Login payload:', req.body);

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('No user found for email:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Stored hash:', user.password);
        console.log('Raw password:', password);

        // Compare password with hashed value
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token on successful login
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
