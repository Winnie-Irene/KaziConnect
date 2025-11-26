/**
 * Job Routes
 */

const express = require('express');
const router = express.Router();
const {
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getJobStats
} = require('../controllers/jobController');
const {
    validateJobPosting,
    validateId,
    validatePagination
} = require('../middleware/validation');
const {
    authenticateToken,
    authorizeRole,
    optionalAuth
} = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, validatePagination, getJobs);
router.get('/:id', optionalAuth, validateId('id'), getJobById);

// Protected routes - Employer only
router.post('/', authenticateToken, authorizeRole('employer'), validateJobPosting, createJob);
router.put('/:id', authenticateToken, authorizeRole('employer'), validateId('id'), updateJob);
router.delete('/:id', authenticateToken, authorizeRole('employer'), validateId('id'), deleteJob);
router.get('/stats/my-stats', authenticateToken, authorizeRole('employer'), getJobStats);

module.exports = router;
