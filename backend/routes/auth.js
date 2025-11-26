/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getCurrentUser,
    changePassword
} = require('../controllers/authController');
const {
    validateRegistration,
    validateLogin
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
