/**
 * Notification Controller
 * Handles user notifications
 */

const { promisePool } = require('../config/db');

/**
 * Get user notifications
 */
const getNotifications = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const { page = 1, limit = 20, isRead } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM notifications WHERE recipientID = ?';
        const params = [userID];

        if (isRead !== undefined) {
            query += ' AND isRead = ?';
            params.push(isRead === 'true');
        }

        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await promisePool.query(countQuery, params);
        const total = countResult[0].total;

        // Add pagination
        query += ' ORDER BY sentDate DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [notifications] = await promisePool.query(query, params);

        res.json({
            success: true,
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const { id } = req.params;

        // Verify ownership
        const [notifications] = await promisePool.query(
            'SELECT notificationID FROM notifications WHERE notificationID = ? AND recipientID = ?',
            [id, userID]
        );

        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await promisePool.query(
            'UPDATE notifications SET isRead = TRUE WHERE notificationID = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
    try {
        const userID = req.user.userID;

        await promisePool.query(
            'UPDATE notifications SET isRead = TRUE WHERE recipientID = ? AND isRead = FALSE',
            [userID]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const { id } = req.params;

        // Verify ownership
        const [notifications] = await promisePool.query(
            'SELECT notificationID FROM notifications WHERE notificationID = ? AND recipientID = ?',
            [id, userID]
        );

        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await promisePool.query(
            'DELETE FROM notifications WHERE notificationID = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get unread count
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const userID = req.user.userID;

        const [result] = await promisePool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE recipientID = ? AND isRead = FALSE',
            [userID]
        );

        res.json({
            success: true,
            count: result[0].count
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
};
