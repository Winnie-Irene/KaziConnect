/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} = require('../controllers/notificationController');
const {
    validateId,
    validatePagination
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', validatePagination, getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', validateId('id'), markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', validateId('id'), deleteNotification);

module.exports = router;
