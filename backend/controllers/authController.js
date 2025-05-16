const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../utils/tokenGenerator');
const User = require('../models/users');

const signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        const token = generateToken({ id: newUser._id }, process.env.JWT_SECRET, '1h');
        res.cookie('token', token, { 
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 3600000
        });

        res.status(201).json({ 
            message: 'User created successfully',
            token: token,
            userId: newUser._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ id: user._id }, process.env.JWT_SECRET, '1h');

        res.cookie('token', token, { 
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 3600000
        });
        
        res.status(200).json({ 
            message: 'Login successful',
            token: token,
            userId: user._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
};

module.exports = { signup, login, logout };