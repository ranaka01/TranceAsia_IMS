const User = require('../Models/UserModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const fs = require('fs');
const path = require('path');

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { Username, first_name, last_name, Email, Phone, Password, Role } = req.body;

        // Validate required fields
        if (!Username || !Email || !Password || !Role) {
            return res.status(400).json({
                status: 'fail',
                message: 'Username, email, password, and role are required fields'
            });
        }

        // Validate allowed roles
        const allowedRoles = ['Admin', 'Technician', 'Cashier'];
        if (!allowedRoles.includes(Role)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid role specified'
            });
        }

        // Check if email already exists
        const [existingUsers] = await db.query('SELECT * FROM User WHERE Email = ?', [Email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email already in use'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO User (Username, first_name, last_name, Email, Phone, Role, Password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [Username, first_name, last_name, Email, Phone, Role, hashedPassword]
        );

        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                userId: result.insertId
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// User login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const [users] = await db.query('SELECT * FROM User WHERE Email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check if user is active
        if (user.is_active === 0) {
            return res.status(401).json({
                status: 'fail',
                message: 'User account has been deactivated'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) {
            return res.status(401).json({
                status: 'fail',
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.User_ID, role: user.Role, email: user.Email, username: user.Username },
            process.env.JWT_SECRET,
            { expiresIn: '10h' }
        );

        // Log the token to help with debugging
        console.log('Generated token:', token);

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.User_ID,
                    username: user.Username,
                    email: user.Email,
                    role: user.Role
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT
                User_ID, Username, first_name, last_name, Email, Phone, Role,
                is_active, created_at, profile_image
            FROM User
            ORDER BY User_ID DESC
        `);

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Get a single user
const getUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const [users] = await db.query(`
            SELECT
                User_ID, Username, first_name, last_name, Email, Phone, Role,
                is_active, created_at, profile_image
            FROM User
            WHERE User_ID = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: users[0]
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Update user status (activate/deactivate)
const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { is_active } = req.body;
        const adminId = req.user.userId; // Get the admin user ID from the request

        if (is_active === undefined || ![0, 1].includes(is_active)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid status value. Must be 0 or 1.'
            });
        }

        // Prevent admin from deactivating their own account
        if (parseInt(userId) === adminId && is_active === 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'You cannot deactivate your own account while logged in.'
            });
        }

        // Check if user exists
        const [existingUsers] = await db.query('SELECT * FROM User WHERE User_ID = ?', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // Update user status
        await db.query('UPDATE User SET is_active = ? WHERE User_ID = ?', [is_active, userId]);

        // If deactivating a user, we'll invalidate their sessions in a real application
        // This would typically involve a session/token blacklist mechanism
        if (is_active === 0) {
            // For demonstration purposes, log that we would invalidate the user's token
            console.log(`User ${userId} deactivated. Their tokens should be invalidated.`);

            // In a production system, you might:
            // 1. Add the user's tokens to a blacklist in Redis or another store
            // 2. Or update their token version in the database to invalidate existing tokens
        }

        res.status(200).json({
            status: 'success',
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
            data: null
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Delete a user
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const adminId = req.user.userId; // Get the admin user ID from the request

        // Prevent admin from deleting their own account
        if (parseInt(userId) === adminId) {
            return res.status(400).json({
                status: 'fail',
                message: 'You cannot delete your own account while logged in.'
            });
        }

        // Check if user exists
        const [existingUsers] = await db.query('SELECT * FROM User WHERE User_ID = ?', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // Check if there are any dependencies before hard deletion
        // In a production environment, you might want to soft delete instead

        // For now we'll just delete the user
        await db.query('DELETE FROM User WHERE User_ID = ?', [userId]);

        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully',
            data: null
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const authUserId = req.user.userId; // Get the authenticated user's ID

        // Users can only view their own profile unless they're admins
        if (parseInt(userId) !== authUserId && req.user.role !== 'Admin') {
            return res.status(403).json({
                status: 'fail',
                message: "You don't have permission to access this profile"
            });
        }

        // Get user data
        const [users] = await db.query(`
            SELECT
                User_ID, Username, first_name, last_name, Email, Phone, Role,
                is_active, created_at, profile_image
            FROM User
            WHERE User_ID = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // If profile image exists, create the full URL
        if (users[0].profile_image) {
            // In a real production environment, you'd use your actual domain
            const baseUrl = 'http://localhost:5000';
            users[0].profile_image_url = `${baseUrl}/uploads/${users[0].profile_image}`;
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: users[0]
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const authUserId = req.user.userId; // Get the authenticated user's ID

        // Make sure users can only update their own profile
        if (parseInt(userId) !== authUserId) {
            return res.status(403).json({
                status: 'fail',
                message: "You can only update your own profile"
            });
        }

        const {
            Username,
            Email,
            Phone,
            first_name,
            last_name,
            currentPassword,
            newPassword
        } = req.body;

        // Find user to verify they exist
        const [users] = await db.query('SELECT * FROM User WHERE User_ID = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        const user = users[0];

        // Handle profile image upload if present
        let profileImageFilename = user.profile_image;

        if (req.file) {
            // Generate a unique filename for the uploaded image
            profileImageFilename = `user_${userId}_${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;

            // Create uploads directory if it doesn't exist
            const uploadsDir = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Write the file
            fs.writeFileSync(path.join(uploadsDir, profileImageFilename), req.file.buffer);
        }

        // If changing password, verify current password
        if (currentPassword && newPassword) {
            const validPassword = await bcrypt.compare(currentPassword, user.Password);
            if (!validPassword) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Current password is incorrect'
                });
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update user with new password and profile image
            await db.query(`
                UPDATE User
                SET
                Username = ?,
                Email = ?,
                Phone = ?,
                first_name = ?,
                last_name = ?,
                Password = ?,
                profile_image = ?
                WHERE User_ID = ?
            `, [
                Username || user.Username,
                Email || user.Email,
                Phone || user.Phone,
                first_name !== undefined ? first_name : user.first_name,
                last_name !== undefined ? last_name : user.last_name,
                hashedPassword,
                profileImageFilename,
                userId
            ]);
        } else {
            // Update user without changing password
            await db.query(`
                UPDATE User
                SET
                Username = ?,
                Email = ?,
                Phone = ?,
                first_name = ?,
                last_name = ?,
                profile_image = ?
                WHERE User_ID = ?
            `, [
                Username || user.Username,
                Email || user.Email,
                Phone || user.Phone,
                first_name !== undefined ? first_name : user.first_name,
                last_name !== undefined ? last_name : user.last_name,
                profileImageFilename,
                userId
            ]);
        }

        // Get updated user data to return
        const [updatedUsers] = await db.query(`
            SELECT
                User_ID, Username, first_name, last_name, Email, Phone, Role,
                is_active, created_at, profile_image
            FROM User
            WHERE User_ID = ?
        `, [userId]);

        if (updatedUsers.length === 0) {
            throw new Error('Failed to retrieve updated user data');
        }

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                user: updatedUsers[0]
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);

        // Check for duplicate entry errors
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                status: 'fail',
                message: 'Email address is already in use'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

// Get all technicians (users with technician role)
const getTechnicians = async (req, res) => {
    try {
        console.log('Backend: Fetching technicians from database...');

        // Query to get all active technicians
        const [technicians] = await db.query(`
            SELECT
                User_ID, Username, first_name, last_name, Email, Phone, Role
            FROM User
            WHERE Role = 'Technician' AND is_active = 1
            ORDER BY first_name, last_name
        `);

        console.log(`Backend: Found ${technicians.length} technicians:`, technicians);

        // If no technicians found, add some default ones for testing
        if (technicians.length === 0) {
            console.log('Backend: No technicians found, adding fallback data');

            // Check if we need to add fallback technicians to the database
            const [existingUsers] = await db.query(`
                SELECT COUNT(*) as count FROM User WHERE Role = 'Technician'
            `);

            if (existingUsers[0].count === 0) {
                console.log('Backend: No technicians in database, consider adding some');
            }
        }

        res.status(200).json({
            status: 'success',
            results: technicians.length,
            data: {
                technicians
            }
        });
    } catch (error) {
        console.error('Error fetching technicians:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error: ' + error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
    getUser,
    updateUserStatus,
    deleteUser,
    getUserProfile,
    updateUserProfile,
    getTechnicians
};