/**
 * Profile Controller
 * Handles user profile operations
 */

const { promisePool } = require('../config/db');

/**
 * Get user profile
 */
const getProfile = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const role = req.user.role;

        const [users] = await promisePool.query(
            'SELECT userID, username, email, role, isActive, emailVerified FROM users WHERE userID = ?',
            [userID]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let profile = users[0];

        if (role === 'job-seeker') {
            const [seekers] = await promisePool.query(
                'SELECT * FROM job_seekers WHERE userID = ?',
                [userID]
            );
            if (seekers.length > 0) {
                profile = { ...profile, ...seekers[0] };
            }
        } else if (role === 'employer') {
            const [employers] = await promisePool.query(
                'SELECT * FROM employers WHERE userID = ?',
                [userID]
            );
            if (employers.length > 0) {
                profile = { ...employers[0], ...profile };
            }
        }

        res.json({
            success: true,
            user: profile
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Update profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const userID = req.user.userID;
        const role = req.user.role;

        if (role === 'job-seeker') {
            const {
                fullName,
                phoneNumber,
                dateOfBirth,
                gender,
                location,
                education,
                experience,
                skills,
                bio
            } = req.body;

            await promisePool.query(`
                UPDATE job_seekers SET
                    fullName = COALESCE(?, fullName),
                    phoneNumber = COALESCE(?, phoneNumber),
                    dateOfBirth = COALESCE(?, dateOfBirth),
                    gender = COALESCE(?, gender),
                    location = COALESCE(?, location),
                    education = COALESCE(?, education),
                    experience = COALESCE(?, experience),
                    skills = COALESCE(?, skills),
                    bio = COALESCE(?, bio),
                    updatedAt = NOW()
                WHERE userID = ?
            `, [
                fullName, phoneNumber, dateOfBirth, gender, location,
                education, experience, skills, bio, userID
            ]);

        } else if (role === 'employer') {
            const {
                companyName,
                industry,
                location,
                phoneNumber,
                website,
                companySize,
                description
            } = req.body;

            await promisePool.query(`
                UPDATE employers SET
                    companyName = COALESCE(?, companyName),
                    industry = COALESCE(?, industry),
                    location = COALESCE(?, location),
                    phoneNumber = COALESCE(?, phoneNumber),
                    website = COALESCE(?, website),
                    companySize = COALESCE(?, companySize),
                    description = COALESCE(?, description),
                    updatedAt = NOW()
                WHERE userID = ?
            `, [
                companyName, industry, location, phoneNumber,
                website, companySize, description, userID
            ]);
        }

        // Fetch updated profile
        const [users] = await promisePool.query(
            'SELECT userID, username, email, role FROM users WHERE userID = ?',
            [userID]
        );

        let profile = users[0];

        if (role === 'job-seeker') {
            const [seekers] = await promisePool.query(
                'SELECT * FROM job_seekers WHERE userID = ?',
                [userID]
            );
            if (seekers.length > 0) {
                profile = { ...profile, ...seekers[0] };
            }
        } else if (role === 'employer') {
            const [employers] = await promisePool.query(
                'SELECT * FROM employers WHERE userID = ?',
                [userID]
            );
            if (employers.length > 0) {
                profile = { ...profile, ...employers[0] };
            }
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: profile
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get public profile (view another user's profile)
 */
const getPublicProfile = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [users] = await promisePool.query(
            'SELECT userID, username, role FROM users WHERE userID = ? AND isActive = TRUE',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let profile = users[0];

        if (profile.role === 'job-seeker') {
            const [seekers] = await promisePool.query(
                'SELECT fullName, location, skills, education, experience, bio, profilePicture FROM job_seekers WHERE userID = ?',
                [id]
            );
            if (seekers.length > 0) {
                profile = { ...profile, ...seekers[0] };
            }
        } else if (profile.role === 'employer') {
            const [employers] = await promisePool.query(
                'SELECT companyName, industry, location, website, description, logo FROM employers WHERE userID = ? AND isApproved = TRUE',
                [id]
            );
            if (employers.length > 0) {
                profile = { ...profile, ...employers[0] };
            }
        }

        res.json({
            success: true,
            profile
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getPublicProfile
};
