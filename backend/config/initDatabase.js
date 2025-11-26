/**
 * Database Initialization Script
 * Creates all necessary tables for KaziConnect
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
    let connection;

    try {
        // Connect to MySQL without specifying database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('📦 Connected to MySQL server');

        // Create database if not exists
        const dbName = process.env.DB_NAME || 'kaziconnect';
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database '${dbName}' created/verified`);

        // Use the database
        await connection.query(`USE ${dbName}`);

        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                userID INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('job-seeker', 'employer', 'admin') NOT NULL,
                registrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                isActive BOOLEAN DEFAULT TRUE,
                emailVerified BOOLEAN DEFAULT FALSE,
                lastLogin TIMESTAMP NULL,
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: users');

        // Create job_seekers table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS job_seekers (
                seekerID INT PRIMARY KEY AUTO_INCREMENT,
                userID INT UNIQUE NOT NULL,
                fullName VARCHAR(100) NOT NULL,
                phoneNumber VARCHAR(20),
                dateOfBirth DATE,
                gender ENUM('Male', 'Female', 'Other'),
                location VARCHAR(100),
                education TEXT,
                experience TEXT,
                skills TEXT,
                resumePath VARCHAR(255),
                profilePicture VARCHAR(255),
                bio TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
                INDEX idx_location (location),
                INDEX idx_fullname (fullName)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: job_seekers');

        // Create employers table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employers (
                employerID INT PRIMARY KEY AUTO_INCREMENT,
                userID INT UNIQUE NOT NULL,
                companyName VARCHAR(150) NOT NULL,
                industry VARCHAR(100),
                location VARCHAR(100),
                phoneNumber VARCHAR(20),
                website VARCHAR(255),
                companySize ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
                description TEXT,
                logo VARCHAR(255),
                isApproved BOOLEAN DEFAULT FALSE,
                approvedBy INT NULL,
                approvedDate TIMESTAMP NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
                FOREIGN KEY (approvedBy) REFERENCES users(userID) ON DELETE SET NULL,
                INDEX idx_company (companyName),
                INDEX idx_approved (isApproved)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: employers');

        // Create job_postings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS job_postings (
                jobID INT PRIMARY KEY AUTO_INCREMENT,
                employerID INT NOT NULL,
                jobTitle VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                requirements TEXT,
                responsibilities TEXT,
                salary DECIMAL(10, 2),
                salaryPeriod ENUM('hourly', 'monthly', 'yearly') DEFAULT 'monthly',
                location VARCHAR(100),
                jobType ENUM('full-time', 'part-time', 'contract', 'internship', 'remote') DEFAULT 'full-time',
                category VARCHAR(100),
                experienceLevel ENUM('entry', 'intermediate', 'senior', 'executive') DEFAULT 'entry',
                educationLevel VARCHAR(100),
                applicationDeadline DATE,
                postedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expiryDate DATE,
                isActive BOOLEAN DEFAULT TRUE,
                views INT DEFAULT 0,
                applicationsCount INT DEFAULT 0,
                FOREIGN KEY (employerID) REFERENCES employers(employerID) ON DELETE CASCADE,
                INDEX idx_title (jobTitle),
                INDEX idx_location (location),
                INDEX idx_category (category),
                INDEX idx_active (isActive),
                INDEX idx_posted (postedDate)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: job_postings');

        // Create applications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS applications (
                applicationID INT PRIMARY KEY AUTO_INCREMENT,
                seekerID INT NOT NULL,
                jobID INT NOT NULL,
                coverLetter TEXT,
                status ENUM('pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'accepted') DEFAULT 'pending',
                applicationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewedDate TIMESTAMP NULL,
                reviewedBy INT NULL,
                notes TEXT,
                FOREIGN KEY (seekerID) REFERENCES job_seekers(seekerID) ON DELETE CASCADE,
                FOREIGN KEY (jobID) REFERENCES job_postings(jobID) ON DELETE CASCADE,
                FOREIGN KEY (reviewedBy) REFERENCES users(userID) ON DELETE SET NULL,
                UNIQUE KEY unique_application (seekerID, jobID),
                INDEX idx_status (status),
                INDEX idx_date (applicationDate)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: applications');

        // Create notifications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                notificationID INT PRIMARY KEY AUTO_INCREMENT,
                recipientID INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                relatedType ENUM('application', 'job', 'profile', 'system') NULL,
                relatedID INT NULL,
                isRead BOOLEAN DEFAULT FALSE,
                sentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipientID) REFERENCES users(userID) ON DELETE CASCADE,
                INDEX idx_recipient (recipientID),
                INDEX idx_read (isRead),
                INDEX idx_date (sentDate)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: notifications');

        // Create disputes table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS disputes (
                disputeID INT PRIMARY KEY AUTO_INCREMENT,
                userID INT NOT NULL,
                subject VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                relatedType ENUM('job', 'application', 'employer', 'other') NULL,
                relatedID INT NULL,
                status ENUM('open', 'investigating', 'resolved', 'closed') DEFAULT 'open',
                priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
                filedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolvedDate TIMESTAMP NULL,
                resolvedBy INT NULL,
                resolution TEXT,
                FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
                FOREIGN KEY (resolvedBy) REFERENCES users(userID) ON DELETE SET NULL,
                INDEX idx_status (status),
                INDEX idx_priority (priority)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: disputes');

        // Create saved_jobs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS saved_jobs (
                savedID INT PRIMARY KEY AUTO_INCREMENT,
                seekerID INT NOT NULL,
                jobID INT NOT NULL,
                savedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (seekerID) REFERENCES job_seekers(seekerID) ON DELETE CASCADE,
                FOREIGN KEY (jobID) REFERENCES job_postings(jobID) ON DELETE CASCADE,
                UNIQUE KEY unique_saved (seekerID, jobID),
                INDEX idx_date (savedDate)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: saved_jobs');

        // Create activity_logs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                logID INT PRIMARY KEY AUTO_INCREMENT,
                userID INT NULL,
                action VARCHAR(100) NOT NULL,
                description TEXT,
                ipAddress VARCHAR(45),
                userAgent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE SET NULL,
                INDEX idx_user (userID),
                INDEX idx_action (action),
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table: activity_logs');

        // Create default admin user
        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('admin123', 10);

        await connection.query(`
            INSERT IGNORE INTO users (userID, username, email, password, role, isActive, emailVerified)
            VALUES (1, 'admin', 'admin@kaziconnect.co.ke', ?, 'admin', TRUE, TRUE)
        `, [adminPassword]);

        console.log('✅ Default admin user created (username: admin, password: admin123)');

        console.log('\n🎉 Database initialization completed successfully!\n');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Run if called directly
if (require.main === module) {
    initDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = initDatabase;
