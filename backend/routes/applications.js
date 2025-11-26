/**
 * Application Routes
 */

const express = require('express');
const router = express.Router();
const {
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    withdrawApplication,
    getApplicationStats
} = require('../controllers/applicationController');
const {
    validateApplication,
    validateId,
    validatePagination
} = require('../middleware/validation');
const {
    authenticateToken,
    authorizeRole
} = require('../middleware/auth');

// Job seeker routes
router.post('/', authenticateToken, authorizeRole('job-seeker'), validateApplication, applyForJob);
router.get('/my-applications', authenticateToken, authorizeRole('job-seeker'), validatePagination, getMyApplications);
router.delete('/:id', authenticateToken, authorizeRole('job-seeker'), validateId('id'), withdrawApplication);

// Employer routes
router.get('/job/:jobId', authenticateToken, authorizeRole('employer'), validateId('jobId'), validatePagination, getJobApplications);
router.put('/:id/status', authenticateToken, authorizeRole('employer'), validateId('id'), updateApplicationStatus);

// Common routes
router.get('/stats', authenticateToken, getApplicationStats);

module.exports = router;
