/**
 * Admin Controller
 * Handles admin operations
 */

const { promisePool } = require('../config/db');

/**
 * Get system statistics
 */
const getStats = async (req, res, next) => {
    try {
        const [stats] = await promisePool.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE isActive = TRUE) as totalUsers,
                (SELECT COUNT(*) FROM users WHERE role = 'job-seeker' AND isActive = TRUE) as jobSeekers,
                (SELECT COUNT(*) FROM employers WHERE isApproved = TRUE) as employers,
                (SELECT COUNT(*) FROM job_postings WHERE isActive = TRUE) as activeJobs,
                (SELECT COUNT(*) FROM applications) as totalApplications,
                (SELECT COUNT(*) FROM applications WHERE status = 'accepted') as successfulMatches,
                (SELECT COUNT(*) FROM employers WHERE isApproved = FALSE) as pendingEmployers,
                (SELECT COUNT(*) FROM disputes WHERE status = 'open') as pendingDisputes,
                0 as flaggedJobs,
                0 as trainers
        `);

        res.json({
            success: true,
            stats: stats[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get all users
 */
const getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, isActive, search } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT userID, username, email, role, isActive, emailVerified, registrationDate, lastLogin FROM users WHERE 1=1';
        const params = [];

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        if (isActive !== undefined) {
            query += ' AND isActive = ?';
            params.push(isActive === 'true');
        }

        if (search) {
            query += ' AND (username LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Get total count
        const countQuery = query.replace('SELECT userID, username, email, role, isActive, emailVerified, registrationDate, lastLogin', 'SELECT COUNT(*) as total');
        const [countResult] = await promisePool.query(countQuery, params);
        const total = countResult[0].total;

        // Add pagination
        query += ' ORDER BY registrationDate DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [users] = await promisePool.query(query, params);

        res.json({
            success: true,
            users,
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
 * Update user status (activate/deactivate)
 */
const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // true or false

        await promisePool.query(
            'UPDATE users SET isActive = ? WHERE userID = ?',
            [status, id]
        );

        res.json({
            success: true,
            message: `User ${status ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Delete user
 */
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if trying to delete own account
        if (parseInt(id) === req.user.userID) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await promisePool.query(
            'DELETE FROM users WHERE userID = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get pending employers
 */
const getPendingEmployers = async (req, res, next) => {
    try {
        const [employers] = await promisePool.query(`
            SELECT
                e.*,
                u.email,
                u.registrationDate
            FROM employers e
            INNER JOIN users u ON e.userID = u.userID
            WHERE e.isApproved = FALSE
            ORDER BY e.createdAt DESC
        `);

        res.json({
            success: true,
            employers
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Approve employer
 */
const approveEmployer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminID = req.user.userID;

        await promisePool.query(
            'UPDATE employers SET isApproved = TRUE, approvedBy = ?, approvedDate = NOW() WHERE employerID = ?',
            [adminID, id]
        );

        // Get employer userID for notification
        const [employers] = await promisePool.query(
            'SELECT userID FROM employers WHERE employerID = ?',
            [id]
        );

        if (employers.length > 0) {
            // Create notification
            await promisePool.query(
                `INSERT INTO notifications (recipientID, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [
                    employers[0].userID,
                    'Account Approved',
                    'Your employer account has been approved. You can now post jobs!',
                    'success'
                ]
            );
        }

        res.json({
            success: true,
            message: 'Employer approved successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Reject employer
 */
const rejectEmployer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get employer userID
        const [employers] = await promisePool.query(
            'SELECT userID FROM employers WHERE employerID = ?',
            [id]
        );

        if (employers.length > 0) {
            // Create notification
            await promisePool.query(
                `INSERT INTO notifications (recipientID, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [
                    employers[0].userID,
                    'Account Rejected',
                    `Your employer account application was not approved. Reason: ${reason || 'Please contact support for more information.'}`,
                    'error'
                ]
            );

            // Deactivate user account
            await promisePool.query(
                'UPDATE users SET isActive = FALSE WHERE userID = ?',
                [employers[0].userID]
            );
        }

        res.json({
            success: true,
            message: 'Employer rejected'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get all job postings (for moderation)
 */
const getAllJobs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isActive } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT
                j.*,
                e.companyName,
                e.isApproved as employerApproved,
                (SELECT COUNT(*) FROM applications WHERE jobID = j.jobID) as applicationsCount
            FROM job_postings j
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE 1=1
        `;

        const params = [];

        if (isActive !== undefined) {
            query += ' AND j.isActive = ?';
            params.push(isActive === 'true');
        }

        // Get total count
        const countQuery = query.replace('SELECT j.*, e.companyName, e.isApproved as employerApproved, (SELECT COUNT(*) FROM applications WHERE jobID = j.jobID) as applicationsCount', 'SELECT COUNT(*) as total');
        const [countResult] = await promisePool.query(countQuery, params);
        const total = countResult[0].total;

        // Add pagination
        query += ' ORDER BY j.postedDate DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [jobs] = await promisePool.query(query, params);

        res.json({
            success: true,
            jobs,
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
 * Deactivate job posting
 */
const deactivateJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        await promisePool.query(
            'UPDATE job_postings SET isActive = FALSE WHERE jobID = ?',
            [id]
        );

        // Notify employer
        const [jobs] = await promisePool.query(`
            SELECT e.userID, j.jobTitle
            FROM job_postings j
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE j.jobID = ?
        `, [id]);

        if (jobs.length > 0) {
            await promisePool.query(
                `INSERT INTO notifications (recipientID, title, message, type)
                 VALUES (?, ?, ?, ?)`,
                [
                    jobs[0].userID,
                    'Job Posting Deactivated',
                    `Your job posting "${jobs[0].jobTitle}" has been deactivated. ${reason ? 'Reason: ' + reason : ''}`,
                    'warning'
                ]
            );
        }

        res.json({
            success: true,
            message: 'Job deactivated successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get disputes
 */
const getDisputes = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT
                d.*,
                u.username,
                u.email
            FROM disputes d
            INNER JOIN users u ON d.userID = u.userID
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ' AND d.status = ?';
            params.push(status);
        }

        // Get total count
        const countQuery = query.replace('SELECT d.*, u.username, u.email', 'SELECT COUNT(*) as total');
        const [countResult] = await promisePool.query(countQuery, params);
        const total = countResult[0].total;

        // Add pagination
        query += ' ORDER BY d.filedDate DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [disputes] = await promisePool.query(query, params);

        res.json({
            success: true,
            disputes,
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
 * Resolve dispute
 */
const resolveDispute = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { resolution } = req.body;
        const adminID = req.user.userID;

        await promisePool.query(
            `UPDATE disputes SET
                status = 'resolved',
                resolution = ?,
                resolvedBy = ?,
                resolvedDate = NOW()
             WHERE disputeID = ?`,
            [resolution, adminID, id]
        );

        res.json({
            success: true,
            message: 'Dispute resolved successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};
