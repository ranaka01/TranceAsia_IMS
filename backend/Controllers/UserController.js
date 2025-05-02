const User = require('../Models/UserModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
    try {
        const { Username, Email, Phone, Password, Role } = req.body;

        const allowedRoles = ['Admin', 'Technician', 'Cashier'];
        if (!allowedRoles.includes(Role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        const existingUser = await User.findByEmail(Email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User(Username, Email, Phone, Password, Role);
        await newUser.save();

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.User_ID, role: user.Role, email: user.Email },
            process.env.JWT_SECRET,
            { expiresIn: '10h' }
        );

        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { registerUser, loginUser };
