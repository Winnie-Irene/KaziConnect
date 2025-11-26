/**
 * Authentication Controller
 * Handles user registration, login, and password management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/db');

/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            userID: user.userID,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Register new user
 */
const register = async (req, res, next) => {
    const connection = await promisePool.getConnection();

    try {
        await connection.beginTransaction();

        const { email, password, role, fullName, companyName, phone, industry, location } = req.body;

        // Check if user already exists
        const [existingUsers] = await connection.query(
            'SELECT userID FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate username from email
        const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

        // Insert user
        const [userResult] = await connection.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );

        const userID = userResult.insertId;

        // Insert role-specific data
        if (role === 'job-seeker') {
            await connection.query(
                'INSERT INTO job_seekers (userID, fullName, phoneNumber, location) VALUES (?, ?, ?, ?)',
                [userID, fullName || username, phone || null, location || null]
            );
        } else if (role === 'employer') {
            await connection.query(
                'INSERT INTO employers (userID, companyName, phoneNumber, industry, location, isApproved) VALUES (?, ?, ?, ?, ?, FALSE)',
                [userID, companyName, phone || null, industry || null, location || null]
            );
        }

        await connection.commit();

        // Generate token
        const token = generateToken({ userID, email, role });

        // Fetch complete user data
        let userData = { userID, username, email, role };

        if (role === 'job-seeker') {
            const [seekers] = await connection.query(
                'SELECT * FROM job_seekers WHERE userID = ?',
                [userID]
            );
            userData = { ...userData, ...seekers[0] };
        } else if (role === 'employer') {
            const [employers] = await connection.query(
                'SELECT * FROM employers WHERE userID = ?',
                [userID]
            );
            userData = { ...userData, ...employers[0] };
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: userData
        });

    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await promisePool.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is disabled. Contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        await promisePool.query(
            'UPDATE users SET lastLogin = NOW() WHERE userID = ?',
            [user.userID]
        );

        // Fetch role-specific data
        let userData = {
            userID: user.userID,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified
        };

        if (user.role === 'job-seeker') {
            const [seekers] = await promisePool.query(
                'SELECT * FROM job_seekers WHERE userID = ?',
                [user.userID]
            );
            if (seekers.length > 0) {
                userData = { ...userData, ...seekers[0] };
            }
        } else if (user.role === 'employer') {
            const [employers] = await promisePool.query(
                'SELECT * FROM employers WHERE userID = ?',
                [user.userID]
            );
            if (employers.length > 0) {
                userData = { ...userData, ...employers[0] };
            }
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userData
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res, next) => {
    try {
        const userID = req.user.userID;

        const [users] = await promisePool.query(
            'SELECT userID, username, email, role, isActive, emailVerified FROM users WHERE userID = ?',
            [userID]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let userData = users[0];

        // Fetch role-specific data
        if (userData.role === 'job-seeker') {
            const [seekers] = await promisePool.query(
                'SELECT * FROM job_seekers WHERE userID = ?',
                [userID]
            );
            if (seekers.length > 0) {
                userData = { ...userData, ...seekers[0] };
            }
        } else if (userData.role === 'employer') {
            const [employers] = await promisePool.query(
                'SELECT * FROM employers WHERE userID = ?',
                [userID]
            );
            if (employers.length > 0) {
                userData = { ...userData, ...employers[0] };
            }
        }

        res.json({
            success: true,
            user: userData
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const { currentPassword, newPassword } = req.body;

        // Get current user
        const [users] = await promisePool.query(
            'SELECT password FROM users WHERE userID = ?',
            [userID]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, users[0].password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await promisePool.query(
            'UPDATE users SET password = ? WHERE userID = ?',
            [hashedPassword, userID]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    changePassword
};
