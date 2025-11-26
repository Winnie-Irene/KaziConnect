/**
 * Job Controller
 * Handles job posting operations
 */

const { promisePool } = require('../config/db');

/**
 * Get all jobs with filters
 */
const getJobs = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            location,
            category,
            jobType,
            salaryMin,
            salaryMax,
            employerId
        } = req.query;

        const offset = (page - 1) * limit;
        let query = `
            SELECT
                j.*,
                e.companyName,
                e.logo,
                e.location as companyLocation,
                (SELECT COUNT(*) FROM applications WHERE jobID = j.jobID) as applicationsCount
            FROM job_postings j
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE j.isActive = TRUE
        `;

        const params = [];

        // Apply filters
        if (search) {
            query += ' AND (j.jobTitle LIKE ? OR j.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (location) {
            query += ' AND j.location LIKE ?';
            params.push(`%${location}%`);
        }

        if (category) {
            query += ' AND j.category = ?';
            params.push(category);
        }

        if (jobType) {
            query += ' AND j.jobType = ?';
            params.push(jobType);
        }

        if (salaryMin) {
            query += ' AND j.salary >= ?';
            params.push(salaryMin);
        }

        if (salaryMax) {
            query += ' AND j.salary <= ?';
            params.push(salaryMax);
        }

        if (employerId) {
            query += ' AND j.employerID = ?';
            params.push(employerId);
        }

        // Get total count
        const countQuery = query.replace('SELECT j.*, e.companyName, e.logo, e.location as companyLocation, (SELECT COUNT(*) FROM applications WHERE jobID = j.jobID) as applicationsCount', 'SELECT COUNT(*) as total');
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
 * Get single job by ID
 */
const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [jobs] = await promisePool.query(`
            SELECT
                j.*,
                e.companyName,
                e.industry,
                e.location as companyLocation,
                e.website,
                e.logo,
                e.description as companyDescription,
                (SELECT COUNT(*) FROM applications WHERE jobID = j.jobID) as applicationsCount
            FROM job_postings j
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE j.jobID = ?
        `, [id]);

        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Increment views
        await promisePool.query(
            'UPDATE job_postings SET views = views + 1 WHERE jobID = ?',
            [id]
        );

        res.json({
            success: true,
            job: jobs[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Create new job posting (Employer only)
 */
const createJob = async (req, res, next) => {
    try {
        const userID = req.user.userID;

        // Get employer ID
        const [employers] = await promisePool.query(
            'SELECT employerID, isApproved FROM employers WHERE userID = ?',
            [userID]
        );

        if (employers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employer profile not found'
            });
        }

        if (!employers[0].isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Employer account pending approval. Cannot post jobs yet.'
            });
        }

        const employerID = employers[0].employerID;

        const {
            jobTitle,
            description,
            requirements,
            responsibilities,
            salary,
            salaryPeriod,
            location,
            jobType,
            category,
            experienceLevel,
            educationLevel,
            applicationDeadline
        } = req.body;

        const [result] = await promisePool.query(`
            INSERT INTO job_postings (
                employerID, jobTitle, description, requirements, responsibilities,
                salary, salaryPeriod, location, jobType, category, experienceLevel,
                educationLevel, applicationDeadline
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            employerID, jobTitle, description, requirements || null, responsibilities || null,
            salary || null, salaryPeriod || 'monthly', location, jobType || 'full-time',
            category || null, experienceLevel || 'entry', educationLevel || null,
            applicationDeadline || null
        ]);

        const [newJob] = await promisePool.query(
            'SELECT * FROM job_postings WHERE jobID = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Job posted successfully',
            job: newJob[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Update job posting
 */
const updateJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userID = req.user.userID;

        // Verify ownership
        const [jobs] = await promisePool.query(`
            SELECT j.jobID
            FROM job_postings j
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE j.jobID = ? AND e.userID = ?
        `, [id, userID]);

        if (jobs.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this job'
            });
        }

        const {
            jobTitle,
            description,
            requirements,
            responsibilities,
            salary,
            salaryPeriod,
            location,
            jobType,
            category,
            experienceLevel,
            educationLevel,
            applicationDeadline,
            isActive
        } = req.body;

        await promisePool.query(`
            UPDATE job_postings SET
                jobTitle = COALESCE(?, jobTitle),
                description = COALESCE(?, description),
                requirements = COALESCE(?, requirements),
                responsibilities = COALESCE(?, responsibilities),
                salary = COALESCE(?, salary),
                salaryPeriod = COALESCE(?, salaryPeriod),
                location = COALESCE(?, location),
                jobType = COALESCE(?, jobType),
                category = COALESCE(?, category),
                experienceLevel = COALESCE(?, experienceLevel),
                educationLevel = COALESCE(?, educationLevel),
                applicationDeadline = COALESCE(?, applicationDeadline),
                isActive = COALESCE(?, isActive)
            WHERE jobID = ?
        `, [
            jobTitle, description, requirements, responsibilities, salary,
            salaryPeriod, location, jobType, category, experienceLevel,
            educationLevel, applicationDeadline, isActive, id
        ]);

        const [updatedJob] = await promisePool.query(
            'SELECT * FROM job_postings WHERE jobID = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob[0]
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Delete job posting
 */
const deleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userID = req.user.userID;

        // Verify ownership
        const [jobs] = await promisePool.query(`
            SELECT j.jobID
            FROM job_postings j
            INNER JOIN employers e ON j.employerID = e.employerID
            WHERE j.jobID = ? AND e.userID = ?
        `, [id, userID]);

        if (jobs.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this job'
            });
        }

        // Soft delete (set isActive to false)
        await promisePool.query(
            'UPDATE job_postings SET isActive = FALSE WHERE jobID = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get job statistics
 */
const getJobStats = async (req, res, next) => {
    try {
        const userID = req.user.userID;

        // Get employer ID
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

        const employerID = employers[0].employerID;

        const [stats] = await promisePool.query(`
            SELECT
                COUNT(*) as totalJobs,
                SUM(CASE WHEN isActive = TRUE THEN 1 ELSE 0 END) as activeJobs,
                SUM(views) as totalViews,
                (SELECT COUNT(*) FROM applications a
                 INNER JOIN job_postings j ON a.jobID = j.jobID
                 WHERE j.employerID = ?) as totalApplications
            FROM job_postings
            WHERE employerID = ?
        `, [employerID, employerID]);

        res.json({
            success: true,
            stats: stats[0]
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getJobStats
};
