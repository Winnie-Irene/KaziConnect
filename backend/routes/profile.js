/**
 * Profile Routes
 */

const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getPublicProfile
} = require('../controllers/profileController');
const {
    validateProfileUpdate,
    validateId
} = require('../middleware/validation');
const {
    authenticateToken,
    optionalAuth
} = require('../middleware/auth');

// Protected routes
router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, validateProfileUpdate, updateProfile);

// Public routes
router.get('/:id', optionalAuth, validateId('id'), getPublicProfile);

module.exports = router;
