/**
 * Application Controller
 * Handles job application operations
 */

const { promisePool } = require('../config/db');

/**
 * Submit job application
 */
const applyForJob = async (req, res, next) => {
    const connection = await promisePool.getConnection();

    try {
        await connection.beginTransaction();

        const userID = req.user.userID;
        const { jobID, coverLetter } = req.body;

        // Get seeker ID
        const [seekers] = await connection.query(
            'SELECT seekerID FROM job_seekers WHERE userID = ?',
            [userID]
        );

        if (seekers.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Job seeker profile not found'
            });
        }

        const seekerID = seekers[0].seekerID;

        // Check if job exists and is active
        const [jobs] = await connection.query(
            'SELECT jobID, isActive FROM job_postings WHERE jobID = ?',
            [jobID]
        );

        if (jobs.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (!jobs[0].isActive) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Job is no longer accepting applications'
            });
        }

        // Check if already applied
        const [existing] = await connection.query(
            'SELECT applicationID FROM applications WHERE seekerID = ? AND jobID = ?',
            [seekerID, jobID]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }

        // Create application
        const [result] = await connection.query(
            'INSERT INTO applications (seekerID, jobID, coverLetter, status) VALUES (?, ?, ?, ?)',
            [seekerID, jobID, coverLetter || null, 'pending']
        );

        // Increment applications count
        await connection.query(
            'UPDATE job_postings SET applicationsCount = applicationsCount + 1 WHERE jobID = ?',
            [jobID]
        );

        await connection.commit();

        const [application] = await connection.query(
            'SELECT * FROM applications WHERE applicationID = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: application[0]
        });

    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Get my applications (Job Seeker)
 */
const getMyApplications = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const { status, page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        // Get seeker ID
        const [seekers] = await promisePool.query(
            'SELECT seekerID FROM job_seekers WHERE userID = ?',
            [userID]
        );

        if (seekers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job seeker profile not found'
            });
        }

        const seekerID = seekers[0].seekerID;

        let query = `
            SELECT
                a.*,
                j.jobTitle,
                j.location,
                j.salary,
                j.jobType,
                e.companyName,
                e.logo
            FROM applications a
            INNER JOIN job_postings j ON a.jobID = j.jobID
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE a.seekerID = ?
        `;

        const params = [seekerID];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        // Get total count
        const countQuery = query.replace('SELECT a.*, j.jobTitle, j.location, j.salary, j.jobType, e.companyName, e.logo', 'SELECT COUNT(*) as total');
        const [countResult] = await promisePool.query(countQuery, params);
        const total = countResult[0].total;

        // Add pagination
        query += ' ORDER BY a.applicationDate DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [applications] = await promisePool.query(query, params);

        res.json({
            success: true,
            applications,
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
 * Get applications for a job (Employer)
 */
const getJobApplications = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const { jobId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        // Verify job ownership
        const [jobs] = await promisePool.query(`
            SELECT j.jobID
            FROM job_postings j
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE j.jobID = ? AND e.userID = ?
        `, [jobId, userID]);

        if (jobs.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these applications'
            });
        }

        let query = `
            SELECT
                a.*,
                s.fullName,
                s.phoneNumber,
                s.location,
                s.skills,
                s.education,
                s.experience,
                s.resumePath,
                s.profilePicture
            FROM applications a
            INNER JOIN job_seekers s ON a.seekerID = s.seekerID
            WHERE a.jobID = ?
        `;

        const params = [jobId];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        // Get total count
        const countQuery = query.replace('SELECT a.*, s.fullName, s.phoneNumber, s.location, s.skills, s.education, s.experience, s.resumePath, s.profilePicture', 'SELECT COUNT(*) as total');
        const [countResult] = await promisePool.query(countQuery, params);
        const total = countResult[0].total;

        // Add pagination
        query += ' ORDER BY a.applicationDate DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [applications] = await promisePool.query(query, params);

        res.json({
            success: true,
            applications,
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
 * Update application status (Employer)
 */
const updateApplicationStatus = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const { id } = req.params;
        const { status, notes } = req.body;

        // Verify application ownership through job posting
        const [applications] = await promisePool.query(`
            SELECT a.applicationID
            FROM applications a
            INNER JOIN job_postings j ON a.jobID = j.jobID
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE a.applicationID = ? AND e.userID = ?
        `, [id, userID]);

        if (applications.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this application'
            });
        }

        await promisePool.query(`
            UPDATE applications SET
                status = ?,
                notes = COALESCE(?, notes),
                reviewedDate = NOW(),
                reviewedBy = ?
            WHERE applicationID = ?
        `, [status, notes, userID, id]);

        const [updated] = await promisePool.query(
            'SELECT * FROM applications WHERE applicationID = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Application status updated',
            application: updated[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Withdraw application (Job Seeker)
 */
const withdrawApplication = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const { id } = req.params;

        // Get seeker ID
        const [seekers] = await promisePool.query(
            'SELECT seekerID FROM job_seekers WHERE userID = ?',
            [userID]
        );

        if (seekers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job seeker profile not found'
            });
        }

        const seekerID = seekers[0].seekerID;

        // Verify ownership
        const [applications] = await promisePool.query(
            'SELECT applicationID FROM applications WHERE applicationID = ? AND seekerID = ?',
            [id, seekerID]
        );

        if (applications.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Application not found or not authorized'
            });
        }

        await promisePool.query(
            'DELETE FROM applications WHERE applicationID = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Application withdrawn successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get application statistics
 */
const getApplicationStats = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const role = req.user.role;

        let stats = {};

        if (role === 'job-seeker') {
            const [seekers] = await promisePool.query(
                'SELECT seekerID FROM job_seekers WHERE userID = ?',
                [userID]
            );

            if (seekers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Job seeker profile not found'
                });
            }

            const [result] = await promisePool.query(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                    SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
                    SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interview,
                    SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM applications
                WHERE seekerID = ?
            `, [seekers[0].seekerID]);

            stats = result[0];

        } else if (role === 'employer') {
            const [employers] = await promisePool.query(
                'SELECT employerID FROM employers WHERE userID = ?',
                [userID]
            );

            if (employers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Employer profile not found'
                });
            }

            const [result] = await promisePool.query(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN a.status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
                    SUM(CASE WHEN a.status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
                    SUM(CASE WHEN a.status = 'interview' THEN 1 ELSE 0 END) as interview,
                    SUM(CASE WHEN a.status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                    SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM applications a
                INNER JOIN job_postings j ON a.jobID = j.jobID
                WHERE j.employerID = ?
            `, [employers[0].employerID]);

            stats = result[0];
        }

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    withdrawApplication,
    getApplicationStats
};
