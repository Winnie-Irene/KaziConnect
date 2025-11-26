/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const {
    getStats,
    getUsers,
    updateUserStatus,
    deleteUser,
    getPendingEmployers,
    approveEmployer,
    rejectEmployer,
    getAllJobs,
    deactivateJob,
    getDisputes,
    resolveDispute
} = require('../controllers/adminController');
const {
    validateId,
    validatePagination
} = require('../middleware/validation');
const {
    authenticateToken,
    authorizeRole
} = require('../middleware/auth');

// All routes require admin role
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// System stats
router.get('/stats', getStats);

// User management
router.get('/users', validatePagination, getUsers);
router.put('/users/:id/status', validateId('id'), updateUserStatus);
router.delete('/users/:id', validateId('id'), deleteUser);

// Employer management
router.get('/employers/pending', getPendingEmployers);
router.put('/employers/:id/approve', validateId('id'), approveEmployer);
router.put('/employers/:id/reject', validateId('id'), rejectEmployer);

// Job moderation
router.get('/jobs', validatePagination, getAllJobs);
router.put('/jobs/:id/deactivate', validateId('id'), deactivateJob);

// Dispute management
router.get('/disputes', validatePagination, getDisputes);
router.put('/disputes/:id/resolve', validateId('id'), resolveDispute);

module.exports = router;
